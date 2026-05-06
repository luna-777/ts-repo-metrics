"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleHelp } from "lucide-react";

export type AiUsageSignalId =
  | "efficiency"
  | "safety-compliance"
  | "discovery-ratio"
  | "token-input"
  | "token-output"
  | "token-reasoning"
  | "token-peak";

const example = (lines: string[]) => (
  <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
    {lines.map((line) => (
      <li key={line} className="leading-relaxed">
        {line}
      </li>
    ))}
  </ul>
);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function signalBody(id: AiUsageSignalId): { title: string; content: ReactNode } {
  switch (id) {
    case "efficiency":
      return {
        title: "Efficiency",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                Efficiency reflects <strong className="text-foreground">workflow quality</strong> in the log: how
                focused your turns are (tools per prompt) and how much of the session mixes{" "}
                <strong className="text-foreground">exploration</strong> with action. It is{" "}
                <strong className="text-foreground">not</strong> session length, typing speed, or time to finish.
              </p>
            </Section>
            <Section title="How we measure it">
              <p>
                We combine two parts (see export docs): an{" "}
                <strong className="text-foreground">iteration score</strong> that rewards fewer tool calls per user
                prompt, and a <strong className="text-foreground">discovery score</strong> from your share of
                discovery-class tools vs discovery+action tools. The dashboard shows the weighted blend as a
                percentage.
              </p>
            </Section>
            <Section title="Example prompts and habits">
              {example([
                "Focused: “Summarize what auth/middleware.ts does, then propose one minimal change for X.”",
                "Vague (avoid): “Fix everything.”",
                "Splitting work: “First list three approaches; then implement only approach B.”",
              ])}
            </Section>
            <Section title="Related signals">
              <p>
                <strong className="text-foreground">Safety / compliance</strong> measures verification habits; it does{" "}
                <strong className="text-foreground">not</strong> change the Efficiency formula.
              </p>
            </Section>
          </div>
        ),
      };
    case "safety-compliance":
      return {
        title: "Safety / compliance",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                This score summarizes <strong className="text-foreground">verification-style habits</strong> in the
                tool stream: reading back after writes, running test-like shell commands when you use the terminal, and
                avoiding edits with no prior read/search in the same turn. It is{" "}
                <strong className="text-foreground">not</strong> a security audit or compliance certification.
              </p>
            </Section>
            <Section title="How we measure it">
              <p>
                We blend read-after-write rate and test-like shell usage when both exist, fall back to whichever is
                available, and fold in a penalty when many writes happen without a discovery tool earlier in the turn.
              </p>
            </Section>
            <Section title="Example prompts and habits">
              {example([
                "After that edit, re-read the file and list anything that could break existing callers.",
                "Run npm test (or your project’s test command) and paste failures before changing more code.",
              ])}
            </Section>
            <Section title="Related signals">
              <p>
                <strong className="text-foreground">Read-after-write</strong> is one ingredient. Test-like shell
                detection uses simple patterns (e.g. jest, pytest, npm test) on command text—only relevant when the agent
                logs shell tools.
              </p>
            </Section>
          </div>
        ),
      };
    case "discovery-ratio":
      return {
        title: "Discovery ratio",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                The percentage of tool calls classified as{" "}
                <strong className="text-foreground">discovery</strong> out of discovery +{" "}
                <strong className="text-foreground">action</strong> calls. It describes your{" "}
                <strong className="text-foreground">tool-call mix</strong>, not a course grade.
              </p>
            </Section>
            <Section title="How we measure it">
              <p>
                We count tool_call events and apply the analyzer’s discovery vs action sets.{" "}
                <strong className="text-foreground">Discovery depth</strong> (High / Medium / Low) buckets that ratio
                (High ≥38%, Medium between 18% and 38%, Low ≤18%).
              </p>
            </Section>
            <Section title="Example habits">
              {example([
                "Before a big Write burst, use Read or Grep to ground the change.",
                "Ask for tradeoffs: “What are two ways to implement this?” before picking one.",
              ])}
            </Section>
            <Section title="Related signals">
              <p>
                <strong className="text-foreground">Efficiency</strong> also uses exploration via its discovery
                component. The dashboard shows the depth label next to this percentage.
              </p>
            </Section>
          </div>
        ),
      };
    case "token-input":
      return {
        title: "Input tokens",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                Sum of reported <strong className="text-foreground">input</strong> token counts from usage rows the
                parser found in your export (often prompt/context size per turn or record).
              </p>
            </Section>
            <Section title="Good exports">
              <p>
                Session JSON/JSONL that include <code className="rounded bg-muted px-1 text-xs">usage</code> or
                equivalent fields on messages or synthetic <code className="rounded bg-muted px-1 text-xs">__usage__</code>{" "}
                events will populate this tile.
              </p>
            </Section>
          </div>
        ),
      };
    case "token-output":
      return {
        title: "Output tokens",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                Sum of reported <strong className="text-foreground">output</strong> tokens (model completion tokens)
                from the same usage records as input.
              </p>
            </Section>
            <Section title="Good exports">
              <p>If this stays empty, your file may omit token usage; re-export with usage enabled when your tool allows.</p>
            </Section>
          </div>
        ),
      };
    case "token-reasoning":
      return {
        title: "Reasoning tokens",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                Some models expose a separate reasoning token count. We sum it when present; otherwise this shows “—”.
              </p>
            </Section>
            <Section title="Good exports">
              <p>
                Depends on vendor and exporter; not all logs include reasoning splits.
              </p>
            </Section>
          </div>
        ),
      };
    case "token-peak":
      return {
        title: "Peak input tokens",
        content: (
          <div className="space-y-4">
            <Section title="What it means">
              <p>
                The <strong className="text-foreground">largest single input token value</strong> on any one usage record
                we parsed—the heaviest “row” in your export’s usage stream, not a second measure of totals.
              </p>
            </Section>
            <Section title="How we measure it">
              <p>
                We scan synthetic usage events and take the max of each record’s{" "}
                <code className="rounded bg-muted px-1 text-xs">input</code> number. Granularity matches your exporter
                (per message, per step, etc.).
              </p>
            </Section>
            <Section title="Good exports">
              <p>
                Useful to spot spikes in context size. If your tool does not attach per-record usage, this may be
                missing.
              </p>
            </Section>
          </div>
        ),
      };
    default:
      return { title: "Signal", content: null };
  }
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
          className={className ?? "size-7 shrink-0 text-muted-foreground hover:text-foreground"}
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

/** Short coaching line under Efficiency % (rounded 0–100). */
export function efficiencyBandHint(efficiencyPct: number): { className: string; text: string } {
  if (efficiencyPct > 75) {
    return {
      className: "",
      text: "",
    };
  }
  if (efficiencyPct >= 50) {
    return {
      className: "text-amber-600 dark:text-amber-400",
      text: "Room to sharpen prompts or balance exploration—see Learn more for ideas.",
    };
  }
  return {
    className: "text-red-600 dark:text-red-400",
    text: "Try smaller asks and more read/search before big writes; see Learn more.",
  };
}
