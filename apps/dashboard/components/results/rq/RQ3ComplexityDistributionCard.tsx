"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RepoReport } from "@/lib/reportTypes";

/**
 * Display-only complexity buckets for this UI card (matches product mock).
 * Engine `highComplexityFunctions` uses `HIGH_COMPLEXITY_THRESHOLD = 10` in `packages/engine`.
 */
const DISPLAY_HIGH_GT = 15;
const DISPLAY_CRITICAL_GT = 30;
const DISPLAY_HEALTHY_LT = 10;

function formatPct(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function countComplexityBuckets(report: RepoReport) {
  let highGt15 = 0;
  let criticalGt30 = 0;
  let healthyLt10 = 0;
  let total = 0;

  for (const pf of report.perFile) {
    for (const c of pf.complexity) {
      const v = c.complexity;
      total += 1;
      if (v > DISPLAY_CRITICAL_GT) criticalGt30 += 1;
      if (v > DISPLAY_HIGH_GT) highGt15 += 1;
      if (v < DISPLAY_HEALTHY_LT) healthyLt10 += 1;
    }
  }

  return { highGt15, criticalGt30, healthyLt10, totalWithComplexity: total };
}

interface RQ3ComplexityDistributionCardProps {
  report: RepoReport;
}

export function RQ3ComplexityDistributionCard({ report }: RQ3ComplexityDistributionCardProps) {
  const percentHighInTop10 =
    report.distributions?.percent_high_complexity_in_top_10_percent_files ?? 0;
  const totalFunctions = report.totals?.functions ?? 0;

  const { highGt15, criticalGt30, healthyLt10, totalWithComplexity } = useMemo(
    () => countComplexityBuckets(report),
    [report],
  );

  const healthyPct =
    totalWithComplexity > 0
      ? Math.round((healthyLt10 / totalWithComplexity) * 1000) / 10
      : 0;

  const concentrated = percentHighInTop10 >= 35;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Complexity Distribution</CardTitle>
          <CardDescription className="mt-1.5 max-w-2xl">
            Where complexity is concentrated across analyzed functions.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,220px)]">
          <div className="space-y-2">
            <p className="text-4xl font-semibold tabular-nums text-amber-500 sm:text-5xl">
              {formatPct(percentHighInTop10)}%
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              High complexity concentration
            </p>
            <p className="text-sm text-muted-foreground">
              of high-complexity burden sits in the busiest files (top 10% by function count).
            </p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            {concentrated ? (
              <p>
                This is actually good news: the hardest functions are not spread evenly across the
                whole tree — they cluster in a smaller set of files. That means focused refactors on a
                handful of hotspots can move the needle quickly.
              </p>
            ) : (
              <p>
                High-complexity work is relatively spread across files. Expect coordination and
                incremental refactors across several areas rather than a single hotspot fix.
              </p>
            )}
            <div className="flex gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-950/30 dark:text-emerald-50">
              <Lightbulb className="size-4 shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm">
                Fix the top five hotspots in the complexity tables below for a meaningful drop in
                repo-wide complexity.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm lg:border-l lg:border-border lg:pl-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total functions
              </p>
              <p className="text-lg font-semibold tabular-nums">{totalFunctions}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                High complexity (&gt; {DISPLAY_HIGH_GT})
              </p>
              <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {highGt15}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Critical complexity (&gt; {DISPLAY_CRITICAL_GT})
              </p>
              <p className="text-lg font-semibold tabular-nums text-destructive">
                {criticalGt30}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Healthy functions (&lt; {DISPLAY_HEALTHY_LT})
              </p>
              <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {healthyLt10}
              </p>
            </div>
            {totalWithComplexity > 0 ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {healthyPct}% of analyzed functions fall below complexity {DISPLAY_HEALTHY_LT}.
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
