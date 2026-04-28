import type { RepoReport } from "@/lib/reportTypes";

const LOW_TEST_LOC_RATIO = 0.1;
const HIGH_COMPLEXITY_COUNT = 8;
const LONG_FUNCTIONS_COUNT = 5;
const LOW_COMMIT_TEST_TOUCH_PCT = 15;

function riskRaw(report: RepoReport): number {
  const h = report.complexity?.highComplexityFunctions ?? 0;
  const l = report.smells?.longFunctions ?? 0;
  return h + l;
}

/**
 * Verification tab takeaway lines (repo-level heuristics). Max length 4.
 */
export function buildVerificationLearningTakeaways(report: RepoReport): string[] {
  const statements: string[] = [];
  const profile = report.profile;
  const sourceLoc = profile?.sourceLOC ?? 1;
  const testLoc = profile?.testLOC ?? 0;
  const testLocRatio = sourceLoc > 0 ? testLoc / sourceLoc : 0;

  const gv2 = report.gitMetricsV2;
  const pctTest = gv2?.testCoupling?.pctCommitsTouchingTests ?? 0;

  const risk = riskRaw(report);

  if (
    typeof testLocRatio === "number" &&
    testLocRatio < LOW_TEST_LOC_RATIO &&
    risk >= HIGH_COMPLEXITY_COUNT
  ) {
    statements.push(
      "Structural hotspots show up without much test density by line count—you might prioritize tests or careful review around the hardest areas."
    );
  }

  if (typeof pctTest === "number" && pctTest < LOW_COMMIT_TEST_TOUCH_PCT && risk >= HIGH_COMPLEXITY_COUNT) {
    statements.push(
      "Few commits touch tests while complexity is noticeable—often worth pairing feature work with a test strategy the whole team agrees on."
    );
  }

  if (risk >= HIGH_COMPLEXITY_COUNT || (report.smells?.longFunctions ?? 0) >= LONG_FUNCTIONS_COUNT) {
    if (testLocRatio >= LOW_TEST_LOC_RATIO) {
      statements.push(
        "You do have measurable test footprint; make sure complexity-heavy modules still have assertions where reviewers would lean on intuition."
      );
    }
  }

  const catches = report.smells?.emptyCatchBlocks ?? 0;
  if (catches > 0) {
    statements.push(
      "Empty catch blocks hide failures quietly—consider logging, rethrowing, or narrowing the try/coverage so callers can reason about errors."
    );
  }

  return statements.slice(0, 4);
}
