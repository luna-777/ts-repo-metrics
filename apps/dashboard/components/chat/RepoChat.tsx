"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { buildReportSummary } from "@/lib/buildReportSummary";
import {
  buildReportJsonForCoach,
  MAX_REPORT_JSON_CHARS_CLIENT,
} from "@/lib/buildReportJsonForCoach";
import type { RepoReport } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const COACH_DISPLAY_NAME = "Cursor-style Repo Coach";

const STARTER_PROMPTS = [
  "What is the biggest quality issue in this repo?",
  "How can I improve my test coverage?",
  "Explain my complexity score.",
  "What commit habits should I improve?",
  "How is the test coverage proxy different from real coverage?",
];

interface RepoChatProps {
  report: RepoReport;
  onRegisterCoachSend?: (send: (userMessage: string) => void) => void;
}

export function RepoChat({ report, onRegisterCoachSend }: RepoChatProps) {
  const [open, setOpen] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<Element | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reportSummary = useRef<string>("");

  useEffect(() => {
    setHeaderSlot(document.getElementById("repo-coach-header-slot"));
  }, []);

  useEffect(() => {
    reportSummary.current = buildReportSummary(report);
  }, [report]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const { json: reportJson } = buildReportJsonForCoach(
        report,
        MAX_REPORT_JSON_CHARS_CLIENT,
      );

      const userMsg: Message = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            reportSummary: reportSummary.current,
            reportJson: reportJson ?? undefined,
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
    [messages, report, streaming],
  );

  const coachSendFromExplainer = useCallback(
    (t: string) => {
      const trimmed = t.trim();
      if (!trimmed || streaming) return;
      setOpen(true);
      void sendMessage(trimmed);
    },
    [sendMessage, streaming],
  );

  useEffect(() => {
    onRegisterCoachSend?.(coachSendFromExplainer);
  }, [onRegisterCoachSend, coachSendFromExplainer]);

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

  const headerTrigger =
    headerSlot ? createPortal(
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          open ? `Close ${COACH_DISPLAY_NAME}` : `Open ${COACH_DISPLAY_NAME}`
        }
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#262626] bg-transparent px-2.5 text-xs font-medium text-[#a1a1a1] transition-colors",
          "hover:border-[#404040] hover:text-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <MessageSquare className="size-3.5 shrink-0 opacity-80" aria-hidden />
        <span className="hidden sm:inline">Chat</span>
      </button>,
      headerSlot,
    ) : null;

  return (
    <>
      {headerTrigger}

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              key="repo-chat-backdrop"
              aria-label="Close chat"
              className="fixed inset-0 z-[44] bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              key="repo-chat-panel"
              role="dialog"
              aria-labelledby="repo-coach-title"
              className={cn(
                "fixed top-16 right-0 z-[45] flex h-[calc(100dvh-4rem)] w-full max-w-[440px] flex-col border-l border-border bg-background shadow-xl",
              )}
              initial={{ x: "100%", opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.98 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
                <div className="min-w-0 flex-1">
                  <p
                    id="repo-coach-title"
                    className="line-clamp-2 text-sm font-medium leading-tight text-foreground"
                  >
                    {COACH_DISPLAY_NAME}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={repoName}>
                    {repoName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
                  {messages.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
                        Ask about this analysis — metrics, habits, and next steps.
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {STARTER_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => void sendMessage(prompt)}
                            className="rounded-md border border-border/80 bg-muted/30 px-2.5 py-2 text-left text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) =>
                      msg.role === "user" ? (
                        <div key={i} className="flex justify-end">
                          <div className="max-w-[90%] rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="text-[13px] leading-relaxed text-foreground [&_code]:rounded [&_code]:bg-muted/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px]"
                        >
                          {msg.content || (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
                          )}
                        </div>
                      ),
                    )
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="shrink-0 border-t border-border p-2">
                  <div className="flex items-end gap-2 rounded-md border border-border bg-muted/20 p-1.5">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about this repo analysis…"
                      rows={2}
                      disabled={streaming}
                      className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage(input)}
                      disabled={streaming || !input.trim()}
                      aria-label="Send"
                      className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {streaming ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Send className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
