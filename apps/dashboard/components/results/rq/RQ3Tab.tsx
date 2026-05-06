"use client";

import { MetricCard } from "../MetricCard";
import { RQ3CodeQualityImprovementSection } from "./RQ3CodeQualityImprovementSection";
import { RQ3ComplexityDistributionCard } from "./RQ3ComplexityDistributionCard";
import { RQ3CoreSignalsSection } from "./RQ3CoreSignalsSection";
import { HotspotTables } from "../HotspotTables";
import { FileTable } from "../FileTable";
import type { RepoReport } from "@/lib/reportTypes";
import {
  RQ3AvgFunctionLengthBody,
  RQ3CyclomaticAvgBody,
  RQ3CyclomaticMaxBody,
  RQ3DuplicationPercentBody,
  RQ3HighComplexityCountBody,
  RQ3LongFunctionCountBody,
  RQ3MaintainabilityClassBody,
  RQ3MaintainabilityScoreBody,
  RQ3MaxNestingDepthBody,
  RQ3P90ComplexityBody,
  RQ3P90FunctionLengthBody,
} from "./metricHelpContent";

interface RQ3TabProps {
  report: RepoReport;
  onOpenTestingTab?: () => void;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

export function RQ3Tab({ report, onOpenTestingTab }: RQ3TabProps) {
  const r = report;
  const dist = r.distributions;
  const comp = r.complexity;
  const fm = r.functionMetricsSummary;
  const smells = r.smells;

  const totalFunctions = r.totals?.functions ?? 0;
  const avgComplexity = comp?.average ?? 0;
  const maxComplexity = comp?.max ?? 0;
  const highComplexityCount = comp?.highComplexityFunctions ?? 0;
  const avgFunctionLength = fm?.averageLength ?? 0;
  const longFunctionCount = smells?.longFunctions ?? 0;
  const maxNestingDepth = fm?.maxNestingDepth ?? 0;
  const p90FunctionLength = dist?.p90_function_length ?? 0;
  const p90Complexity = dist?.p90_complexity ?? 0;
  const maintainabilityScore = r.maintainability?.score ?? 0;
  const maintainabilityClass = r.maintainability?.classification ?? "—";
  const duplicationPercent = r.duplication?.percentage ?? 0;
  const consoleLogCount = smells?.consoleLogs ?? 0;
  const emptyCatchBlocks = smells?.emptyCatchBlocks ?? 0;
  const longParamCount = smells?.longParameterLists ?? 0;

  return (
    <div className="space-y-8">
      <RQ3CoreSignalsSection report={report} />

      <section aria-labelledby="rq3-additional-signals-heading" className="space-y-8">
        <h2 id="rq3-additional-signals-heading" className="text-lg font-semibold">
          Additional signals
        </h2>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Structural complexity</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Total functions"
              value={totalFunctions}
              rq="RQ3"
              hideResearchBadge
              description="Callable units the analyzer counted in analyzed source paths."
              tooltip="Count of function-like AST nodes in analyzed source"
            />
            <MetricCard
              label="Avg complexity"
              value={formatNumber(avgComplexity)}
              rq="RQ3"
              hideResearchBadge
              description="Mean cyclomatic complexity across all functions in scope."
              tooltip="Mean cyclomatic complexity across functions."
              metricHelp={{
                title: "Average cyclomatic complexity",
                children: <RQ3CyclomaticAvgBody />,
              }}
            />
            <MetricCard
              label="Max complexity"
              value={maxComplexity}
              rq="RQ3"
              hideResearchBadge
              description="Worst single-function cyclomatic value—often your #1 refactor target."
              tooltip="Largest per-function cyclomatic value in this repo."
              metricHelp={{
                title: "Maximum cyclomatic complexity",
                children: <RQ3CyclomaticMaxBody />,
              }}
            />
            <MetricCard
              label="High complexity count"
              value={highComplexityCount}
              rq="RQ3"
              hideResearchBadge
              description="Functions above the engine threshold (cyclomatic > 10)."
              tooltip="Functions with complexity > 10 (engine threshold)."
              metricHelp={{
                title: "High complexity function count",
                children: <RQ3HighComplexityCountBody />,
              }}
            />
            <MetricCard
              label="Avg function length"
              value={formatNumber(avgFunctionLength)}
              rq="RQ3"
              hideResearchBadge
              description="Average physical lines per function (size proxy, not complexity)."
              tooltip="Mean physical lines per function."
              metricHelp={{
                title: "Average function length",
                children: <RQ3AvgFunctionLengthBody />,
              }}
            />
            <MetricCard
              label="Long function count"
              value={longFunctionCount}
              rq="RQ3"
              hideResearchBadge
              description="Functions over 50 lines—harder to review and test in one shot."
              tooltip="Functions with more than 50 lines."
              metricHelp={{
                title: "Long function count",
                children: <RQ3LongFunctionCountBody />,
              }}
            />
            <MetricCard
              label="Max nesting depth"
              value={maxNestingDepth}
              rq="RQ3"
              hideResearchBadge
              description="Deepest nesting of control structures in any function."
              tooltip="Deepest control-structure nesting in any function."
              metricHelp={{
                title: "Maximum nesting depth",
                children: <RQ3MaxNestingDepthBody />,
              }}
            />
            <MetricCard
              label="P90 function length"
              value={formatNumber(p90FunctionLength)}
              rq="RQ3"
              hideResearchBadge
              description="90th percentile length—captures heavy tail beyond the average."
              tooltip="90th percentile of function lengths."
              metricHelp={{
                title: "P90 function length",
                children: <RQ3P90FunctionLengthBody />,
              }}
            />
            <MetricCard
              label="P90 complexity"
              value={formatNumber(p90Complexity)}
              rq="RQ3"
              hideResearchBadge
              description="90th percentile cyclomatic—where the scary outliers live."
              tooltip="90th percentile of cyclomatic complexity."
              metricHelp={{
                title: "P90 cyclomatic complexity",
                children: <RQ3P90ComplexityBody />,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Maintainability &amp; hygiene</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Maintainability score"
              value={formatNumber(maintainabilityScore)}
              rq="RQ3"
              hideResearchBadge
              description="Composite maintainability index (0–100-style) when the engine emits it."
              tooltip="Repo-level index on 0–100 (Coleman-style composite)."
              metricHelp={{
                title: "Maintainability score",
                children: <RQ3MaintainabilityScoreBody />,
              }}
            />
            <MetricCard
              label="Maintainability class"
              value={maintainabilityClass}
              rq="RQ3"
              hideResearchBadge
              description="Bucket derived from the score—for quick communication, not a grade."
              tooltip="Band from the score: low / moderate / high."
              metricHelp={{
                title: "Maintainability class",
                children: <RQ3MaintainabilityClassBody />,
              }}
            />
            <MetricCard
              label="Duplication %"
              value={`${formatNumber(duplicationPercent)}%`}
              rq="RQ3"
              hideResearchBadge
              description="Estimated duplicated lines (jscpd) when duplication analysis ran."
              tooltip="jscpd duplicate-line percentage when available."
              metricHelp={{
                title: "Duplication percentage",
                children: <RQ3DuplicationPercentBody />,
              }}
            />
            <MetricCard
              label="Console log count"
              value={consoleLogCount}
              rq="RQ3"
              hideResearchBadge
              description="Calls to console.log, warn, or error—often noise before production."
              tooltip="Calls to console.log, console.warn, or console.error"
            />
            <MetricCard
              label="Empty catch blocks"
              value={emptyCatchBlocks}
              rq="RQ3"
              hideResearchBadge
              description="Catches with empty bodies—errors can fail silently."
              tooltip="Catch clauses with an empty body"
            />
            <MetricCard
              label="Long parameter list count"
              value={longParamCount}
              rq="RQ3"
              hideResearchBadge
              description="Functions with more than four parameters—consider objects or splits."
              tooltip="Functions with more than 4 parameters"
            />
          </div>
        </div>
      </section>

      <section
        id="rq3-hotspots"
        className="scroll-mt-8 space-y-4"
        aria-label="Complexity distribution and hotspots"
      >
        <div className="space-y-4">
          <RQ3ComplexityDistributionCard report={report} />
          <HotspotTables report={report} />
        </div>
      </section>

      <section aria-labelledby="rq3-per-file-heading">
        <h2 id="rq3-per-file-heading" className="text-lg font-semibold mb-4">
          Per-file table
        </h2>
        <FileTable report={report} />
      </section>

      <RQ3CodeQualityImprovementSection onOpenTestingTab={onOpenTestingTab} />
    </div>
  );
}
