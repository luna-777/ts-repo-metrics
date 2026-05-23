import type OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { ClassifiedDoc, DocType, FileWithText } from "./types";

const CLASSIFIER_SYSTEM_PROMPT = `You are a document classifier for a university software engineering course.
Students submit project repositories containing planning and process documents.

Your job is to identify what type each document is, regardless of how it is named.
Students frequently abbreviate, misspell, or use non-standard filenames.

The possible document types are:
  release_plan       — The overall release plan for the project (one per project)
  sprint_plan        — Sprint planning document, one per sprint (numbered 1–4)
  sprint_report      — Sprint retrospective/report, one per sprint (numbered 1–4)
  test_plan          — System test plan and report
  definition_of_done — Definition of done criteria (may cover user stories and/or tasks)
  code_standards     — Coding style guide or standards (may be language-specific)
  unknown            — Cannot be classified with confidence

Common abbreviations and misspellings you will encounter:
  spr1.md, s2plan.md, sp3rep.md   → sprint plans/reports
  repot.md, sprnt2.md             → misspellings of report/sprint
  dod.md, def-done.md             → definition of done
  codestds.md, ts-stds.md         → code standards
  rel-plan.md, releasepl.md       → release plan

Strategy:
1. Look at ALL filenames together before classifying any — patterns like
   spr1/spr2/spr3 are strong signals even if each name alone is ambiguous.
2. Files in the documentation folder are primary candidates for all types.
3. Files outside the documentation folder are candidates for definition_of_done
   and code_standards only — do not classify them as sprint or release documents
   unless their content clearly indicates otherwise.
4. Use read_file_preview for any file you cannot classify confidently from its name.
5. Call submit_classifications once with all results when done.

For sprint_plan and sprint_report: always provide sprintNumber (1, 2, 3, or 4).
Extract sprint number from: filename digits, content heading "Sprint N", or parent
folder name. If you cannot determine the sprint number, use null.

For code_standards: provide the programming language if identifiable
(e.g. "TypeScript", "Python", "Java"). Use null for a general standards doc.

When in doubt between two types, call read_file_preview. Only use "unknown" if
you have read the file preview and still cannot classify it.`;

export const CLASSIFIER_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "read_file_preview",
      description:
        "Read the first 500 characters of a file's text content. " +
        "Call this for any file you cannot confidently classify from its filename alone.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Exact file path as listed in the file list",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_classifications",
      description:
        "Submit your final classification for every file. " +
        "Call this exactly once when you have classified all files.",
      parameters: {
        type: "object",
        properties: {
          classifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                docType: {
                  type: "string",
                  enum: [
                    "release_plan",
                    "sprint_plan",
                    "sprint_report",
                    "test_plan",
                    "definition_of_done",
                    "code_standards",
                    "unknown",
                  ],
                },
                sprintNumber: {
                  type: "number",
                  description: "Sprint number 1–4. Only for sprint_plan and sprint_report.",
                },
                language: {
                  type: "string",
                  description: "Programming language. Only for code_standards.",
                },
              },
              required: ["path", "docType"],
            },
          },
        },
        required: ["classifications"],
      },
    },
  },
];

const MAX_ITERATIONS = 10;
const CLASSIFIER_TIMEOUT_MS = 30_000;

function buildFileListMessage(docsPool: string[], repoWide: string[]): string {
  return [
    "=== DOCUMENTATION FOLDER FILES ===",
    docsPool.length ? docsPool.join("\n") : "(none)",
    "",
    "=== REPO-WIDE FILES (DoD / code standards candidates) ===",
    repoWide.length ? repoWide.join("\n") : "(none)",
    "",
    "Classify every file listed above.",
  ].join("\n");
}

function previewText(file: FileWithText | undefined): string {
  const source = file?.fullText ?? file?.text;
  if (!source) return "[File not found or text could not be extracted]";
  return source.slice(0, 500);
}

function mergeClassification(
  item: {
    path: string;
    docType: string;
    sprintNumber?: number | null;
    language?: string | null;
  },
  fileByPath: Map<string, FileWithText>,
): ClassifiedDoc {
  const file = fileByPath.get(item.path);
  const docType = item.docType as DocType;
  return {
    path: item.path,
    docType,
    sprintNumber: item.sprintNumber ?? null,
    language: item.language ?? null,
    text: file?.text ?? null,
    truncated: file?.truncated ?? false,
  };
}

function fallbackUnknown(files: FileWithText[]): ClassifiedDoc[] {
  return files.map((f) => ({
    path: f.path,
    docType: "unknown" as const,
    text: f.text,
    truncated: f.truncated,
  }));
}

export async function classifyDocs(
  files: FileWithText[],
  docsPool: string[],
  repoWide: string[],
  openai: OpenAI,
  signal?: AbortSignal,
): Promise<ClassifiedDoc[]> {
  const fileByPath = new Map(files.map((f) => [f.path, f]));
  const allPaths = new Set([...docsPool, ...repoWide]);

  if (allPaths.size === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
    { role: "user", content: buildFileListMessage(docsPool, repoWide) },
  ];

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 2048,
          messages,
          tools: CLASSIFIER_TOOLS,
          tool_choice: "auto",
        },
        { signal: combinedSignal },
      );

      const choice = completion.choices[0];
      if (!choice?.message) break;

      messages.push(choice.message);

      const toolCalls = choice.message.tool_calls;
      if (!toolCalls?.length) break;

      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const fn = call.function;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(fn.arguments) as Record<string, unknown>;
        } catch {
          args = {};
        }

        if (fn.name === "read_file_preview") {
          const path = String(args.path ?? "");
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: previewText(fileByPath.get(path)),
          });
          continue;
        }

        if (fn.name === "submit_classifications") {
          const list = args.classifications as Array<{
            path: string;
            docType: string;
            sprintNumber?: number | null;
            language?: string | null;
          }>;
          if (!Array.isArray(list)) {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: "Invalid classifications payload.",
            });
            continue;
          }

          const byPath = new Map(list.map((c) => [c.path, c]));
          const result: ClassifiedDoc[] = [];
          for (const path of [...allPaths].sort()) {
            const item = byPath.get(path);
            if (item) {
              result.push(mergeClassification(item, fileByPath));
            } else {
              result.push({
                path,
                docType: "unknown",
                text: fileByPath.get(path)?.text ?? null,
                truncated: fileByPath.get(path)?.truncated,
              });
            }
          }
          return result;
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "Unknown tool.",
        });
      }
    }
  } catch {
    return fallbackUnknown(files.filter((f) => allPaths.has(f.path)));
  } finally {
    clearTimeout(timeout);
  }

  return fallbackUnknown(files.filter((f) => allPaths.has(f.path)));
}
