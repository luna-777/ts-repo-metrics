export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MAX_MESSAGES = 20;
const MAX_SUMMARY_CHARS = 12000; // ~3 000 tokens

const SYSTEM_PROMPT_TEMPLATE = `You are a code quality coach for a student developer. You have been given a structured analysis report for their GitHub repository. Your job is to help them understand their results and improve their software development practices across the SDLC.

REPO REPORT:
{reportSummary}

RULES:
1. Only answer questions about this specific repository and its report data.
2. Always cite the specific metric or section you are referring to.
3. Keep answers concise (3–5 sentences max) unless the student asks to elaborate.
4. Never provide full code solutions — guide and coach instead.
5. If asked about anything unrelated to software development or this repo, decline politely.
6. Use encouraging, student-friendly language. Frame weaknesses as growth opportunities.
7. Prioritize the most impactful SDLC gap when giving recommendations.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  reportSummary: string;
}

function isValidMessages(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        (m as Record<string, unknown>).role === "user" ||
        (typeof m === "object" &&
          m !== null &&
          (m as Record<string, unknown>).role === "assistant") &&
          typeof (m as Record<string, unknown>).content === "string",
    )
  );
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

  const { messages, reportSummary } = body;

  if (!isValidMessages(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
  }
  if (typeof reportSummary !== "string" || reportSummary.trim().length === 0) {
    return NextResponse.json(
      { error: "reportSummary is required." },
      { status: 400 },
    );
  }

  // Guardrail: cap message history
  const trimmedMessages = messages.slice(-MAX_MESSAGES);

  // Guardrail: cap report summary size
  const safeSummary = reportSummary.slice(0, MAX_SUMMARY_CHARS);

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
    "{reportSummary}",
    safeSummary,
  );

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
