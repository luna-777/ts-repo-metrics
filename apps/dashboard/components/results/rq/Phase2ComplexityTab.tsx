"use client";

import { useMemo } from "react";
import {
  collectPhase2Rows,
  hasPhase2Block,
  tryGetPhase2Summary,
  type Phase2FunctionRow,
} from "@/lib/phase2Summary";
import type { RepoReport, FunctionDetail } from "@/lib/reportTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MetricHelpButton,
  Phase2MethodologyCard,
  Phase2ReferencesFooter,
} from "./MetricGlossary";
import { Phase2ThresholdLegend } from "./Phase2ThresholdLegend";
import { phase2TrafficCellClass } from "@/lib/phase2Traffic";
import { hasReactUiScope } from "@/lib/hasReactUiScope";
import { Phase2WhatMetricsMeasure } from "./Phase2WhatMetricsMeasure";
import { Phase2CodeComplexityCoreSignals } from "./Phase2CodeComplexityCoreSignals";
import { Phase2AdditionalSignalsSection } from "./Phase2AdditionalSignalsSection";
import { Phase2TopComplexityOutliersTable } from "./Phase2TopComplexityOutliersTable";
import { Phase2ComplexityImprovementSection } from "./Phase2ComplexityImprovementSection";

interface Phase2ComplexityTabProps {
  report: RepoReport;
  onOpenCodeQualityTab?: () => void;
}

export function Phase2ComplexityTab({ report, onOpenCodeQualityTab }: Phase2ComplexityTabProps) {
  const showReact = hasReactUiScope(report);

  const rows = useMemo(() => collectPhase2Rows(report), [report]);

  const hasMetrics = useMemo(() => rows.some((r) => hasPhase2Block(r.fn)), [rows]);

  const summary = useMemo(() => tryGetPhase2Summary(report), [report]);

  const sortedOutliers = useMemo(() => {
    const withP2: { file: string; fn: FunctionDetail }[] = [];
    for (const row of rows) {
      if (hasPhase2Block(row.fn)) withP2.push(row);
    }
    return [...withP2].sort((a, b) => {
      const d = b.fn.cognitiveComplexity! - a.fn.cognitiveComplexity!;
      if (d !== 0) return d;
      return b.fn.halstead!.volume - a.fn.halstead!.volume;
    });
  }, [rows]);

  const topOutlier: Phase2FunctionRow | null = sortedOutliers[0] ?? null;

  if (!hasMetrics || !summary) {
    return (
      <div className="space-y-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          No Phase 2 lexical / cognitive metrics in this report. Re-run analysis with the current{" "}
          <code className="rounded bg-muted px-1">@repo-metrics/engine</code>, or load a fresh result.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Phase2WhatMetricsMeasure summary={summary} showReact={showReact} />
      <Phase2CodeComplexityCoreSignals summary={summary} />
      <Phase2AdditionalSignalsSection summary={summary} showReact={showReact} />
      <Phase2TopComplexityOutliersTable
        sortedOutliers={sortedOutliers}
        summary={summary}
        showReact={showReact}
      />
      <Phase2ComplexityImprovementSection
        topOutlier={topOutlier}
        onOpenCodeQualityTab={onOpenCodeQualityTab}
      />

      <section
        id="phase2-full-table"
        aria-labelledby="phase2-full-table-heading"
        className="space-y-4"
      >
        <div>
          <h2 id="phase2-full-table-heading" className="text-lg font-semibold">
            All functions — Phase 2 detail
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete per-function listing with cyclomatic complexity and raw MI for export-style review.
          </p>
        </div>
        <Phase2ThresholdLegend />

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">
                  <MetricHelpButton metricId="cyclomatic" label="CC" align="right" />
                </TableHead>
                <TableHead className="text-right">
                  <MetricHelpButton metricId="halstead" label="Halstead V" align="right" />
                </TableHead>
                <TableHead className="text-right">
                  <MetricHelpButton metricId="cognitive" label="Cognitive" align="right" />
                </TableHead>
                <TableHead className="text-right">
                  <MetricHelpButton metricId="mi" label="MI_norm" align="right" />
                </TableHead>
                <TableHead className="text-right text-muted-foreground">MI_raw</TableHead>
                {showReact ? (
                  <TableHead>
                    <MetricHelpButton metricId="reactShare" label="React?" align="left" />
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ file, fn }) => (
                <TableRow key={`${file}:${fn.name}:${fn.startLine}`}>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs">{file}</TableCell>
                  <TableCell className="font-mono text-sm">{fn.name}</TableCell>
                  <TableCell className={phase2TrafficCellClass(fn.cyclomaticComplexity, "cc")}>
                    {fn.cyclomaticComplexity ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fn.halstead?.volume?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className={phase2TrafficCellClass(fn.cognitiveComplexity, "cognitive")}>
                    {fn.cognitiveComplexity ?? "—"}
                  </TableCell>
                  <TableCell
                    className={phase2TrafficCellClass(fn.maintainabilityIndexGradAiNorm, "mi")}
                  >
                    {fn.maintainabilityIndexGradAiNorm?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fn.maintainabilityIndexGradAiRaw?.toFixed(1) ?? "—"}
                  </TableCell>
                  {showReact ? (
                    <TableCell>{fn.isReactComponent ? "yes" : "no"}</TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <details className="group rounded-xl border border-muted-foreground/25 bg-card text-card-foreground shadow-sm">
        <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-base font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
          <span>Research methodology &amp; glossary</span>
          <span className="text-muted-foreground text-xs font-normal group-open:hidden">Expand</span>
          <span className="text-muted-foreground hidden text-xs font-normal group-open:inline">Collapse</span>
        </summary>
        <div className="border-t px-5 pb-5 pt-4">
          <Phase2MethodologyCard includeReactLens={showReact} />
        </div>
      </details>

      <Phase2ReferencesFooter />
    </div>
  );
}
