import { describe, expect, it, vi } from "vitest";
import { reviewDoc } from "../../lib/docReview/reviewDoc";
import { RUBRICS } from "../../lib/docReview/rubrics";
import type { ClassifiedDoc, DocType } from "../../lib/docReview/types";

function mockOpenAiSequence(messages: Array<unknown>) {
  const create = vi.fn();
  for (const message of messages) {
    create.mockResolvedValueOnce({
      choices: [{ message }],
    });
  }
  return {
    chat: {
      completions: {
        create,
      },
    },
  };
}

function structuredChecklist(docType: "release_plan" | "test_plan") {
  return Object.fromEntries(RUBRICS[docType].keys.map((key) => [key, true]));
}

function buildDoc(docType: DocType, path: string): ClassifiedDoc {
  return {
    path,
    docType,
    text: `# ${docType}\n\nThis is a test document with enough content to review.`,
    truncated: false,
  };
}

describe("reviewDoc", () => {
  it.each([
    {
      docType: "release_plan" as const,
      path: "documentation/release-plan.md",
      args: {
        checklist: structuredChecklist("release_plan"),
        coach: "Your team has a clear release scope and one concrete improvement to make.",
      },
    },
    {
      docType: "test_plan" as const,
      path: "documentation/test-plan.md",
      args: {
        checklist: structuredChecklist("test_plan"),
        coach: "Your team documents the scenarios well and can tighten the expected outputs.",
      },
    },
  ])(
    "retries and returns a structured review for $docType when the first response is plain text",
    async ({ docType, path, args }) => {
      const openai = mockOpenAiSequence([
        {
          role: "assistant",
          content: "Here is my review in prose instead of a tool call.",
        },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "submit_review",
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
      ]);

      const result = await reviewDoc(
        buildDoc(docType, path),
        new Map([[path, "Full document content"]]),
        ["TypeScript"],
        openai as never,
      );

      expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
      expect(result.error).toBeUndefined();
      expect(result.structured?.coach).toContain("Your team");
      expect(result.structured?.checklist).toBeTruthy();
    },
  );

  it.each([
    {
      docType: "definition_of_done" as const,
      path: "documentation/definition-of-done.md",
      args: {
        strengths:
          "Your team defines specific and testable criteria for both task-level and story-level work.",
        improvements:
          "Add an explicit product owner acceptance criterion to the story-level section.",
      },
    },
    {
      docType: "code_standards" as const,
      path: "documentation/code-standards.md",
      args: {
        strengths:
          "Your team cites a concrete style guide and includes enforceable naming and formatting rules.",
        improvements:
          "Add language-specific examples for the full stack used in the repository.",
      },
    },
  ])(
    "retries and returns a holistic review for $docType when the first response is plain text",
    async ({ docType, path, args }) => {
      const openai = mockOpenAiSequence([
        {
          role: "assistant",
          content: "Plain text response with no submit_review tool call.",
        },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_2",
              type: "function",
              function: {
                name: "submit_review",
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
      ]);

      const result = await reviewDoc(
        buildDoc(docType, path),
        new Map([[path, "Full document content"]]),
        ["TypeScript"],
        openai as never,
      );

      expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
      expect(result.error).toBeUndefined();
      expect(result.holistic?.strengths).toContain("Your team");
      expect(result.holistic?.improvements).toContain("Add");
    },
  );
});
