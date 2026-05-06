"use client";

import { MetricCard } from "../MetricCard";
import {
  getPhase2MetricHelpTitle,
  Phase2MetricHelpDialogContent,
  type Phase2MetricId,
} from "./MetricGlossary";
import type { Phase2Summary } from "@/lib/phase2Summary";

interface Phase2AdditionalSignalsSectionProps {
  summary: Phase2Summary;
  showReact: boolean;
}

function help(metricId: Phase2MetricId) {
  return {
    title: getPhase2MetricHelpTitle(metricId),
    children: <Phase2MetricHelpDialogContent metricId={metricId} />,
  };
}

export function Phase2AdditionalSignalsSection({
  summary,
  showReact,
}: Phase2AdditionalSignalsSectionProps) {
  const p90h = summary.halsteadVolP90.toFixed(1);
  const p90c = summary.cognitiveP90.toFixed(2);
  const reactPct = (summary.reactShare * 100).toFixed(1);

  return (
    <section aria-labelledby="code-complexity-additional-signals-heading" className="space-y-4">
      <h2 id="code-complexity-additional-signals-heading" className="text-lg font-semibold">
        Additional signals
      </h2>
      <div
        className={
          showReact ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-2"
        }
      >
        {showReact ? (
          <MetricCard
            label="React Component Share"
            value={`${reactPct}%`}
            metricCategory="code-quality"
            hideResearchBadge
            description="Share of analyzed functions labeled as UI-layer React components—complexity concentration vs logic."
            tooltip="Structural density of React-labeled functions vs total functions."
            metricHelp={help("reactShare")}
          />
        ) : null}
        <MetricCard
          label="P90 Halstead Volume"
          value={p90h}
          metricCategory="code-quality"
          hideResearchBadge
          description="90% of functions sit below this lexical volume—outliers drive the tail."
          tooltip="90th percentile Halstead volume across functions that have a full lexical + cognitive metric set."
          metricHelp={help("halstead")}
        />
        <MetricCard
          label="P90 Cognitive Complexity"
          value={p90c}
          metricCategory="code-quality"
          hideResearchBadge
          description="90% of functions stay below this cognitive score—spot the few that exceed it."
          tooltip="90th percentile cognitive complexity across functions that have a full lexical + cognitive metric set."
          metricHelp={help("cognitive")}
        />
      </div>
    </section>
  );
}
