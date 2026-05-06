"use client";

import type { Phase2Summary } from "@/lib/phase2Summary";
import { RqSignalCard, type RqSignalTier } from "./CoreSignalsPrimitives";

interface Phase2CodeComplexityCoreSignalsProps {
  summary: Phase2Summary;
}

function formatMiMean(m: number): string {
  return m.toFixed(1);
}

function formatCogMean(m: number): string {
  return m.toFixed(2);
}

function formatHalMean(m: number): string {
  return m.toFixed(1);
}

/** Repo-level mean MI_norm: ≥65 maintainable band. */
function tierMiMeanValue(m: number): RqSignalTier {
  if (m >= 70) return "strong";
  if (m >= 55) return "good";
  if (m >= 45) return "needs_work";
  return "critical";
}

/** Lower average cognitive is better. */
function tierCognitiveMean(m: number): RqSignalTier {
  if (m <= 5) return "strong";
  if (m <= 10) return "good";
  if (m <= 15) return "needs_work";
  return "critical";
}

/** Higher mean Halstead volume is harder; compare to p90 implicitly via thresholds. */
function tierHalsteadMean(m: number): RqSignalTier {
  if (m <= 100) return "strong";
  if (m <= 140) return "good";
  if (m <= 220) return "needs_work";
  return "critical";
}

export function Phase2CodeComplexityCoreSignals({ summary }: Phase2CodeComplexityCoreSignalsProps) {
  const mi = summary.miNormMean;
  const cog = summary.cognitiveMean;
  const hal = summary.halsteadVolMean;
  const p90h = summary.halsteadVolP90;

  const tMi = tierMiMeanValue(mi);
  const tCog = tierCognitiveMean(cog);
  const tHal = tierHalsteadMean(hal);

  const descMi = (() => {
    if (tMi === "strong" || tMi === "good") {
      return `Above 65 is considered maintainable. Your codebase average is ${formatMiMean(mi)}—protect this by keeping complexity in check.`;
    }
    return `Mean MI_norm ${formatMiMean(mi)} sits below the maintainable band for many functions—prioritize outliers in the tables below.`;
  })();

  const descCog = (() => {
    if (tCog === "strong" || tCog === "good") {
      return `Average cognitive complexity of ${formatCogMean(cog)} is easy to follow mentally. Keep functions short and avoid deep nesting.`;
    }
    return `${formatCogMean(cog)} mean cognitive load is elevated—carve helpers where nesting stacks up.`;
  })();

  const descHal = (() => {
    return `Mean Halstead volume of ${formatHalMean(hal)} means moderate lexical effort per function. The p90 is ${p90h.toFixed(1)}—a few functions are significantly heavier than average.`;
  })();

  return (
    <section
      aria-labelledby="phase2-cc-core-signals-heading"
      className="space-y-4"
      id="phase2-core-signals"
    >
      <div>
        <h2
          id="phase2-cc-core-signals-heading"
          className="text-sm font-medium tracking-wide text-muted-foreground"
        >
          Core Signals
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <RqSignalCard
          title="Maintainability Index"
          tier={tMi}
          value={formatMiMean(mi)}
          description={descMi}
        />
        <RqSignalCard
          title="Cognitive Complexity"
          tier={tCog}
          value={formatCogMean(cog)}
          description={descCog}
        />
        <RqSignalCard
          title="Halstead Volume"
          tier={tHal}
          value={formatHalMean(hal)}
          description={descHal}
        />
      </div>
    </section>
  );
}
