"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { readReportFromSessionStorage } from "@/lib/reportLocalCache";
import type { RepoReport } from "@/lib/reportTypes";

interface ResultsPageClientLoaderProps {
  resultId: string;
  serverMessage: string | null;
}

export function ResultsPageClientLoader({
  resultId,
  serverMessage,
}: ResultsPageClientLoaderProps) {
  const [report, setReport] = useState<RepoReport | null>(null);
  const [ready, setReady] = useState(false);
  const [droppedStaleCache, setDroppedStaleCache] = useState(false);

  useEffect(() => {
    const { report: r, droppedStaleCache: stale } =
      readReportFromSessionStorage(resultId);
    setReport(r);
    setDroppedStaleCache(stale);
    setReady(true);
  }, [resultId]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center py-12">
        <p className="text-muted-foreground text-sm">Loading result…</p>
      </div>
    );
  }

  if (report) {
    return (
      <div className="w-full max-w-6xl">
        <ResultsDashboard report={report} resultId={resultId} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <h1 className="text-2xl font-semibold">Result not found</h1>
      <p className="text-muted-foreground text-sm">
        {droppedStaleCache
          ? "Removed an outdated cached report (saved before React/TSX metrics). Run the analysis again to refresh."
          : serverMessage ??
            "No saved report for this link. Run a new analysis from the home page, or configure Supabase in .env.local to persist results."}
      </p>
      <Button asChild>
        <Link href="/">Back to Analyze</Link>
      </Button>
    </div>
  );
}
