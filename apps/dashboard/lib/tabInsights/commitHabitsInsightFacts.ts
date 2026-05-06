import type { RepoReport } from "@/lib/reportTypes";
import {
  COMMIT_HABITS_SCOPE_TEAM,
  findContributorForScope,
  type CommitHabitsScopeId,
} from "@/lib/commitHabitsScopeMetrics";
import { computeCommitHabitsScore, computeCommitHabitsScoreForContributor } from "@/lib/commitHabitsScore";
import { RESULTS_TAB } from "@/lib/resultsNavigation";
import type { TabInsightId } from "./types";

/** Serializable facts for Commit Habits tab-insight prompts (keep small). */
export interface CommitHabitsInsightFacts {
  tabId: TabInsightId;
  commitSha: string;
  repoUrl: string;
  /** "team" = whole repo metrics; "contributor" = selected author from Commit Habits scope. */
  scopeMode: "team" | "contributor";
  /** Human-readable scope label (display name or "Whole repository"). */
  scopeLabel: string;
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
  /** Mean ms between consecutive commits (typical gap). */
  entropyMeanMs: number;
  pctOver500Loc: number;
  gitMode: string;
  recentWindowEmpty: boolean;
  contributorCount: number;
  topChurnFiles: string[];
}

export function buildCommitHabitsInsightFacts(
  report: RepoReport,
  scopeId: CommitHabitsScopeId = COMMIT_HABITS_SCOPE_TEAM,
): CommitHabitsInsightFacts {
  const git = report.git;
  const gv2 = report.gitMetricsV2;
  const trimmed = String(scopeId ?? "").trim();
  const isTeam = scopeId === COMMIT_HABITS_SCOPE_TEAM || trimmed === "";
  const c = !isTeam ? findContributorForScope(report, scopeId) : undefined;

  const scopeMode: "team" | "contributor" = c ? "contributor" : "team";
  const scopeLabel = c ? (c.displayName || c.authorEmail || c.id) : "Whole repository";

  let ch = computeCommitHabitsScore(report);
  let tc = git?.totalCommits ?? 0;
  let cpw = git?.commitsPerWeek ?? 0;
  let avgLinesPerCommit = git?.avgLinesPerCommit ?? 0;
  let medianCommitSize = gv2?.commitStats?.medianCommitSize ?? git?.medianCommitSize ?? 0;
  let burstRatio = gv2?.burstStats?.burstRatio ?? 0;
  let entropyStdDevMs = gv2?.entropy?.stdDevTimeBetweenCommits ?? 0;
  let entropyMeanMs = gv2?.entropy?.meanTimeBetweenCommits ?? 0;
  let pctOver500 =
    gv2?.commitStats?.pctOver500Loc ?? Math.round((git?.largeCommitRatio ?? 0) * 1000) / 10;
  let churnMods = (gv2?.churn?.topByModifications ?? []) as Array<{ file: string }>;

  if (c) {
    ch = computeCommitHabitsScoreForContributor(c);
    tc = c.commitCount;
    cpw = c.commitsPerWeek ?? 0;
    avgLinesPerCommit = c.commitCount > 0 ? (c.linesAdded + c.linesDeleted) / c.commitCount : 0;
    medianCommitSize = c.commitStats.medianCommitSize;
    burstRatio = c.burstStats.burstRatio;
    entropyStdDevMs = c.entropy.stdDevTimeBetweenCommits;
    entropyMeanMs = c.entropy.meanTimeBetweenCommits ?? 0;
    pctOver500 = c.commitStats.pctOver500Loc;
    churnMods = (c.churn?.topByModifications ?? gv2?.churn?.topByModifications ?? []) as Array<{
      file: string;
    }>;
  }

  const recentWindowEmpty = tc > 0 && cpw === 0 && Boolean(gv2);
  const topChurnFiles = churnMods.slice(0, 5).map((x) => x.file);

  return {
    tabId: RESULTS_TAB.commitHabits,
    commitSha: report.source?.commit?.slice(0, 12) ?? "",
    repoUrl: report.source?.url ?? "",
    scopeMode,
    scopeLabel,
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
    avgLinesPerCommit,
    medianCommitSize,
    burstRatio,
    entropyStdDevMs,
    entropyMeanMs,
    pctOver500Loc: typeof pctOver500 === "number" ? pctOver500 : 0,
    gitMode: git?.mode ?? "unknown",
    recentWindowEmpty,
    contributorCount: report.contributors?.length ?? 0,
    topChurnFiles,
  };
}
