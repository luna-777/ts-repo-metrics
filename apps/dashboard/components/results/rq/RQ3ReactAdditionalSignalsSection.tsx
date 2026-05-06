"use client";

import { MetricCard } from "../MetricCard";
import type { ReactMetricsReport } from "@/lib/reportTypes";
import {
  RQ3ReactAsyncUseEffectBody,
  RQ3ReactConditionalHooksBody,
  RQ3ReactMaxJsxDepthRepoBody,
  RQ3ReactMissingDepsBody,
  RQ3ReactNonPrimitiveDepsBody,
  RQ3ReactPropDrillingBody,
  RQ3ReactTampereBody,
} from "./metricHelpContent";

interface RQ3ReactAdditionalSignalsSectionProps {
  reactMetrics: ReactMetricsReport;
}

export function RQ3ReactAdditionalSignalsSection({
  reactMetrics,
}: RQ3ReactAdditionalSignalsSectionProps) {
  const s = reactMetrics.summary;

  return (
    <section aria-labelledby="rq3-react-additional-signals-heading" className="space-y-4">
      <h2 id="rq3-react-additional-signals-heading" className="text-lg font-semibold">
        Additional signals
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="JSX Depth > 5"
          value={s.tampereJsxDepthExceededCount}
          rq="RQ3"
          hideResearchBadge
          description="Components deeper than the Tampere depth threshold."
          tooltip="Components deeper than the Tampere depth threshold."
          metricHelp={{
            title: "Tampere-style JSX depth",
            children: <RQ3ReactTampereBody />,
          }}
        />
        <MetricCard
          label="Max JSX Depth"
          value={s.maxJsxDepthRepo}
          rq="RQ3"
          hideResearchBadge
          description="Worst nested JSX depth in any component in this run."
          tooltip="Worst nested JSX depth in any component."
          metricHelp={{
            title: "Maximum JSX depth (repository)",
            children: <RQ3ReactMaxJsxDepthRepoBody />,
          }}
        />
        <MetricCard
          label="Prop Pass-Through Edges"
          value={s.totalPropDrillingEdges}
          rq="RQ3"
          hideResearchBadge
          description="Same-file prop drilling edges (MVP detector)."
          tooltip="Same-file prop drilling edges (MVP detector)."
          metricHelp={{
            title: "Prop pass-through edges",
            children: <RQ3ReactPropDrillingBody />,
          }}
        />
        <MetricCard
          label="Conditional Hook Calls"
          value={s.totalConditionalHookCalls}
          rq="RQ3"
          hideResearchBadge
          description="use* under control flow (Rules of Hooks)."
          tooltip="use* under control flow (Rules of Hooks)."
          metricHelp={{
            title: "Conditional hook calls",
            children: <RQ3ReactConditionalHooksBody />,
          }}
        />
        <MetricCard
          label="Async useEffect"
          value={s.totalAsyncUseEffect}
          rq="RQ3"
          hideResearchBadge
          description="async function passed to useEffect."
          tooltip="async function passed to useEffect."
          metricHelp={{
            title: "Async useEffect",
            children: <RQ3ReactAsyncUseEffectBody />,
          }}
        />
        <MetricCard
          label="Missing/Invalid Deps"
          value={s.totalMissingOrInvalidDepsArray}
          rq="RQ3"
          hideResearchBadge
          description="Dependency arrays the analyzer could not verify statically."
          tooltip="Dependency arrays we cannot verify statically."
          metricHelp={{
            title: "Missing or invalid dependency arrays",
            children: <RQ3ReactMissingDepsBody />,
          }}
        />
        <MetricCard
          label="Non-Primitive Dep Risk"
          value={s.totalNonPrimitiveDepRisk}
          rq="RQ3"
          hideResearchBadge
          description="Deps likely to change identity each render."
          tooltip="Deps likely to change identity each render."
          metricHelp={{
            title: "Non-primitive dependency risk",
            children: <RQ3ReactNonPrimitiveDepsBody />,
          }}
        />
      </div>
    </section>
  );
}
