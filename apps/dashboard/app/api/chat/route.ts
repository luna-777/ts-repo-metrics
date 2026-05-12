export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCoachContextText,
  MAX_COACH_CONTEXT_CHARS,
} from "@/lib/coachContextBundle";

const MAX_MESSAGES = 20;
const MAX_SUMMARY_CHARS = 12_000;
const MAX_SUMMARY_CHARS_WHEN_JSON = 4_000;
const MAX_REPORT_JSON_CHARS_SERVER = 150_000;

function buildSystemPromptParts(opts: {
  coachContext: string;
  reportSummary: string;
  reportJson: string | null;
  reportJsonParseFailed: boolean;
}): string {
  const { coachContext, reportSummary, reportJson, reportJsonParseFailed } = opts;

  const jsonSection =
    reportJsonParseFailed
      ? "REPORT_JSON was omitted because the client payload was not valid JSON."
      : reportJson
        ? `REPORT_JSON (structured analysis; prefer these keys for exact numbers and file paths):\n${reportJson}`
        : "REPORT_JSON was omitted — the report was too large even after reduction. Rely on REPORT_SUMMARY and COACH_CONTEXT; say when detail is unavailable.";

  return `You are a code quality coach for a student developer. You are given COACH_CONTEXT (definitions and methodology), REPORT_SUMMARY (text digest), and optionally REPORT_JSON (structured metrics).

COACH_CONTEXT:
${coachContext}

REPORT_SUMMARY:
${reportSummary}

${jsonSection}

COACHING RULES:
1. Only answer about this repository and its analysis data. If something is not in the summary or JSON, say you do not see it — do not invent metrics or file paths.
2. For numeric facts and file names, prefer REPORT_JSON when present; use COACH_CONTEXT for what metrics mean and how they are computed.
3. Cite the metric or section you mean (e.g. profile.totalLOC, complexity.highComplexityFunctions).
4. Default to 3–5 concise sentences; expand only if the student asks.
5. Do not dump full code solutions — coach with steps, tradeoffs, and small illustrative fragments only if asked.
6. Decline politely for topics unrelated to software development or this repo.
7. Do not request or repeat secrets, tokens, or API keys. Do not help bypass security or policies.
8. Use encouraging language; frame gaps as improvement opportunities.
9. If REPORT_JSON was omitted or truncated in the payload, state that limits apply and lean on REPORT_SUMMARY.`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  reportSummary: string;
  /** Minified JSON string; must parse. Omitted or empty when too large client-side. */
  reportJson?: string | null;
}

function isValidMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((m) => {
    if (typeof m !== "object" || m === null) return false;
    const r = m as Record<string, unknown>;
    if (r.role !== "user" && r.role !== "assistant") return false;
    return typeof r.content === "string";
  });
}

export async function POST(req: NextRequest): Promise<NextResponse | Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant is not configured." },
      { status: 503 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages, reportSummary, reportJson: rawReportJson } = body;

  if (!isValidMessages(messages)) {
    return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
  }
  if (typeof reportSummary !== "string" || reportSummary.trim().length === 0) {
    return NextResponse.json(
      { error: "reportSummary is required." },
      { status: 400 },
    );
  }

  const trimmedMessages = messages.slice(-MAX_MESSAGES);

  let reportJson: string | null = null;
  let reportJsonParseFailed = false;

  if (typeof rawReportJson === "string" && rawReportJson.trim().length > 0) {
    const capped = rawReportJson.slice(0, MAX_REPORT_JSON_CHARS_SERVER);
    try {
      JSON.parse(capped);
      reportJson = capped;
    } catch {
      reportJsonParseFailed = true;
    }
  }

  const hasStructuredJson = reportJson !== null && !reportJsonParseFailed;
  const summaryCap = hasStructuredJson ? MAX_SUMMARY_CHARS_WHEN_JSON : MAX_SUMMARY_CHARS;
  const safeSummary = reportSummary.slice(0, summaryCap);

  const coachContext = getCoachContextText().slice(0, MAX_COACH_CONTEXT_CHARS);

  const systemPrompt = buildSystemPromptParts({
    coachContext,
    reportSummary: safeSummary,
    reportJson,
    reportJsonParseFailed,
  });

  const client = new OpenAI({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiStream = await client.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          max_tokens: 512,
          messages: [
            { role: "system", content: systemPrompt },
            ...trimmedMessages,
          ],
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(new TextEncoder().encode(delta));
          }
        }
      } catch (err) {
        const msg =
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "AI assistant error.";
        controller.enqueue(new TextEncoder().encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
