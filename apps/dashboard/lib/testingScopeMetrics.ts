import type { RepoReport } from "@/lib/reportTypes";
import {
  findContributorForScope,
  COMMIT_HABITS_SCOPE_TEAM,
  type CommitHabitsScopeId,
} from "@/lib/commitHabitsScopeMetrics";

export type TestingScopeId = CommitHabitsScopeId;

export interface TestingScopeMetricValues {
  mode: "team" | "contributor";
  contributorDisplayName: string | null;
  /**
   * Team: snapshot profile.testLOC / sourceLOC / testFiles.
   * Contributor: git numstat Σ(add+del) and distinct paths for that author (test vs non-test paths).
   */
  locSource: "profile" | "gitChurn";
  testLoc: number;
  sourceLoc: number;
  testLocRatio: number;
  testFiles: number;
  /** Contributor + git churn only; distinct non-test paths this author touched. */
  sourceFilesTouched: number | null;
  pctCommitsTouchingTests: number;
  /** Commits touching tests ÷ commits touching only non-test paths (git history). */
  testToFeatureCommitRatio: number;
  refactorCommitRatio: number;
  emptyCatchBlocks: number;
  consoleLogCount: number;
  highComplexityCount: number;
  longFunctionCount: number;
  maxComplexity: number;
}

export function getTestingScopeMetricValues(
  report: RepoReport,
  scopeId: TestingScopeId,
): TestingScopeMetricValues {
  const profile = report.profile;
  const gv2 = report.gitMetricsV2;
  const complexity = report.complexity;
  const smells = report.smells;

  const repoBlock = (): Omit<TestingScopeMetricValues, "mode" | "contributorDisplayName"> => ({
    locSource: "profile" as const,
    testLoc: profile?.testLOC ?? 0,
    sourceLoc: profile?.sourceLOC ?? 1,
    testLocRatio:
      profile && profile.sourceLOC > 0 ? profile.testLOC / profile.sourceLOC : 0,
    testFiles: profile?.testFiles ?? 0,
    sourceFilesTouched: null,
    pctCommitsTouchingTests: gv2?.testCoupling?.pctCommitsTouchingTests ?? 0,
    testToFeatureCommitRatio: gv2?.testCoupling?.testToFeatureCommitRatio ?? 0,
    refactorCommitRatio: gv2?.refactorBehavior?.refactorCommitRatio ?? 0,
    emptyCatchBlocks: smells?.emptyCatchBlocks ?? 0,
    consoleLogCount: smells?.consoleLogs ?? 0,
    highComplexityCount: complexity?.highComplexityFunctions ?? 0,
    longFunctionCount: smells?.longFunctions ?? 0,
    maxComplexity: complexity?.max ?? 0,
  });

  const team = (): TestingScopeMetricValues => ({
    mode: "team",
    contributorDisplayName: null,
    ...repoBlock(),
  });

  const trimmed = String(scopeId ?? "").trim();
  if (scopeId === COMMIT_HABITS_SCOPE_TEAM || trimmed === "") {
    return team();
  }

  const c = findContributorForScope(report, scopeId);
  if (!c) {
    return team();
  }

  const rb = repoBlock();
  const testChurn = c.testLineChurn ?? 0;
  const sourceChurn = c.sourceLineChurn ?? 0;
  const testLocRatioChurn = sourceChurn > 0 ? testChurn / sourceChurn : 0;

  /**
   * Per-author test/source split needs the same numstat pipeline as `gitMetricsV2` (local `git log`).
   * Zipball / GitHub API analysis has no per-file stats — contributors exist but churn is all zeros.
   * Older cached reports may have `linesAdded` / `linesDeleted` but no churn columns; treat as unusable.
   */
  const lineActivity = (c.linesAdded ?? 0) + (c.linesDeleted ?? 0);
  const churnSum = testChurn + sourceChurn;
  /** ZIP/API: no gv2. Legacy rows: activity without churn fields reads as zeros. */
  const churnSplitMissingOrUnavailable =
    report.gitMetricsV2 == null || (lineActivity > 0 && churnSum === 0);

  if (churnSplitMissingOrUnavailable) {
    return {
      mode: "contributor",
      contributorDisplayName: c.displayName,
      ...rb,
      locSource: "profile",
      pctCommitsTouchingTests: c.testCoupling.pctCommitsTouchingTests,
      testToFeatureCommitRatio: c.testCoupling.testToFeatureCommitRatio,
      refactorCommitRatio: c.refactorBehavior.refactorCommitRatio,
    };
  }

  return {
    mode: "contributor",
    contributorDisplayName: c.displayName,
    ...rb,
    locSource: "gitChurn",
    testLoc: testChurn,
    sourceLoc: sourceChurn,
    testLocRatio: testLocRatioChurn,
    testFiles: c.testFilesTouched ?? 0,
    sourceFilesTouched: c.sourceFilesTouched ?? 0,
    pctCommitsTouchingTests: c.testCoupling.pctCommitsTouchingTests,
    testToFeatureCommitRatio: c.testCoupling.testToFeatureCommitRatio,
    refactorCommitRatio: c.refactorBehavior.refactorCommitRatio,
  };
}
