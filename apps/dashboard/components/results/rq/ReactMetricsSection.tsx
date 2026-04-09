"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "../MetricCard";
import { ReactMetricsBenchmarkInfo } from "./ReactMetricsBenchmarkInfo";
import type { ReactMetricsReport } from "@/lib/reportTypes";

interface ReactMetricsSectionProps {
  reactMetrics: ReactMetricsReport;
}

export function ReactMetricsSection({ reactMetrics }: ReactMetricsSectionProps) {
  const s = reactMetrics.summary;
  const rows = reactMetrics.components;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">React / TSX (RQ3 benchmarks)</h2>
        <p className="text-muted-foreground text-sm mb-3">
          Static signals: Ferreira-style cohesion (hooks + SLOC), nested JSX depth
          (&gt; 5), prop pass-through (same-file MVP), and hook safety heuristics.
        </p>
        <div className="mb-6">
          <ReactMetricsBenchmarkInfo />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="TSX files analyzed"
            value={s.tsxFilesAnalyzed}
            rq="RQ3"
            tooltip="Number of .tsx files parsed for React metrics"
          />
          <MetricCard
            label="Components (heuristic)"
            value={s.componentsAnalyzed}
            rq="RQ3"
            tooltip="Functions whose body contains JSX"
          />
          <MetricCard
            label="Ferreira: lack of cohesion"
            value={s.ferreiraLackOfCohesionCount}
            rq="RQ3"
            tooltip="Components with hook count &gt; 5 and SLOC &gt; 50"
          />
          <MetricCard
            label="Tampere: JSX depth &gt; 5"
            value={s.tampereJsxDepthExceededCount}
            rq="RQ3"
            tooltip="Components exceeding max nested JSX depth threshold"
          />
          <MetricCard
            label="Max JSX depth (repo)"
            value={s.maxJsxDepthRepo}
            rq="RQ3"
            tooltip="Maximum nested JSX depth observed"
          />
          <MetricCard
            label="Prop pass-through edges"
            value={s.totalPropDrillingEdges}
            rq="RQ3"
            tooltip="Props forwarded to children only (same-file MVP)"
          />
          <MetricCard
            label="Conditional hook calls"
            value={s.totalConditionalHookCalls}
            rq="RQ3"
            tooltip="use* calls under if/for/switch (Rules of Hooks)"
          />
          <MetricCard
            label="Async useEffect"
            value={s.totalAsyncUseEffect}
            rq="RQ3"
            tooltip="useEffect with async callback"
          />
          <MetricCard
            label="Missing / invalid deps"
            value={s.totalMissingOrInvalidDepsArray}
            rq="RQ3"
            tooltip="useEffect/useCallback without array literal deps"
          />
          <MetricCard
            label="Non-primitive dep risk"
            value={s.totalNonPrimitiveDepRisk}
            rq="RQ3"
            tooltip="Deps array entries that are objects/arrays/calls (heuristic)"
          />
        </div>
      </div>
      {rows.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Line</TableHead>
                <TableHead className="text-right">SLOC</TableHead>
                <TableHead className="text-right">Hooks</TableHead>
                <TableHead className="text-right">Max JSX Δ</TableHead>
                <TableHead>Ferreira</TableHead>
                <TableHead>Tampere</TableHead>
                <TableHead className="text-right">Drill</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c, i) => (
                <TableRow key={`${c.file}-${c.name}-${c.startLine}-${i}`}>
                  <TableCell className="font-mono text-xs">{c.name}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={c.file}>
                    {c.file}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.startLine}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.lines}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.hookCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.maxJsxDepth}</TableCell>
                  <TableCell>{c.ferreiraLackOfCohesion ? "yes" : "—"}</TableCell>
                  <TableCell>{c.tampereJsxDepthExceeded ? "yes" : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.propDrillingEdges}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
