"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RQ1Tab } from "./rq/RQ1Tab";
import { RQ2Tab } from "./rq/RQ2Tab";
import { RQ3Tab } from "./rq/RQ3Tab";
import { RQ3ReactTab } from "./rq/RQ3ReactTab";
import { Phase2ComplexityTab } from "./rq/Phase2ComplexityTab";
import { Phase3PathologyTab } from "./rq/Phase3PathologyTab";
import { AIMaturityTab } from "./rq/AIMaturityTab";
import { DatasetTab } from "./dataset/DatasetTab";
import { CoachSaysPanel } from "./coach";
import { GitHubRepositoryPanel } from "./GitHubRepositoryPanel";
import {
  MOCK_OVERVIEW_CARDS,
  MOCK_OVERVIEW_SELECTED_ID,
} from "./overviewCardMocks";
import { OverviewCardsStrip } from "./OverviewCardsStrip";
import { hasReactUiScope } from "@/lib/hasReactUiScope";
import type { RepoReport } from "@/lib/reportTypes";
import { createUserSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/browserConfigured";
import { RepoChat } from "@/components/chat/RepoChat";
import { CoachExplainProvider } from "@/lib/repoCoachContext";
import { ResultsTabPanelIntro } from "./ResultsTabPanelIntro";

interface ResultsDashboardProps {
  report: RepoReport;
  resultId: string;
}

function reportHasGitHubSource(report: RepoReport): boolean {
  const u = report.source?.url ?? "";
  return typeof u === "string" && u.includes("github.com");
}

/** Aligned with UCSC Developer Analytics tab strip (Figma). */
const resultsTabTriggerClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-none border border-transparent px-4 py-2.5 text-sm font-medium shadow-none transition-colors",
  "text-muted-foreground hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "data-[state=active]:z-[1] data-[state=active]:-mb-px data-[state=active]:rounded-none data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-neutral-800/30 data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-neutral-800/30",
);

