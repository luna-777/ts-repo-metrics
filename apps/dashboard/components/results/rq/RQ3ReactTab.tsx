"use client";

import { useMemo } from "react";
import { RQ3ReactAdditionalSignalsSection } from "./RQ3ReactAdditionalSignalsSection";
import { RQ3ReactCoreSignalsSection } from "./RQ3ReactCoreSignalsSection";
import { RQ3ReactImprovementSection } from "./RQ3ReactImprovementSection";
import { RQ3ReactOversizedComponentsTable } from "./RQ3ReactOversizedComponentsTable";
import type { RepoReport } from "@/lib/reportTypes";

interface RQ3ReactTabProps {
  report: RepoReport;
  onOpenCodeQualityTab?: () => void;
}

export function RQ3ReactTab({ report, onOpenCodeQualityTab }: RQ3ReactTabProps) {
  const rm = report.reactMetrics;
  const tsxCount = report.profile?.tsxFiles ?? 0;

  const topBySloc = useMemo(() => {
    if (!rm?.components.length) return null;
    return [...rm.components].sort((a, b) => b.lines - a.lines)[0] ?? null;
  }, [rm]);

  if (!rm) {
    const hasTsxButNoBlock = tsxCount > 0;
    return (
      <div className="space-y-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
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
    <div className="space-y-8">
      <RQ3ReactCoreSignalsSection reactMetrics={rm} />
      <RQ3ReactAdditionalSignalsSection reactMetrics={rm} />
      <RQ3ReactOversizedComponentsTable components={rm.components} />
      <RQ3ReactImprovementSection
        topComponent={topBySloc}
        onOpenCodeQualityTab={onOpenCodeQualityTab}
      />
    </div>
  );
}
