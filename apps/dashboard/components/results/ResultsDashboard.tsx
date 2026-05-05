"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RQ1Tab } from "./rq/RQ1Tab";
import { RQ2Tab } from "./rq/RQ2Tab";
import { RQ3Tab } from "./rq/RQ3Tab";
import { RQ3ReactTab } from "./rq/RQ3ReactTab";
import { Phase2ComplexityTab } from "./rq/Phase2ComplexityTab";
import { Phase3PathologyTab } from "./rq/Phase3PathologyTab";
import { AIMaturityTab } from "./rq/AIMaturityTab";
import { DatasetTab } from "./dataset/DatasetTab";
import { CoachSaysPanel } from "./coach";
import { CrossRQInsightPanel } from "./CrossRQInsightPanel";
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
            → Your highest-impact improvement this quarter is Testing. Head to the Tests and risk tab
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

      <Tabs value={resultsTab} onValueChange={setResultsTab}>
        <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-muted/80 p-1 shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <TabsList className="flex h-auto min-h-10 w-max min-w-full flex-nowrap justify-start gap-0.5 bg-transparent p-0 sm:gap-1">
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="rq1"
              title="How often you commit, commit size, bursts, and churn—git habits for your team"
            >
              How we work
            </TabsTrigger>
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="rq2"
              title="Tests, test-heavy commits, and rough structural risk—not scores"
            >
              Tests and risk
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
            <TabsTrigger
              className="shrink-0 px-2.5 sm:px-3"
              value="ai-maturity"
              title="AI Usage Maturity — how well you use AI across the SDLC"
            >
              AI Maturity
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
          <div id="rq2" className="scroll-mt-8 space-y-8">
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
        <TabsContent value="ai-maturity">
          <AIMaturityTab />
        </TabsContent>
        <TabsContent value="dataset">
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
