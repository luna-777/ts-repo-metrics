import type { OverviewCardItem } from "@/components/results/OverviewCard";
import type { CommitHabitsTier } from "@/lib/commitHabitsScore";
import { computeCommitHabitsScore } from "@/lib/commitHabitsScore";
import {
  computeCodeQualityScore,
  computeReactHealthScore,
  computeTestingScore,
} from "@/lib/coachSays/coachSaysFacts";
import { healthTierFromScore } from "@/lib/healthTier";
import { tryGetPhase2Summary } from "@/lib/phase2Summary";
import type { RepoReport } from "@/lib/reportTypes";
import { panelScrollIdForCoachTab, RESULTS_TAB } from "@/lib/resultsNavigation";

function roundScore(x: number): number {
  return Math.round(Math.max(0, Math.min(100, x)));
}

function codeComplexityScore(report: RepoReport): number {
  const p2 = tryGetPhase2Summary(report);
  if (!p2 || p2.functionsWithPhase2 <= 0) return 50;
  return roundScore(p2.miNormMean * 1.1);
}

export interface OverviewScoreStrip {
  /** Sorted highest score first (left); weakest is last (right). */
  items: OverviewCardItem[];
  weakestCardId: string;
}

/**
 * Five SDLC health tiles for the overview row (no Dataset / AI Usage tile).
 * Order is recomputed on every report so strongest appears left and weakest right.
 */
export function buildOverviewScoreStrip(
  report: RepoReport,
  includeReactTile: boolean,
): OverviewScoreStrip {
  const ch = computeCommitHabitsScore(report);
  const testingScore = computeTestingScore(report);
  const cqScore = computeCodeQualityScore(report);
  const p2 = tryGetPhase2Summary(report);
  const complexityScore = codeComplexityScore(report);
  const reactScore = computeReactHealthScore(report);
  const pctTests = Math.round(report.gitMetricsV2?.testCoupling?.pctCommitsTouchingTests ?? 0);

  const items: OverviewCardItem[] = [];

  items.push({
    id: "commit-habits",
    title: "Commit Habits",
    tier: ch.tier,
    score: ch.score,
    description: ch.headline,
    detailsTab: RESULTS_TAB.commitHabits,
    detailsHref: `#${panelScrollIdForCoachTab(RESULTS_TAB.commitHabits)}`,
  });

  items.push({
    id: "testing",
    title: "Testing",
    tier: healthTierFromScore(testingScore),
    score: testingScore,
    description: `${pctTests}% of commits touch test paths · ${report.profile?.testFiles ?? 0} test file(s)`,
    detailsTab: RESULTS_TAB.testing,
    detailsHref: `#${panelScrollIdForCoachTab(RESULTS_TAB.testing)}`,
  });

  items.push({
    id: "code-quality",
    title: "Code Quality",
    tier: healthTierFromScore(cqScore),
    score: cqScore,
    description: `${report.complexity?.highComplexityFunctions ?? 0} high-complexity functions · ${(
      report.duplication?.percentage ?? 0
    ).toFixed(1)}% duplication`,
    detailsTab: RESULTS_TAB.codeQuality,
    detailsHref: `#${panelScrollIdForCoachTab(RESULTS_TAB.codeQuality)}`,
  });

  items.push({
    id: "code-complexity",
    title: "Code Complexity",
    tier: healthTierFromScore(complexityScore),
    score: complexityScore,
    description: p2
      ? `Mean MI_norm ${p2.miNormMean.toFixed(1)} · ${p2.functionsWithPhase2} functions`
      : "Per-function metrics when Halstead / cognitive data is available",
    detailsTab: RESULTS_TAB.codeComplexity,
    detailsHref: `#${panelScrollIdForCoachTab(RESULTS_TAB.codeComplexity)}`,
  });

  if (includeReactTile && reactScore != null) {
    items.push({
      id: "react-components",
      title: "React Components",
      tier: healthTierFromScore(reactScore),
      score: reactScore,
      description: `${report.reactMetrics?.summary?.componentsAnalyzed ?? 0} components analyzed`,
      detailsTab: RESULTS_TAB.reactComponents,
      detailsHref: `#${panelScrollIdForCoachTab(RESULTS_TAB.reactComponents)}`,
    });
  }

  const sorted = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const weakestCardId = sorted[sorted.length - 1]?.id ?? "commit-habits";

  return { items: sorted, weakestCardId };
}
