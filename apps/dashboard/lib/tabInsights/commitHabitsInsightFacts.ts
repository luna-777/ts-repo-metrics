import type { RepoReport } from "@/lib/reportTypes";
import { computeCommitHabitsScore } from "@/lib/commitHabitsScore";
import { RESULTS_TAB } from "@/lib/resultsNavigation";
import type { TabInsightId } from "./types";

/** Serializable facts for Commit Habits tab-insight prompts (keep small). */
export interface CommitHabitsInsightFacts {
  tabId: TabInsightId;
  commitSha: string;
  repoUrl: string;
  overallCommitHabitsScore: number;
  overallTier: string;
  headline: string;
  worstDriver: {
    id: string;
    label: string;
    score: number;
    advice: string;
  };
  drivers: Array<{ id: string; label: string; score: number }>;
  totalCommits: number;
  commitsPerWeek: number;
  /** Mean lines changed per commit (from git summary). */
  avgLinesPerCommit: number;
  medianCommitSize: number;
  burstRatio: number;
  entropyStdDevMs: number;
  pctOver500Loc: number;
  gitMode: string;
  recentWindowEmpty: boolean;
  contributorCount: number;
  topChurnFiles: string[];
}

export function buildCommitHabitsInsightFacts(report: RepoReport): CommitHabitsInsightFacts {
  const ch = computeCommitHabitsScore(report);
  const git = report.git;
  const gv2 = report.gitMetricsV2;

  const tc = git?.totalCommits ?? 0;
  const cpw = git?.commitsPerWeek ?? 0;
  const recentWindowEmpty = tc > 0 && cpw === 0 && Boolean(gv2);

  const churnMods = (gv2?.churn?.topByModifications ?? []) as Array<{ file: string }>;
  const topChurnFiles = churnMods.slice(0, 5).map((x) => x.file);

  const pctOver500 =
    gv2?.commitStats?.pctOver500Loc ?? Math.round((git?.largeCommitRatio ?? 0) * 1000) / 10;

  return {
    tabId: RESULTS_TAB.commitHabits,
    commitSha: report.source?.commit?.slice(0, 12) ?? "",
    repoUrl: report.source?.url ?? "",
    overallCommitHabitsScore: ch.score,
    overallTier: ch.tier,
    headline: ch.headline,
    worstDriver: {
      id: ch.worst.id,
      label: ch.worst.label,
      score: ch.worst.score,
      advice: ch.worst.advice,
    },
    drivers: ch.drivers.map((d) => ({ id: d.id, label: d.label, score: d.score })),
    totalCommits: tc,
    commitsPerWeek: cpw,
    avgLinesPerCommit: git?.avgLinesPerCommit ?? 0,
    medianCommitSize: gv2?.commitStats?.medianCommitSize ?? git?.medianCommitSize ?? 0,
    burstRatio: gv2?.burstStats?.burstRatio ?? 0,
    entropyStdDevMs: gv2?.entropy?.stdDevTimeBetweenCommits ?? 0,
    pctOver500Loc: typeof pctOver500 === "number" ? pctOver500 : 0,
    gitMode: git?.mode ?? "unknown",
    recentWindowEmpty,
    contributorCount: report.contributors?.length ?? 0,
    topChurnFiles,
  };
}
