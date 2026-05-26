"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AiUsageSignalId =
  | "input-tokens"
  | "output-tokens"
  | "cache-hit-rate"
  | "tokens-per-prompt"
  | "avg-prompt-length"
  | "detailed-prompt-rate"
  | "short-prompt-rate"
  | "message-capture-rate"
  | "total-prompts"
  | "total-tool-calls"
  | "active-days"
  | "prompts-per-day"
  | "exploration-share"
  | "generation-share"
  | "verification-share"
  | "workflow-diagnostic"
  | "sessions"
  | "avg-prompts-per-session"
  | "avg-tools-per-session"
  | "tool-calls-per-prompt"
  | "write-ratio"
  | "read-after-write-rate";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export const AI_USAGE_METRIC_HELP: Record<
  AiUsageSignalId,
  { title: string; what: string; why: string; how: string }
> = {
  "input-tokens": {
    title: "Input tokens",
    what:
      "The total amount of prompt and context text sent to the model across the uploaded CSV.",
    why:
      "Large inputs usually mean the model is carrying more context, which can make runs slower and more expensive.",
    how:
      "Keep prompts scoped to one task, avoid pasting more code than needed, and reuse focused sessions instead of reloading huge context every turn.",
  },
  "output-tokens": {
    title: "Output tokens",
    what:
      "The total amount of model-generated text returned across the uploaded CSV.",
    why:
      "Large outputs can be useful when the assistant is explaining or drafting, but they often signal over-broad asks when they stay high on simple tasks.",
    how:
      "Ask for smaller steps, request summaries before full rewrites, and constrain the expected output format.",
  },
  "cache-hit-rate": {
    title: "Cache hit rate",
    what:
      "The share of cache reads out of total cache-related token traffic in the upload.",
    why:
      "Higher cache reuse usually means faster, cheaper follow-up turns because the model can reuse prior context instead of reprocessing it from scratch.",
    how:
      "Work in coherent sessions, avoid restarting the same task repeatedly, and keep prompts focused so useful context stays reusable.",
  },
  "tokens-per-prompt": {
    title: "Tokens per prompt",
    what:
      "The average total input plus output tokens consumed for each user prompt.",
    why:
      "This shows how expensive each interaction is on average. A rising value often means prompts are getting broader or responses are becoming less constrained.",
    how:
      "Shrink tasks, ask for one decision at a time, and prefer targeted file references over broad context dumps.",
  },
  "avg-prompt-length": {
    title: "Average prompt length",
    what:
      "The average number of characters in captured user prompts when the CSV includes message text.",
    why:
      "Very short prompts are often vague. Longer prompts are not automatically better, but they usually carry more constraints and context.",
    how:
      "Name the goal, files, constraints, and success criteria instead of opening with a bare request like “fix it”.",
  },
  "detailed-prompt-rate": {
    title: "Detailed prompt rate",
    what:
      "The share of captured prompts that are at least 200 characters long.",
    why:
      "This helps show how often the team gives the assistant enough room for context, constraints, and acceptance criteria.",
    how:
      "For larger tasks, include relevant files, expected behavior, and boundaries so the assistant is not forced to guess intent.",
  },
  "short-prompt-rate": {
    title: "Short prompt rate",
    what:
      "The share of captured prompts shorter than 50 characters.",
    why:
      "A high rate usually means the assistant is being asked to infer too much from minimal direction, which tends to create rework.",
    how:
      "Turn one-line asks into scoped requests with constraints, target files, and a clear definition of done.",
  },
  "message-capture-rate": {
    title: "Prompt capture rate",
    what:
      "The share of prompts in the CSV that include a captured message body.",
    why:
      "Prompt-quality metrics only reflect prompts that were actually exported. A low capture rate means the prompt section is incomplete.",
    how:
      "Re-export the CSV with --messages so the dashboard can analyze prompt detail and quality reliably.",
  },
  "total-prompts": {
    title: "Total prompts",
    what:
      "The number of user prompts recorded in the uploaded CSV.",
    why:
      "It gives basic scale: how much the team interacted with the assistant during the captured period.",
    how:
      "Treat this as context, not a target. Focus on better prompts and healthier workflow patterns rather than trying to maximize prompt count.",
  },
  "total-tool-calls": {
    title: "Total tool calls",
    what:
      "The number of tool-call events in the uploaded CSV.",
    why:
      "This shows how agentic the workflow was. Too many tool calls per task can mean churn, but too few can mean shallow use.",
    how:
      "Use tools deliberately: read/search before edits, then verify after bigger changes instead of bouncing through many unfocused steps.",
  },
  "active-days": {
    title: "Active days",
    what:
      "The number of days with at least one prompt in the 40-day activity window shown on the tab.",
    why:
      "It shows how consistently the team is using AI across the working period instead of clustering all usage into one burst.",
    how:
      "Use AI in smaller, repeatable sessions during the week rather than relying only on last-minute marathons.",
  },
  "prompts-per-day": {
    title: "Prompts per active day",
    what:
      "The average number of prompts on days when the team used AI in the 40-day window.",
    why:
      "This helps distinguish steady use from intense bursts. Very high values can indicate cramming or noisy sessions.",
    how:
      "Break work into shorter sessions, define the next subtask before prompting, and stop when the assistant drifts from the current goal.",
  },
  "exploration-share": {
    title: "Exploration share",
    what:
      "The percentage of tool calls grouped as exploration, such as reads and searches.",
    why:
      "Exploration is how the assistant gets grounded in the codebase before making changes. Too little exploration often means context-free edits.",
    how:
      "Before asking for a change, point the assistant at the right files or ask it to inspect and summarize relevant code first.",
  },
  "generation-share": {
    title: "Generation share",
    what:
      "The percentage of tool calls grouped as writes and edits.",
    why:
      "Generation is the part of the workflow where the assistant changes code or docs. A very high share often means the team is trusting output too quickly.",
    how:
      "Reduce broad rewrite requests, review generated diffs carefully, and add more exploration or verification around larger edits.",
  },
  "verification-share": {
    title: "Verification / execution share",
    what:
      "The percentage of tool calls grouped as execution or review steps, such as shell commands.",
    why:
      "This is a proxy for how often the workflow includes checking work instead of only generating it.",
    how:
      "After larger edits, run the relevant checks, tests, or review commands before moving on to the next change.",
  },
  "workflow-diagnostic": {
    title: "Workflow diagnostic",
    what:
      "A short interpretation of the grouped exploration, generation, and verification shares.",
    why:
      "Students usually need meaning more than raw percentages. This diagnostic turns the mix into a habit-level readout.",
    how:
      "Use the warning text as the next-session goal: add more exploration when edits are context-free, or more verification when changes are not being checked.",
  },
  sessions: {
    title: "Sessions",
    what:
      "The number of distinct session IDs captured in the uploaded CSV.",
    why:
      "This shows how the work was spread across separate AI-assisted sessions instead of one continuous run.",
    how:
      "Prefer clear session boundaries: start a new session when switching tasks, and keep each session focused on one problem area.",
  },
  "avg-prompts-per-session": {
    title: "Average prompts per session",
    what:
      "The average number of user prompts inside each recorded session.",
    why:
      "This helps show whether sessions are short and focused or long and possibly drifting.",
    how:
      "Break large tasks into smaller sessions and restart with a clearer scoped prompt when a session becomes noisy or unfocused.",
  },
  "avg-tools-per-session": {
    title: "Average tool calls per session",
    what:
      "The average number of tool-call events inside each recorded session.",
    why:
      "This is a rough proxy for how deeply the assistant operated during a session.",
    how:
      "If this climbs too high, tighten prompt scope and reduce repeated exploratory loops before editing.",
  },
  "tool-calls-per-prompt": {
    title: "Tool calls per prompt",
    what:
      "The average number of tool calls that happen for each user prompt.",
    why:
      "High values can mean the assistant needs many steps to resolve a request, which often reflects vague prompts or over-broad tasks.",
    how:
      "State the goal, files, and success criteria up front so the assistant needs fewer discovery and repair cycles.",
  },
  "write-ratio": {
    title: "Write ratio",
    what:
      "The share of all tool calls that are direct code-changing actions such as Write, Edit, MultiEdit, or ApplyPatch.",
    why:
      "A high write ratio is not automatically bad, but it increases the need for review and verification because more of the trace is making changes.",
    how:
      "Pair write-heavy sessions with more read/search grounding and more explicit review steps before accepting the output.",
  },
  "read-after-write-rate": {
    title: "Read-after-write rate",
    what:
      "The share of write-followed events where the next tool call is a Read.",
    why:
      "This is a simple proxy for whether the workflow checks generated edits before moving on.",
    how:
      "After a major write or edit, immediately re-read the changed file or diff and verify the change against the original request.",
  },
};

function signalBody(signalId: AiUsageSignalId): {
  title: string;
  content: ReactNode;
} {
  const entry = AI_USAGE_METRIC_HELP[signalId];
  return {
    title: entry.title,
    content: (
      <div className="space-y-4">
        <Section title="What is this data?">
          <p>{entry.what}</p>
        </Section>
        <Section title="Why is it important?">
          <p>{entry.why}</p>
        </Section>
        <Section title="How do I improve it?">
          <p>{entry.how}</p>
        </Section>
      </div>
    ),
  };
}

export function AiUsageSignalLearnMore({
  signalId,
  className,
}: {
  signalId: AiUsageSignalId;
  className?: string;
}) {
  const { title, content } = signalBody(signalId);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={
            className ??
            "size-7 shrink-0 text-muted-foreground hover:text-foreground"
          }
          aria-label={`Learn more: ${title}`}
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,36rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
