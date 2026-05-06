"use client";

import { Info } from "lucide-react";
import { CoachInsightTone } from "@/components/results/coach/CoachInsightTone";
import type { RepoReport } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";

type ResultsTabId =
  | "rq1"
  | "rq2"
  | "rq3"
  | "rq3-react"
  | "phase2-complexity"
  | "phase3-pathology"
  | "ai-maturity"
  | "dataset";

interface ResultsTabPanelIntroProps {
  activeTab: string;
  report: RepoReport;
  className?: string;
}

function totalCommitsFromReport(report: RepoReport): number | null {
  const g = report.git?.totalCommits;
  if (typeof g === "number" && g > 0) return g;
  const cs = report.contributors?.map((c) => c.commitCount) ?? [];
  const sum = cs.reduce((a, b) => a + b, 0);
  return sum > 0 ? sum : null;
}

function TestingVerificationIntro({ report, className }: { report: RepoReport; className?: string }) {
  const testFiles = report.profile?.testFiles ?? 0;
  const pct = report.gitMetricsV2?.testCoupling?.pctCommitsTouchingTests ?? 0;
  const profile = report.profile;
  const testLocRatio =
    profile && profile.sourceLOC > 0 ? profile.testLOC / profile.sourceLOC : 0;
  const totalCommits = totalCommitsFromReport(report);
  const commitsNoun =
    totalCommits != null
      ? `${totalCommits} commit${totalCommits === 1 ? "" : "s"}`
      : "your commits";

  const needsTestingFocus = pct < 10 || testLocRatio < 0.12;

  const detailSentence = (() => {
    if (testFiles === 0 && pct <= 0) {
      return `The snapshot shows no test files yet, and none of ${commitsNoun} include test-path changes.`;
    }
    if (pct <= 0) {
      return `You have ${testFiles} test file${testFiles === 1 ? "" : "s"} but none of your recent commits are actively adding to them.`;
    }
    return `You have ${testFiles} test file${testFiles === 1 ? "" : "s"}, and about ${Math.round(pct)}% of ${commitsNoun} touch tests—there is still room to make verification a default part of every change.`;
  })();

  if (!needsTestingFocus) {
    return (
      <CoachInsightTone
        tone="positive"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Testing and verification"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Verification looks healthy relative to this snapshot: test share and commits touching tests are
          in a solid range. Use Core signals below to spot drift over the next analyses.
        </p>
      </CoachInsightTone>
    );
  }

  return (
    <CoachInsightTone
      tone="concern"
      className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
      aria-label="Testing and verification"
      bodyClassName="text-foreground/90 font-normal"
    >
      <p>
        Testing is your most important improvement area right now. {detailSentence} The good news: your
        commit discipline is already strong — you just need to attach testing to that existing habit. Here
        is what the data shows:
      </p>
    </CoachInsightTone>
  );
}

function tabBody(activeTab: string, report: RepoReport): { title: string; body: string } | null {
  const commit = report?.source?.commit?.slice(0, 7) ?? "";
  const commitBit = commit ? ` (commit ${commit})` : "";

  switch (activeTab as ResultsTabId) {
    case "rq1":
      return {
        title: "Commit habits",
        body: `Cadence, batch size, and how often changes land together. Numbers here come from git history${commitBit}—use them to see whether your rhythm is steady or bursty.`,
      };
    case "rq3":
      return {
        title: "Code quality",
        body:
          "Complexity, duplication, and maintainability heuristics from the static scan. Treat spikes as triage hints: simplify the worst hotspots first, then watch whether the distribution improves on the next analysis.",
      };
    case "rq3-react":
      return {
        title: "React & UI structure",
        body:
          "Hooks, JSX depth, and cohesion cues for TSX in scope. The goal is to spot components that are hard to reason about or unsafe to change—pair this view with your design system and review culture.",
      };
    case "phase2-complexity":
      return {
        title: "Code complexity",
        body:
          "Halstead and cognitive-style metrics per function. Use this when you need function-level detail beyond the headline quality cards—especially for refactors or grading assignments.",
      };
    case "phase3-pathology":
      return {
        title: "Code risks & smells",
        body:
          "Patterns that often correlate with review pain or runtime risk—empty catches, repeated glue code, and other “smells” from the scan. Confirm in context before treating any single flag as definitive.",
      };
    case "ai-maturity":
      return {
        title: "AI maturity",
        body:
          "Session-derived signals about how AI assistance shows up across the SDLC (when logs are available). This tab summarizes maturity heuristics—pair with your team’s norms, not as a stand-alone score.",
      };
    case "dataset":
      return {
        title: "Dataset export",
        body:
          "Research-grade fields extracted from this analysis for spreadsheets or downstream tools. Export includes the metrics you see in the UI plus identifiers needed for reproducibility.",
      };
    default:
      return null;
  }
}

export function ResultsTabPanelIntro({ activeTab, report, className }: ResultsTabPanelIntroProps) {
  if (activeTab === "rq2") {
    return <TestingVerificationIntro report={report} className={className} />;
  }

  const copy = tabBody(activeTab, report);
  if (!copy) return null;

  return (
    <div
      role="region"
      aria-label={`About: ${copy.title}`}
      className={cn(
        "flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm dark:bg-primary/[0.09]",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">{copy.title}</p>
        <p className="leading-relaxed text-muted-foreground">{copy.body}</p>
      </div>
    </div>
  );
}
