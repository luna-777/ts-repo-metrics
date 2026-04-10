"use client";

import { CircleHelp } from "lucide-react";
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
import {
  RQ3ReactAsyncUseEffectBody,
  RQ3ReactConditionalHooksBody,
  RQ3ReactFerreiraBody,
  RQ3ReactMaxJsxDepthRepoBody,
  RQ3ReactMissingDepsBody,
  RQ3ReactNonPrimitiveDepsBody,
  RQ3ReactPropDrillingBody,
  RQ3ReactTampereBody,
  ReactTableColComponentBody,
  ReactTableColDrillBody,
  ReactTableColFileBody,
  ReactTableColFerreiraBody,
  ReactTableColHooksBody,
  ReactTableColLineBody,
  ReactTableColMaxJsxBody,
  ReactTableColSlocBody,
  ReactTableColTampereBody,
} from "./metricHelpContent";
import { ReactComponentTableColumnHelp } from "./ReactComponentTableColumnHelp";

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
            tooltip="Heuristic: many hooks and large component body."
            metricHelp={{
              title: "Ferreira-style lack of cohesion",
              children: <RQ3ReactFerreiraBody />,
            }}
          />
          <MetricCard
            label="Tampere: JSX depth &gt; 5"
            value={s.tampereJsxDepthExceededCount}
            rq="RQ3"
            tooltip="Components deeper than the Tampere depth threshold."
            metricHelp={{
              title: "Tampere-style JSX depth",
              children: <RQ3ReactTampereBody />,
            }}
          />
          <MetricCard
            label="Max JSX depth (repo)"
            value={s.maxJsxDepthRepo}
            rq="RQ3"
            tooltip="Worst nested JSX depth in any component."
            metricHelp={{
              title: "Maximum JSX depth (repository)",
              children: <RQ3ReactMaxJsxDepthRepoBody />,
            }}
          />
          <MetricCard
            label="Prop pass-through edges"
            value={s.totalPropDrillingEdges}
            rq="RQ3"
            tooltip="Same-file prop drilling edges (MVP detector)."
            metricHelp={{
              title: "Prop pass-through edges",
              children: <RQ3ReactPropDrillingBody />,
            }}
          />
          <MetricCard
            label="Conditional hook calls"
            value={s.totalConditionalHookCalls}
            rq="RQ3"
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
            tooltip="async function passed to useEffect."
            metricHelp={{
              title: "Async useEffect",
              children: <RQ3ReactAsyncUseEffectBody />,
            }}
          />
          <MetricCard
            label="Missing / invalid deps"
            value={s.totalMissingOrInvalidDepsArray}
            rq="RQ3"
            tooltip="Dependency arrays we cannot verify statically."
            metricHelp={{
              title: "Missing or invalid dependency arrays",
              children: <RQ3ReactMissingDepsBody />,
            }}
          />
          <MetricCard
            label="Non-primitive dep risk"
            value={s.totalNonPrimitiveDepRisk}
            rq="RQ3"
            tooltip="Deps likely to change identity each render."
            metricHelp={{
              title: "Non-primitive dependency risk",
              children: <RQ3ReactNonPrimitiveDepsBody />,
            }}
          />
        </div>
      </div>
      {rows.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <p className="text-muted-foreground text-xs px-3 pt-3 pb-1">
            Each column has a help dialog (
            <CircleHelp className="inline size-3 align-text-bottom text-muted-foreground" aria-hidden />
            ) with definitions and how values are computed.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[7rem]">
                  <ReactComponentTableColumnHelp label="Component" title="Component">
                    <ReactTableColComponentBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="min-w-[10rem]">
                  <ReactComponentTableColumnHelp label="File" title="File">
                    <ReactTableColFileBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="text-right">
                  <ReactComponentTableColumnHelp label="Line" title="Line" align="right">
                    <ReactTableColLineBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="text-right">
                  <ReactComponentTableColumnHelp label="SLOC" title="SLOC (line span)" align="right">
                    <ReactTableColSlocBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="text-right">
                  <ReactComponentTableColumnHelp label="Hooks" title="Hooks" align="right">
                    <ReactTableColHooksBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <ReactComponentTableColumnHelp
                    label="Max JSX Δ"
                    title="Max JSX depth (Δ)"
                    align="right"
                  >
                    <ReactTableColMaxJsxBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <ReactComponentTableColumnHelp label="Ferreira" title="Ferreira (lack of cohesion)">
                    <ReactTableColFerreiraBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <ReactComponentTableColumnHelp label="Tampere" title="Tampere (JSX depth)">
                    <ReactTableColTampereBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
                <TableHead className="text-right">
                  <ReactComponentTableColumnHelp label="Drill" title="Prop drilling edges" align="right">
                    <ReactTableColDrillBody />
                  </ReactComponentTableColumnHelp>
                </TableHead>
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
