"use client";

import { useMemo } from "react";
import { RQFramingHeader } from "./RQFramingHeader";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phase2ThresholdLegend } from "./Phase2ThresholdLegend";
import { phase2TrafficCellClass } from "@/lib/phase2Traffic";

interface Phase2ComplexityTabProps {
  report: RepoReport;
}

function hasPhase2Block(
  f: FunctionDetail,
): f is FunctionDetail & {
  halstead: NonNullable<FunctionDetail["halstead"]>;
  cognitiveComplexity: number;
  maintainabilityIndexGradAiNorm: number;
} {
  return (
    f.halstead !== undefined &&
    typeof f.cognitiveComplexity === "number" &&
    typeof f.maintainabilityIndexGradAiNorm === "number"
  );
}

export function Phase2ComplexityTab({ report }: Phase2ComplexityTabProps) {
  const rows = useMemo(() => {
    const out: { file: string; fn: FunctionDetail }[] = [];
    for (const pf of report.perFile ?? []) {
      for (const fn of pf.functionMetrics ?? []) {
        out.push({ file: pf.file, fn });
      }
    }
    return out;
  }, [report.perFile]);

  const hasMetrics = rows.some((r) => hasPhase2Block(r.fn));

  const summary = useMemo(() => {
    if (!hasMetrics) return null;
    const fns = rows.map((r) => r.fn).filter(hasPhase2Block);
    if (fns.length === 0) return null;
    const vol = fns.map((f) => f.halstead.volume);
    const cog = fns.map((f) => f.cognitiveComplexity);
    const mi = fns.map((f) => f.maintainabilityIndexGradAiNorm);
    const mean = (a: number[]) =>
      a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
    const median = (a: number[]) => {
      const s = sorted(a);
      if (s.length === 0) return 0;
      const m = Math.floor((s.length - 1) / 2);
      return s.length % 2 ? s[m]! : (s[m]! + s[m + 1]!) / 2;
    };
    const p90 = (a: number[]) => {
      const s = sorted(a);
      if (s.length === 0) return 0;
      const idx = Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1);
      return s[idx]!;
    };
    const reactN = fns.filter((f) => f.isReactComponent).length;
    return {
      halsteadVolMean: mean(vol),
      halsteadVolP90: p90(vol),
      cognitiveMean: mean(cog),
      cognitiveP90: p90(cog),
      miNormMean: mean(mi),
      miNormMedian: median(mi),
      reactShare: reactN / fns.length,
    };
  }, [rows, hasMetrics]);

  if (!hasMetrics) {
    return (
      <div className="space-y-4">
        <RQFramingHeader rq="RQ3" />
        <p className="text-muted-foreground text-sm max-w-2xl">
          No Phase 2 lexical / cognitive metrics in this report. Re-run analysis with the current{" "}
          <code className="rounded bg-muted px-1">@repo-metrics/engine</code>, or load a fresh result.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RQFramingHeader rq="RQ3" />
      <Phase2MethodologyCard />

      {summary && (
        <section className="space-y-3">
          <div>
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              Repo-level aggregates
            </h3>
            <p className="text-muted-foreground text-xs">
              Across {rows.length} function{rows.length === 1 ? "" : "s"} with Phase 2 metrics
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 py-4 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-2 pt-0">
                <CardTitle className="text-muted-foreground text-sm font-medium leading-snug">
                  Halstead volume
                </CardTitle>
                <MetricHelpButton metricId="halstead" label="" align="right" className="shrink-0" />
              </CardHeader>
              <CardContent className="px-5 pt-0">
                <p className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                  {summary.halsteadVolMean.toFixed(1)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  Mean · p90 {summary.halsteadVolP90.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-2 pt-0">
                <CardTitle className="text-muted-foreground text-sm font-medium leading-snug">
                  Cognitive complexity
                </CardTitle>
                <MetricHelpButton metricId="cognitive" label="" align="right" className="shrink-0" />
              </CardHeader>
              <CardContent className="px-5 pt-0">
                <p className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                  {summary.cognitiveMean.toFixed(2)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  Mean · p90 {summary.cognitiveP90.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-2 pt-0">
                <CardTitle className="text-muted-foreground text-sm font-medium leading-snug">
                  <span className="font-mono text-[0.8125rem]">MI_norm</span>
                  <span className="text-muted-foreground/80 font-sans font-normal"> (0–100)</span>
                </CardTitle>
                <MetricHelpButton metricId="mi" label="" align="right" className="shrink-0" />
              </CardHeader>
              <CardContent className="px-5 pt-0">
                <p className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                  {summary.miNormMean.toFixed(1)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  Mean · median {summary.miNormMedian.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-2 pt-0">
                <CardTitle className="text-muted-foreground text-sm font-medium leading-snug">
                  React component share
                </CardTitle>
                <MetricHelpButton metricId="reactShare" label="" align="right" className="shrink-0" />
              </CardHeader>
              <CardContent className="px-5 pt-0">
                <p className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                  {(summary.reactShare * 100).toFixed(1)}%
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  UI-layer density vs logic · domain filter for RQ3
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <Phase2ThresholdLegend />

      <div className="rounded-md border overflow-x-auto">
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
              <TableHead>
                <MetricHelpButton metricId="reactShare" label="React?" align="left" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ file, fn }) => (
              <TableRow key={`${file}:${fn.name}:${fn.startLine}`}>
                <TableCell className="font-mono text-xs max-w-[140px] truncate">{file}</TableCell>
                <TableCell className="font-mono text-sm">{fn.name}</TableCell>
                <TableCell className={phase2TrafficCellClass(fn.cyclomaticComplexity, "cc")}>
                  {fn.cyclomaticComplexity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fn.halstead?.volume?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell className={phase2TrafficCellClass(fn.cognitiveComplexity, "cognitive")}>
                  {fn.cognitiveComplexity}
                </TableCell>
                <TableCell
                  className={phase2TrafficCellClass(fn.maintainabilityIndexGradAiNorm, "mi")}
                >
                  {fn.maintainabilityIndexGradAiNorm?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {fn.maintainabilityIndexGradAiRaw?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell>{fn.isReactComponent ? "yes" : "no"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Phase2ReferencesFooter />
    </div>
  );
}
