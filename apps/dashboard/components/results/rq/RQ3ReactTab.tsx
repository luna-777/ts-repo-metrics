"use client";

import { RQFramingHeader } from "./RQFramingHeader";
import { ReactMetricsSection } from "./ReactMetricsSection";
import type { RepoReport } from "@/lib/reportTypes";

interface RQ3ReactTabProps {
  report: RepoReport;
}

export function RQ3ReactTab({ report }: RQ3ReactTabProps) {
  const rm = report.reactMetrics;
  const tsxCount = report.profile?.tsxFiles ?? 0;

  if (!rm) {
    const hasTsxButNoBlock = tsxCount > 0;
    return (
      <div className="space-y-4">
        <RQFramingHeader rq="RQ3" />
        <p className="text-muted-foreground text-sm max-w-2xl">
          {hasTsxButNoBlock ? (
            <>
              This report lists <strong>{tsxCount}</strong>{" "}
              <code className="rounded bg-muted px-1">.tsx</code> file{tsxCount === 1 ? "" : "s"} in the profile, but
              there is no <code className="rounded bg-muted px-1">reactMetrics</code> block. Re-run analysis with the
              current <code className="rounded bg-muted px-1">@repo-metrics/engine</code>, or clear an outdated browser
              cache for this result.
            </>
          ) : (
            <>
              No React / TSX metrics: no <code className="rounded bg-muted px-1">.tsx</code> files were in scope for
              this run.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RQFramingHeader rq="RQ3" />
      <p className="text-muted-foreground text-sm max-w-2xl">
        Static signals from TSX: component cohesion (hooks + size), nested JSX depth, same-file prop pass-through, and
        hook-usage heuristics.
      </p>
      <ReactMetricsSection reactMetrics={rm} />
      <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30 p-4 text-sm">
        <p className="text-green-900 dark:text-green-100 font-medium">RQ Mapping: RQ3 (React / hooks)</p>
      </div>
    </div>
  );
}
