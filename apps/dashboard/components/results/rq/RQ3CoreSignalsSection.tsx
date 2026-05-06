"use client";

import type { RepoReport } from "@/lib/reportTypes";
import { RqSignalCard, type RqSignalTier } from "./CoreSignalsPrimitives";

interface RQ3CoreSignalsSectionProps {
  report: RepoReport;
}

function formatInt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

function tierTotalFunctions(n: number): RqSignalTier {
  if (n <= 0) return "critical";
  if (n < 15) return "good";
  return "strong";
}

function tierHighComplexityCount(n: number): RqSignalTier {
  if (n === 0) return "strong";
  if (n <= 5) return "good";
  if (n <= 20) return "needs_work";
  return "critical";
}

function tierMaxComplexity(n: number): RqSignalTier {
  if (n <= 10) return "strong";
  if (n <= 20) return "good";
  if (n <= 35) return "needs_work";
  return "critical";
}

export function RQ3CoreSignalsSection({ report }: RQ3CoreSignalsSectionProps) {
  const total = report.totals?.functions ?? 0;
  const highCx = report.complexity?.highComplexityFunctions ?? 0;
  const maxCx = report.complexity?.max ?? 0;

  const tTotal = tierTotalFunctions(total);
  const tHigh = tierHighComplexityCount(highCx);
  const tMax = tierMaxComplexity(maxCx);

  const descTotal = (() => {
    if (total <= 0) {
      return "No function-like nodes were counted—confirm analyzable paths and language scope.";
    }
    if (total < 15) {
      return `Only ${formatInt(total)} functions matched—narrow scope may omit packages; confirm includes.`;
    }
    return `${formatInt(total)} functions in scope: use distribution and hotspot tables to focus refactors.`;
  })();

  const descHigh = (() => {
    if (highCx === 0) {
      return "No functions exceed the engine high-complexity threshold (>10)—keep new code from crossing it.";
    }
    if (tHigh === "critical" || tHigh === "needs_work") {
      return `${highCx} functions exceed cyclomatic >10. Split the worst hotspots in the tables below before they spread.`;
    }
    return `Only ${highCx} function${highCx === 1 ? "" : "s"} above the threshold—triage names that reviewers avoid touching.`;
  })();

  const descMax = (() => {
    if (tMax === "critical" || tMax === "needs_work") {
      return `Single-function peak is ${maxCx}. Even one extreme path dominates review—carve helpers until this drops.`;
    }
    return `Peak complexity ${maxCx} sits in a tolerable band; still watch for spikes in hotspots after large merges.`;
  })();

  return (
    <section
      aria-labelledby="rq3-core-signals-heading"
      className="space-y-4"
      id="rq3-core-signals"
    >
      <div>
        <h2
          id="rq3-core-signals-heading"
          className="text-sm font-medium tracking-wide text-muted-foreground"
        >
          Core Signals
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <RqSignalCard
          title="Total functions"
          tier={tTotal}
          value={formatInt(total)}
          description={descTotal}
        />
        <RqSignalCard
          title="High complexity functions"
          tier={tHigh}
          value={formatInt(highCx)}
          description={descHigh}
        />
        <RqSignalCard
          title="Max complexity"
          tier={tMax}
          value={formatInt(maxCx)}
          description={descMax}
        />
      </div>
    </section>
  );
}
