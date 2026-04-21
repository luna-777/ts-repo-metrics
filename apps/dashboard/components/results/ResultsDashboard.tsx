"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RQ1Tab } from "./rq/RQ1Tab";
import { RQ2Tab } from "./rq/RQ2Tab";
import { RQ3Tab } from "./rq/RQ3Tab";
import { RQ3ReactTab } from "./rq/RQ3ReactTab";
import { Phase2ComplexityTab } from "./rq/Phase2ComplexityTab";
import { Phase3PathologyTab } from "./rq/Phase3PathologyTab";
import { DatasetTab } from "./dataset/DatasetTab";
import { CrossRQInsightPanel } from "./CrossRQInsightPanel";
import { GitHubRepositoryPanel } from "./GitHubRepositoryPanel";
import { hasReactUiScope } from "@/lib/hasReactUiScope";
import type { RepoReport } from "@/lib/reportTypes";
import { createUserSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/browserConfigured";

interface ResultsDashboardProps {
  report: RepoReport;
  resultId: string;
}

function reportHasGitHubSource(report: RepoReport): boolean {
  const u = report.source?.url ?? "";
  return typeof u === "string" && u.includes("github.com");
}

export function ResultsDashboard({ report, resultId }: ResultsDashboardProps) {
  const showReact = hasReactUiScope(report);
  const commit = report?.source?.commit?.slice(0, 7) ?? "—";
  const exportFilename = `repo-metrics-${resultId}-${commit}.json`;
  const [newAnalysisHref, setNewAnalysisHref] = useState("/");

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) return;
    const supabase = createUserSupabaseBrowserClient();
    const syncHref = () => {
      void supabase.auth.getUser().then(({ data }) => {
        setNewAnalysisHref(data.user ? "/repos" : "/");
      });
    };
    syncHref();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncHref();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, exportFilename]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analysis Results</h1>
          <p className="text-muted-foreground text-sm">Commit: {commit}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="size-4" />
            Export JSON
          </Button>
          <Button asChild variant="outline">
            <Link href={newAnalysisHref} className="gap-2">
              <ArrowLeft className="size-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {reportHasGitHubSource(report) ? (
        <GitHubRepositoryPanel
          meta={report.github ?? null}
          repoUrl={report.source?.url}
        />
      ) : null}

      <Tabs defaultValue="rq1">
        <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-muted/80 p-1 shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <TabsList className="flex h-auto min-h-10 w-max min-w-full flex-nowrap justify-start gap-0.5 bg-transparent p-0 sm:gap-1">
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="rq1"
              title="Behavioral shift — git workflow and churn"
            >
              Behavioral
            </TabsTrigger>
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="rq2"
              title="Verification — tests, coupling, risk vs verification"
            >
              Verification
            </TabsTrigger>
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="rq3"
              title="Quality — complexity, maintainability, duplication"
            >
              Quality
            </TabsTrigger>
            {showReact ? (
              <TabsTrigger
                className="shrink-0 px-2.5 sm:px-3"
                value="rq3-react"
                title="React & TSX — hooks, JSX depth, cohesion heuristics"
              >
                React &amp; TSX
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="phase2-complexity"
              title="Lexical & cognitive — Halstead, cognitive complexity, MI (per function)"
            >
              Lexical
            </TabsTrigger>
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="phase3-pathology"
              title="AI smell & bloat — silent failures, redundancy, monolith signals"
            >
              AI smells
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-2.5 sm:px-3" value="dataset" title="Dataset export">
              Dataset
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="rq1">
          <div className="space-y-8">
            <RQ1Tab report={report} />
            <CrossRQInsightPanel report={report} />
          </div>
        </TabsContent>
        <TabsContent value="rq2">
          <div className="space-y-8">
            <RQ2Tab report={report} />
            <CrossRQInsightPanel report={report} />
          </div>
        </TabsContent>
        <TabsContent value="rq3">
          <div className="space-y-8">
            <RQ3Tab report={report} />
            <CrossRQInsightPanel report={report} />
          </div>
        </TabsContent>
        {showReact ? (
          <TabsContent value="rq3-react">
            <div className="space-y-8">
              <RQ3ReactTab report={report} />
              <CrossRQInsightPanel report={report} />
            </div>
          </TabsContent>
        ) : null}
        <TabsContent value="phase2-complexity">
          <div className="space-y-8">
            <Phase2ComplexityTab report={report} />
            <CrossRQInsightPanel report={report} />
          </div>
        </TabsContent>
        <TabsContent value="phase3-pathology">
          <div className="space-y-8">
            <Phase3PathologyTab report={report} />
            <CrossRQInsightPanel report={report} />
          </div>
        </TabsContent>
        <TabsContent value="dataset">
          <DatasetTab report={report} resultId={resultId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
