"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { buildReportSummary } from "@/lib/buildReportSummary";
import type { RepoReport } from "@/lib/reportTypes";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What is the biggest quality issue in this repo?",
  "How can I improve my test coverage?",
  "Explain my complexity score.",
  "What commit habits should I improve?",
  "Are there AI-generated code smells in this repo?",
];

interface RepoChatProps {
  report: RepoReport;
}

export function RepoChat({ report }: RepoChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reportSummary = useRef<string>("");

  useEffect(() => {
    reportSummary.current = buildReportSummary(report);
  }, [report]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      // Add an empty assistant message that will be filled by streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            reportSummary: reportSummary.current,
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "Sorry, I couldn't get a response. Please try again.",
            };
            return updated;
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snapshot = accumulated;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: snapshot,
            };
            return updated;
          });
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const repoName =
    report.source?.url?.replace("https://github.com/", "") ??
    report.repoPath ??
    "this repo";

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI coach" : "Open AI coach"}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[22rem] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl border-b border-border bg-muted/60 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Repo Coach</p>
              <p className="truncate text-xs text-muted-foreground">{repoName}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "22rem" }}>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  Ask me anything about your repo analysis.
                </p>
                <div className="flex flex-col gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {msg.role === "user" ? (
                      <User className="size-3" aria-hidden />
                    ) : (
                      <Bot className="size-3" aria-hidden />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted text-foreground"
                    }`}
                  >
                    {msg.content || (
                      <Loader2 className="size-3 animate-spin" aria-label="Thinking…" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 rounded-b-2xl border-t border-border px-3 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your repo…"
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              style={{ maxHeight: "7rem", overflowY: "auto" }}
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={streaming || !input.trim()}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {streaming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
