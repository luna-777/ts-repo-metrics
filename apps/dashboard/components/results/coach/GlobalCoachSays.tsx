"use client";

import { useCallback, useMemo } from "react";

import type { RepoReport } from "@/lib/reportTypes";
import type { ResultsTabId } from "@/lib/resultsNavigation";
import type { CommitHabitsTier } from "@/lib/commitHabitsScore";
import {
  buildCoachSaysFacts,
  healthTierForCoachPriorityTab,
  scrollElementIdForCoachTab,
  useCoachSays,
} from "@/lib/coachSays";

import { CoachSaysPanel } from "./CoachSaysPanel";

export interface GlobalCoachSaysProps {
  report: RepoReport;
  setResultsTab: (tab: ResultsTabId) => void;
  /** When false, keep deterministic copy only (no API round-trip). */
  enabled?: boolean;
}

export function GlobalCoachSays({
  report,
  setResultsTab,
  enabled = true,
}: GlobalCoachSaysProps) {
  const facts = useMemo(() => buildCoachSaysFacts(report), [report]);
  const { payload, isLoading } = useCoachSays(facts, enabled);

  const priorityTab = payload.priorityTab;

  const opportunityTier: CommitHabitsTier = useMemo(
    () => healthTierForCoachPriorityTab(facts, priorityTab),
    [facts, priorityTab],
  );

  const onNavigate = useCallback(() => {
    setResultsTab(priorityTab);
    const id = scrollElementIdForCoachTab(priorityTab);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    });
  }, [priorityTab, setResultsTab]);

  return (
    <CoachSaysPanel
      className={isLoading ? "opacity-90 transition-opacity" : undefined}
      positive={{
        title: "What you're doing well",
        body: payload.strengthText,
      }}
      concern={{
        title: "Your biggest opportunity",
        body: payload.opportunityText,
        variant: opportunityTier === "critical" ? "critical" : "moderate",
      }}
      pointer={payload.pointerText}
      footerLink={{
        href: `#${scrollElementIdForCoachTab(priorityTab)}`,
        label: payload.footerLabel,
        onNavigate,
      }}
    />
  );
}
