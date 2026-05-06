"use client";

import { Info } from "lucide-react";
import { CoachInsightTone } from "@/components/results/coach/CoachInsightTone";
import type { RepoReport } from "@/lib/reportTypes";
import { tryGetPhase2Summary } from "@/lib/phase2Summary";
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

function CodeQualityPanelIntro({ report, className }: { report: RepoReport; className?: string }) {
  const maint = report.maintainability?.score ?? 0;
  const highCx = report.complexity?.highComplexityFunctions ?? 0;
  const maxCx = report.complexity?.max ?? 0;
  const dup = report.duplication?.percentage ?? 0;
  const hasMaint = Boolean(report.maintainability);

  const looksStrong =
    (!hasMaint || maint >= 55) && highCx <= 10 && maxCx <= 25 && dup <= 10;

  const needsAttention =
    (hasMaint && maint < 40) || highCx > 25 || maxCx > 35 || dup > 20;

  if (needsAttention) {
    return (
      <CoachInsightTone
        tone="concern"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Code quality"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Structural risk is elevated in this snapshot—either maintainability is low, duplication or
          peak complexity is high, or many functions exceed the engine&apos;s high-complexity
          threshold. Prioritize the hotspot tables below, then re-run analysis to confirm the
          distribution tightens.
        </p>
      </CoachInsightTone>
    );
  }

  if (looksStrong) {
    return (
      <CoachInsightTone
        tone="positive"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Code quality"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Headline complexity and duplication look manageable relative to this scan. Use Core
          signals and additional metrics below to catch drift—complexity tends to creep in as teams
          ship faster.
        </p>
      </CoachInsightTone>
    );
  }

  return (
    <CoachInsightTone
      tone="informational"
      className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
      aria-label="Code quality"
      bodyClassName="text-foreground/90 font-normal"
    >
      <p>
        This view summarizes cyclomatic complexity, maintainability heuristics, and duplication from
        the static scan. Treat spikes as triage: simplify the worst hotspots first, then compare the
        next analysis run.
      </p>
    </CoachInsightTone>
  );
}

function ReactComponentsPanelIntro({ report, className }: { report: RepoReport; className?: string }) {
  const rm = report.reactMetrics;
  if (!rm) {
    return (
      <CoachInsightTone
        tone="informational"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="React components"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          TSX-focused signals appear here when the analyzer emits a{" "}
          <code className="rounded bg-muted px-1">reactMetrics</code> block for this run. Open Core
          signals below after you re-run with the current engine if this tab looks empty.
        </p>
      </CoachInsightTone>
    );
  }

  const s = rm.summary;
  const tampere = s.tampereJsxDepthExceededCount;
  const ferreira = s.ferreiraLackOfCohesionCount;
  const components = s.componentsAnalyzed;

  const needsAttention =
    tampere >= 5 || ferreira >= 4 || s.totalMissingOrInvalidDepsArray >= 20;

  const looksCalm =
    tampere <= 2 && ferreira === 0 && s.totalConditionalHookCalls === 0;

  if (needsAttention) {
    return (
      <CoachInsightTone
        tone="concern"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="React components"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Your React surface needs attention—about <strong className="text-foreground">{tampere}</strong>{" "}
          component{tampere === 1 ? "" : "s"} exceed the JSX depth threshold and{" "}
          <strong className="text-foreground">{ferreira}</strong> show lack-of-cohesion heuristics across{" "}
          <strong className="text-foreground">{components}</strong> analyzed component
          {components === 1 ? "" : "s"}. Focus on shrinking oversized components and tightening hooks
          before adding new UI.
        </p>
      </CoachInsightTone>
    );
  }

  if (looksCalm) {
    return (
      <CoachInsightTone
        tone="positive"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="React components"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          TSX signals look relatively healthy: shallow JSX and few cohesion flags relative to{" "}
          {components} components. Use Additional signals and the oversized table below to catch
          regressions on the next run.
        </p>
      </CoachInsightTone>
    );
  }

  return (
    <CoachInsightTone
      tone="informational"
      className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
      aria-label="React components"
      bodyClassName="text-foreground/90 font-normal"
    >
      <p>
        Static TSX metrics cover cohesion, JSX depth, prop pass-through, and hook-safety heuristics.
        Prioritize the largest components in the table below, then revisit hook dependency hygiene.
      </p>
    </CoachInsightTone>
  );
}