export function ResultsDashboard({ report, resultId }: ResultsDashboardProps) {
  const showReact = hasReactUiScope(report);
  const commit = report?.source?.commit?.slice(0, 7) ?? "—";
  const exportFilename = `repo-metrics-${resultId}-${commit}.json`;
  const [newAnalysisHref, setNewAnalysisHref] = useState("/");
  const [resultsTab, setResultsTab] = useState("rq1");

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

  useEffect(() => {
    setResultsTab("rq1");
  }, [resultId, report.analysis_timestamp, report.source?.commit]);

  useEffect(() => {
    if (!showReact && resultsTab === "rq3-react") {
      setResultsTab("rq1");
    }
  }, [showReact, resultsTab]);

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

  const coachSendRef = useRef<((message: string) => void) | null>(null);
  const coachExplain = useCallback((message: string) => {
    coachSendRef.current?.(message);
  }, []);

  return (
    <CoachExplainProvider value={coachExplain}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analysis Results</h1>
          <p className="text-muted-foreground text-sm">Commit: {commit}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExport}
            variant="ghost"
            className="h-9 gap-2 rounded-lg px-3 font-medium text-muted-foreground hover:text-foreground"
          >
            <Upload className="size-4 shrink-0" aria-hidden />
            Export JSON
          </Button>
          <Button
            asChild
            className="h-9 rounded-lg border-0 bg-gradient-to-r from-primary to-[#8b5cf6] font-medium text-primary-foreground shadow-none hover:opacity-90"
          >
            <Link href={newAnalysisHref}>Run New Analysis</Link>
          </Button>
        </div>
      </div>

      {reportHasGitHubSource(report) ? (
        <GitHubRepositoryPanel
          meta={report.github ?? null}
          repoUrl={report.source?.url}
          totalCommits={report.git?.totalCommits ?? null}
        />
      ) : null}

      <CoachSaysPanel
        positive={{
          title: "What you're doing well",
          body: (
            <>
              Your commit cadence is strong — 65 commits with consistent frequency puts you ahead of most
              teams this quarter. Your codebase also has zero silent failures detected, which shows real
              engineering discipline. These are habits worth protecting.
            </>
          ),
        }}
        concern={{
          title: "Your biggest opportunity",
          body: (
            <>
              Right now 0% of your commits include test files. As your codebase grows more complex this
              puts your work at increasing risk. Testing is where you can make the highest-impact
              improvement this quarter — and your existing commit discipline makes it completely
              achievable.
            </>
          ),
        }}
        pointer={
          <>
            → Your highest-impact improvement this quarter is Testing. Head to the Testing tab
            below to see exactly what to do and how to improve your score.
          </>
        }
        footerLink={{
          href: "#rq2",
          label: "→ See full Testing breakdown",
          onNavigate: () => {
            setResultsTab("rq2");
            window.requestAnimationFrame(() => {
              window.setTimeout(() => {
                document.getElementById("rq2")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 50);
            });
          },
        }}
      />

      <section aria-label="Score overview">
        <OverviewCardsStrip
          items={MOCK_OVERVIEW_CARDS}
          selectedId={MOCK_OVERVIEW_SELECTED_ID}
          onRequestTab={setResultsTab}
        />
      </section>

      <Tabs value={resultsTab} onValueChange={setResultsTab} className="w-full">
        <div className="w-full max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <TabsList
            aria-label="Result categories"
            className="flex h-12 min-h-12 w-max min-w-full flex-nowrap items-end gap-0 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="rq1"
              title="Commit cadence, size, bursts, and churn — engineering habits from git history"
            >
              Commit Habits
            </TabsTrigger>
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="rq2"
              title="Testing and verification — test density, commits touching tests, structural risk signals"
            >
              Testing
            </TabsTrigger>
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="rq3"
              title="Code quality — complexity, maintainability, duplication"
            >
              Code Quality
            </TabsTrigger>
            {showReact ? (
              <TabsTrigger
                className={resultsTabTriggerClass}
                value="rq3-react"
                title="React and TSX — hooks, JSX depth, component cohesion heuristics"
              >
                React Components
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="phase2-complexity"
              title="Code complexity — Halstead and cognitive complexity, maintainability index (per function)"
            >
              Code Complexity
            </TabsTrigger>
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="phase3-pathology"
              title="Code risks — silent failures, redundancy, and AI-related structural smells"
            >
              Code Risks
            </TabsTrigger>
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="ai-maturity"
              title="AI usage maturity — how consistently AI is used across the SDLC"
            >
              AI Maturity
            </TabsTrigger>
            <TabsTrigger
              className={resultsTabTriggerClass}
              value="dataset"
              title="Export analysis fields for research or downstream tools"
            >
              Dataset
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="mt-4">
          <ResultsTabPanelIntro activeTab={resultsTab} report={report} />
        </div>
        <TabsContent value="rq1" className="mt-6">
          <RQ1Tab report={report} />
        </TabsContent>
        <TabsContent value="rq2" className="mt-6">
          <div id="rq2" className="scroll-mt-8 space-y-8">
            <RQ2Tab report={report} onOpenCodeQualityTab={() => setResultsTab("rq3")} />
          </div>
        </TabsContent>
        <TabsContent value="rq3" className="mt-6">
          <RQ3Tab report={report} />
        </TabsContent>
        {showReact ? (
          <TabsContent value="rq3-react" className="mt-6">
            <RQ3ReactTab report={report} />
          </TabsContent>
        ) : null}
        <TabsContent value="phase2-complexity" className="mt-6">
          <Phase2ComplexityTab report={report} />
        </TabsContent>
        <TabsContent value="phase3-pathology" className="mt-6">
          <Phase3PathologyTab report={report} />
        </TabsContent>
        <TabsContent value="ai-maturity" className="mt-6">
          <AIMaturityTab />
        </TabsContent>
        <TabsContent value="dataset" className="mt-6">
          <DatasetTab report={report} resultId={resultId} />
        </TabsContent>
      </Tabs>

      <RepoChat
        report={report}
        onRegisterCoachSend={(fn) => {
          coachSendRef.current = fn;
        }}
      />
    </div>
    </CoachExplainProvider>
  );
}
