/**
 * Deterministic Commit Habits score (0–100) for the overview tile + tab-insight facts.
 *
 * v1 uses five equally weighted sub-scores (0.20 each, placeholder — tune on real cohorts).
 * Tier bands: strong ≥70, good ≥55, needs_work ≥35, else critical.
 */

import type { RepoReport } from "./reportTypes";

export type CommitHabitsTier = "strong" | "good" | "needs_work" | "critical";

export interface CommitHabitsDriver {
  id: string;
  label: string;
  /** Component quality 0–100 for this pillar (before overall weighting). */
  score: number;
  advice: string;
}

export interface CommitHabitsScoreResult {
  score: number;
  tier: CommitHabitsTier;
  headline: string;
  drivers: CommitHabitsDriver[];
  /** Lowest pillar — primary coaching lever. */
  worst: CommitHabitsDriver;
}

const WEIGHT = 1 / 5;

/** ms — treat rhythm volatility above ~10d between-commit std dev as weak */
const MS_PER_DAY = 86400000;
const RHYTHM_STD_DEV_BAD_MS = 10 * MS_PER_DAY;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function roundScore(x: number): number {
  return Math.round(Math.max(0, Math.min(100, x)));
}

/**
 * Commits/week: reward steady activity; 0 cpw with history handled upstream in UI flags.
 */
function scoreCadence(commitsPerWeek: number): number {
  if (commitsPerWeek <= 0) return 25;
  if (commitsPerWeek < 0.35) return 35;
  if (commitsPerWeek < 1.2) return 45 + ((commitsPerWeek - 0.35) / (1.2 - 0.35)) * 25;
  if (commitsPerWeek < 3) return 70 + ((commitsPerWeek - 1.2) / (3 - 1.2)) * 20;
  return Math.min(100, 90 + (commitsPerWeek - 3) * 2);
}

function scoreVolume(totalCommits: number): number {
  if (totalCommits <= 0) return 0;
  if (totalCommits < 5) return 25 + totalCommits * 8;
  if (totalCommits < 15) return 55 + ((totalCommits - 5) / 10) * 15;
  if (totalCommits < 50) return 70 + ((totalCommits - 15) / 35) * 20;
  return Math.min(100, 88 + (totalCommits - 50) * 0.15);
}

/** Lower large-batch share is better (pct 0–100). */
function scoreBatchDiscipline(pctLargeOrOver500: number): number {
  const p = clamp01(pctLargeOrOver500 / 100);
  return roundScore(100 * (1 - p));
}

/** Lower burst ratio (share of commits in bursts) is better. */
function scoreBurstDiscipline(burstRatioPct: number): number {
  const p = clamp01(burstRatioPct / 100);
  return roundScore(100 * (1 - p * 0.95));
}

/**
 * Time-between-commits volatility (ms std dev). Very high → sporadic gaps; 0 → little signal.
 */
function scoreRhythm(stdDevMs: number): number {
  if (stdDevMs <= 0) return 55;
  const t = clamp01(stdDevMs / RHYTHM_STD_DEV_BAD_MS);
  return roundScore(100 * (1 - t));
}

function tierFromScore(score: number): CommitHabitsTier {
  if (score >= 70) return "strong";
  if (score >= 55) return "good";
  if (score >= 35) return "needs_work";
  return "critical";
}

function buildHeadline(tier: CommitHabitsTier, worst: CommitHabitsDriver): string {
  const focus = worst.score >= 75 ? "balanced habits" : `watch ${worst.label.toLowerCase()}`;
  switch (tier) {
    case "strong":
      return `Consistent cadence and healthy commit rhythm — ${focus}.`;
    case "good":
      return `Solid commit volume — ${focus}.`;
    case "needs_work":
      return `Commit habits need attention — prioritize ${worst.label.toLowerCase()}.`;
    default:
      return `Early or sparse commits — focus on ${worst.label.toLowerCase()} next.`;
  }
}

export function computeCommitHabitsScore(report: RepoReport): CommitHabitsScoreResult {
  const git = report.git;
  const gv2 = report.gitMetricsV2;

  const totalCommits = git?.totalCommits ?? 0;
  const commitsPerWeek = git?.commitsPerWeek ?? 0;

  if (totalCommits <= 0) {
    const drivers: CommitHabitsDriver[] = [
      {
        id: "cadence",
        label: "Weekly cadence",
        score: 0,
        advice:
          "Start committing early—even README or scaffold commits establish rhythm.",
      },
      {
        id: "volume",
        label: "Commit volume",
        score: 0,
        advice:
          "Push small slices as you go so history reflects real progress.",
      },
      {
        id: "batch_size",
        label: "Batch size",
        score: 50,
        advice:
          "When you start committing, keep each change set reviewable.",
      },
      {
        id: "burstiness",
        label: "Burstiness",
        score: 50,
        advice:
          "Spread work across days instead of one mega-session.",
      },
      {
        id: "rhythm",
        label: "Rhythm consistency",
        score: 50,
        advice:
          "Touch the repo regularly so CI and teammates stay aligned.",
      },
    ];
    const worst = drivers[1]!;
    return {
      score: 0,
      tier: "critical",
      headline: "No commits in this snapshot yet—start with small, frequent pushes.",
      drivers,
      worst,
    };
  }

  const pctOver500 = gv2?.commitStats?.pctOver500Loc ?? (git?.largeCommitRatio ?? 0) * 100;
  const burstRatio = gv2?.burstStats?.burstRatio ?? 0;
  const stdDevMs = gv2?.entropy?.stdDevTimeBetweenCommits ?? 0;

  const cadence = scoreCadence(commitsPerWeek);
  const volume = scoreVolume(totalCommits);
  const batch = scoreBatchDiscipline(typeof pctOver500 === "number" ? pctOver500 : 0);
  const burst = scoreBurstDiscipline(typeof burstRatio === "number" ? burstRatio : 0);
  const rhythm = scoreRhythm(stdDevMs);

  const drivers: CommitHabitsDriver[] = [
    {
      id: "cadence",
      label: "Weekly cadence",
      score: roundScore(cadence),
      advice:
        "Aim for small integrations several times per week instead of rare large pushes—even short sessions compound.",
    },
    {
      id: "volume",
      label: "Commit volume",
      score: roundScore(volume),
      advice:
        "Keep committing as features stabilize; each push should be a coherent slice you can describe in one sentence.",
    },
    {
      id: "batch_size",
      label: "Batch size",
      score: roundScore(batch),
      advice:
        "Prefer smaller diffs: split refactors from features so reviews catch mistakes earlier.",
    },
    {
      id: "burstiness",
      label: "Burstiness",
      score: roundScore(burst),
      advice:
        "Spread work across days instead of stacking many commits in one burst—steady rhythm reduces integration risk.",
    },
    {
      id: "rhythm",
      label: "Rhythm consistency",
      score: roundScore(rhythm),
      advice:
        "Avoid long silent gaps then spikes; touch the repo regularly so CI and teammates stay aligned.",
    },
  ];

  const weighted =
    WEIGHT *
    drivers.reduce((s, d) => s + d.score, 0);

  const score = roundScore(weighted);
  const tier = tierFromScore(score);

  const worst = drivers.reduce((a, b) => (a.score <= b.score ? a : b));

  return {
    score,
    tier,
    headline: buildHeadline(tier, worst),
    drivers,
    worst,
  };
}
