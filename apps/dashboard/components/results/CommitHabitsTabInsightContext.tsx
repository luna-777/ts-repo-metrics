"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { RepoReport } from "@/lib/reportTypes";
import { RESULTS_TAB } from "@/lib/resultsNavigation";
import { buildCommitHabitsInsightFacts, useTabInsight } from "@/lib/tabInsights";
import type { CommitHabitsInsightFacts } from "@/lib/tabInsights/commitHabitsInsightFacts";
import type { CommitHabitsInsightPayload } from "@/lib/tabInsights/types";

export interface CommitHabitsTabInsightContextValue {
  facts: CommitHabitsInsightFacts;
  data: CommitHabitsInsightPayload | null;
  error: Error | null;
  isLoading: boolean;
}

export const CommitHabitsTabInsightContext =
  createContext<CommitHabitsTabInsightContextValue | null>(null);

export function CommitHabitsTabInsightProvider({
  report,
  enabled,
  children,
}: {
  report: RepoReport;
  enabled: boolean;
  children: ReactNode;
}) {
  const facts = useMemo(() => buildCommitHabitsInsightFacts(report), [report]);
  const factsRecord = useMemo(
    () => ({ ...facts }) as Record<string, unknown>,
    [facts],
  );

  const { data, error, isLoading } = useTabInsight(
    RESULTS_TAB.commitHabits,
    factsRecord,
    enabled,
  );

  const value = useMemo<CommitHabitsTabInsightContextValue>(
    () => ({
      facts,
      data,
      error,
      isLoading,
    }),
    [facts, data, error, isLoading],
  );

  return (
    <CommitHabitsTabInsightContext.Provider value={value}>
      {children}
    </CommitHabitsTabInsightContext.Provider>
  );
}

export function useCommitHabitsTabInsight(): CommitHabitsTabInsightContextValue | null {
  return useContext(CommitHabitsTabInsightContext);
}
