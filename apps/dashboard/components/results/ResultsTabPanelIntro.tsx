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

function CommitHabitsPanelIntro({ report, className }: { report: RepoReport; className?: string }) {
  const git = report.git;
  const tc = git?.totalCommits ?? 0;
  const cpw = git?.commitsPerWeek ?? 0;
  const hasV2 = Boolean(report.gitMetricsV2);

  const recentWindowEmpty = tc > 0 && cpw === 0;

  const cadenceStrong = tc >= 15 && cpw >= 1.2;
  const cadenceWeak =
    tc < 8 || (cpw > 0 && cpw < 0.35) || (tc > 0 && cpw === 0 && !hasV2);

  if (recentWindowEmpty && hasV2) {
    return (
      <CoachInsightTone
        tone="informational"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Commit habits"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          This analysis found <strong className="text-foreground">{tc}</strong> commits in history, but{" "}
          <strong className="text-foreground">none in the recent 13-week window</strong> used for
          weekly cadence. Activity below reflects full-history totals; integrate again to refresh signals.
        </p>
      </CoachInsightTone>
    );
  }

  if (cadenceStrong) {
    return (
      <CoachInsightTone
        tone="positive"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Commit habits"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Commit habits look healthy in this snapshot—about{" "}
          <strong className="text-foreground">{cpw.toFixed(1)}</strong> commits per week with{" "}
          <strong className="text-foreground">{tc}</strong> commits in parsed history. Use Core signals
          below to watch for drift on the next analysis.
        </p>
      </CoachInsightTone>
    );
  }

  if (cadenceWeak) {
    return (
      <CoachInsightTone
        tone="concern"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Commit habits"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Commit volume or cadence looks thin compared with active teams. Even small, frequent pushes
          improve integration and review. Check git mode in your export (API-only runs sometimes omit
          line stats) and aim for steadier batches below.
        </p>
      </CoachInsightTone>
    );
  }

  return (
    <CoachInsightTone
      tone="informational"
      className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
      aria-label="Commit habits"
      bodyClassName="text-foreground/90 font-normal"
    >
      <p>
        You have <strong className="text-foreground">{tc}</strong> commits in parsed history and about{" "}
        <strong className="text-foreground">{cpw.toFixed(1)}</strong> commits per week in the recent
        window—reasonable rhythm. Refine batch size and bursts using the signals and commit activity
        below.
      </p>
    </CoachInsightTone>
  );
}

function tabBody(activeTab: string): { title: string; body: string } | null {
  switch (activeTab as ResultsTabId) {
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

  if (activeTab === "rq1") {
    return <CommitHabitsPanelIntro report={report} className={className} />;
  }

  const copy = tabBody(activeTab);
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
