"use client";

import type { ResultsConstructId } from "@/lib/resultsConstructConfig";
import { RESULTS_CONSTRUCT_CONFIGS } from "@/lib/resultsConstructConfig";

interface ResultsConstructFramingHeaderProps {
  constructId: ResultsConstructId;
  /** Primary heading; defaults to the dashboard category label for this construct. */
  heading?: string;
}

export function ResultsConstructFramingHeader({
  constructId,
  heading,
}: ResultsConstructFramingHeaderProps) {
  const config = RESULTS_CONSTRUCT_CONFIGS[constructId];
  if (!config) return null;

  const primaryHeading = heading ?? config.title;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <p className="font-semibold text-base text-foreground">{primaryHeading}</p>
      <p className="text-sm font-medium">{config.question}</p>
      <p className="text-sm text-muted-foreground">
        Operationalization: {config.operationalization}
      </p>
    </div>
  );
}
