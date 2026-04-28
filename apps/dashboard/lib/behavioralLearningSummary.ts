import type { RepoReport } from "@/lib/reportTypes";

const BURST_THRESHOLD = 10;
const LARGE_COMMIT_THRESHOLD = 15;
const DUPLICATION_THRESHOLD = 10;
const CHURN_DOMINANT_MIN_MODS = 8;
const SMALL_HISTORY_MAX_COMMITS = 8;

type ChurnRow = { file: string; modifications: number; linesChanged: number };

function getChurnLists(report: RepoReport): {
  byMods: ChurnRow[];
  byLines: ChurnRow[];
} {
  const churn = report.gitMetricsV2?.churn;
  return {
    byMods: (churn?.topByModifications ?? []) as ChurnRow[],
    byLines: (churn?.topByLinesChanged ?? []) as ChurnRow[],
  };
}

/**
 * Short, student-voiced takeaway lines for the Behavioral tab (heuristics only).
 * Max length enforced by caller (cap at 4).
 */
export function buildBehavioralLearningTakeaways(report: RepoReport): string[] {
  const statements: string[] = [];
  const git = report.git;
  const gv2 = report.gitMetricsV2;
  const totalCommits = git?.totalCommits ?? 0;

  if (totalCommits > 0 && totalCommits <= SMALL_HISTORY_MAX_COMMITS) {
    statements.push(
      "History is still short—treat these patterns as early signals and revisit after more commits."
    );
  }

  const burstRatio = gv2?.burstStats?.burstRatio ?? 0;
  if (typeof burstRatio === "number" && burstRatio >= BURST_THRESHOLD) {
    statements.push(
      "Many commits fall into quick clusters (bursts). You might discuss whether that matches how you integrate work—for example, end-of-session pushes or pair sessions."
    );
  }

  const largeCommitRatio =
    gv2?.commitStats?.pctOver500Loc ?? git?.largeCommitRatio ?? 0;
  if (typeof largeCommitRatio === "number" && largeCommitRatio >= LARGE_COMMIT_THRESHOLD) {
    statements.push(
      "A notable share of commits are very large. Smaller, review-sized commits often make teamwork and rollbacks easier—worth agreeing on norms together."
    );
  }

  const dup = report.duplication?.percentage;
  if (typeof dup === "number" && dup >= DUPLICATION_THRESHOLD) {
    statements.push(
      "Duplicated lines appear across the repo. Sometimes that is shared scaffolding; sometimes it hints at drift—worth spotting together before it spreads."
    );
  }

  const { byMods, byLines } = getChurnLists(report);
  const topMods = byMods[0];
  const secondMods = byMods[1];
  if (
    topMods &&
    topMods.modifications >= CHURN_DOMINANT_MIN_MODS &&
    secondMods &&
    topMods.modifications >= secondMods.modifications * 2
  ) {
    statements.push(
      `One area of the tree ("${truncatePath(topMods.file)}") shows many more touches than most other files—often a good place to coordinate integration as a team.`
    );
  } else if (
    byLines[0] &&
    byLines[0].linesChanged >= CHURN_DOMINANT_MIN_MODS * 40 &&
    (byMods.find((r) => r.file === byLines[0].file)?.modifications ?? 0) >= 4
  ) {
    statements.push(
      `Heavy churn on "${truncatePath(byLines[0].file)}" may mark a hotspot for reviews or design discussion—not necessarily a problem on its own.`
    );
  }

  return statements.slice(0, 4);
}

function truncatePath(path: string, max = 48): string {
  if (path.length <= max) return path;
  return `…${path.slice(-(max - 1))}`;
}