function CodeComplexityPanelIntro({ report, className }: { report: RepoReport; className?: string }) {
  const p2 = tryGetPhase2Summary(report);
  const rm = report.reactMetrics?.summary;

  if (!p2) {
    return (
      <CoachInsightTone
        tone="informational"
        className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
        aria-label="Code complexity"
        bodyClassName="text-foreground/90 font-normal"
      >
        <p>
          Phase 2 lexical and cognitive metrics appear here once functions include Halstead volume,
          cognitive complexity, and GRAD-AI-style <code className="rounded bg-muted px-1">MI_norm</code>. Re-run
          with the current <code className="rounded bg-muted px-1">@repo-metrics/engine</code> if this tab looks empty.
        </p>
      </CoachInsightTone>
    );
  }

  const mi = p2.miNormMean;
  const coc = p2.cognitiveMean;
  const hal = p2.halsteadVolMean;

  const miConcern = mi < 55;
  const cocConcern = coc > 12;
  const halConcern = hal > 180;

  let reactSentence: string | null = null;
  if (rm) {
    const bits: string[] = [];
    if (rm.tampereJsxDepthExceededCount > 0) {
      bits.push(
        `${rm.tampereJsxDepthExceededCount} component${rm.tampereJsxDepthExceededCount === 1 ? "" : "s"} have JSX nesting deeper than 5 levels`,
      );
    }
    if (rm.ferreiraLackOfCohesionCount > 0) {
      bits.push(
        `${rm.ferreiraLackOfCohesionCount} component${rm.ferreiraLackOfCohesionCount === 1 ? "" : "s"} lack cohesion heuristics`,
      );
    }
    if (rm.totalMissingOrInvalidDepsArray > 0) {
      bits.push(
        `${rm.totalMissingOrInvalidDepsArray} hook dependenc${rm.totalMissingOrInvalidDepsArray === 1 ? "y is" : "ies are"} missing or invalid`,
      );
    }
    if (bits.length > 0) {
      reactSentence = bits.join(", ") + ". ";
    }
    if (rm.totalConditionalHookCalls === 0) {
      reactSentence =
        (reactSentence ?? "") +
        "Your hook safety is solid with zero conditional hook calls — a strong foundation to build on. ";
    }
  }

  const concerns = [miConcern, cocConcern, halConcern].filter(Boolean).length;
  const tone: "positive" | "concern" | "informational" =
    concerns >= 2 ? "concern" : concerns === 0 && !reactSentence ? "positive" : "informational";

  const scorePhrase =
    mi >= 70
      ? "healthy relative to the GRAD-AI maintainability band"
      : mi >= 55
        ? "above the danger zone but with room to improve"
        : "in a range where refactors will pay off quickly";

  return (
    <CoachInsightTone
      tone={tone}
      className={cn("bg-card shadow-sm ring-1 ring-border/40", className)}
      aria-label="Code complexity"
      bodyClassName="text-foreground/90 font-normal"
    >
      <p>
        Your code complexity profile is <strong className="text-foreground">{scorePhrase}</strong>
        — mean <strong className="text-foreground">MI_norm</strong>{" "}
        <strong className="text-foreground">{mi.toFixed(1)}</strong>, mean cognitive complexity{" "}
        <strong className="text-foreground">{coc.toFixed(2)}</strong>, mean Halstead volume{" "}
        <strong className="text-foreground">{hal.toFixed(1)}</strong>
        {reactSentence ? (
          <>
            . There are some important areas to address: {reactSentence}
          </>
        ) : (
          ". "
        )}
        Focus on the cognitive and Halstead outliers in the table below—simplifying the largest functions will move
        the averages fastest. Here is what the data shows:
      </p>
    </CoachInsightTone>
  );
}

function tabBody(activeTab: string): { title: string; body: string } | null {
  switch (activeTab as ResultsTabId) {
    case "phase3-pathology":
      return {
        title: "Code risks & smells",
        body:
          "Patterns that often correlate with review pain or runtime risk—empty catches, repeated glue code, and other “smells” from the scan. Confirm in context before treating any single flag as definitive.",
      };
    case "ai-maturity":
      return {
        title: "AI usage",
        body:
          "Upload a CSV from agent_stats or a JSON/JSONL session export to chart tool traces, phase spread, and a compact scorecard (efficiency, verification-style proxies, patterns). Use it as a mirror for habits—not a grade.",
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

  if (activeTab === "rq3") {
    return <CodeQualityPanelIntro report={report} className={className} />;
  }

  if (activeTab === "rq3-react") {
    return <ReactComponentsPanelIntro report={report} className={className} />;
  }

  if (activeTab === "phase2-complexity") {
    return <CodeComplexityPanelIntro report={report} className={className} />;
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
