import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TestingCoreSignalsSection } from "@/components/results/rq/TestingCoreSignalsSection";
import { COMMIT_HABITS_SCOPE_TEAM } from "@/lib/commitHabitsScopeMetrics";
import type { RepoReport } from "@/lib/reportTypes";
import type { TestingScopeMetricValues } from "@/lib/testingScopeMetrics";

// The card only reads commit counts from the report, so a minimal one is enough.
const report = { git: { totalCommits: 2 } } as unknown as RepoReport;

function metrics(overrides: Partial<TestingScopeMetricValues>): TestingScopeMetricValues {
  return {
    mode: "team",
    contributorDisplayName: null,
    locSource: "profile",
    testLoc: 0,
    sourceLoc: 0,
    testLocRatio: 0,
    testFiles: 1,
    sourceFilesTouched: null,
    pctCommitsTouchingTests: 50,
    testToFeatureCommitRatio: 0,
    refactorCommitRatio: 0,
    emptyCatchBlocks: 0,
    consoleLogCount: 0,
    highComplexityCount: 0,
    longFunctionCount: 0,
    maxComplexity: 0,
    ...overrides,
  };
}

function renderCard(mv: TestingScopeMetricValues): string {
  return renderToStaticMarkup(
    createElement(TestingCoreSignalsSection, { mv, report, testingScopeId: COMMIT_HABITS_SCOPE_TEAM }),
  );
}

describe("Test-to-source card text", () => {
  it("shows the real percentage when test code is larger than source code (#256)", () => {
    const html = renderCard(metrics({ testLoc: 345, sourceLoc: 11, testLocRatio: 345 / 11 }));
    expect(html).toContain("3136.4%");
    expect(html).toContain("about 3136%");
    expect(html).not.toContain("about 100%");
  });

  it("does not cap author churn at 100%", () => {
    const html = renderCard(
      metrics({
        mode: "contributor",
        contributorDisplayName: "A. Student",
        locSource: "gitChurn",
        testLoc: 300,
        sourceLoc: 100,
        testLocRatio: 3,
      }),
    );
    expect(html).toContain("about 300%");
    expect(html).not.toMatch(/about 100%/i);
  });

  it("shows No data instead of 0% / Critical when there is no source code (#256)", () => {
    const html = renderCard(metrics({ testLoc: 345, sourceLoc: 0, testLocRatio: 0 }));
    expect(html).toContain("No data");
    expect(html).toMatch(/>—<\/p>/);
    expect(html).not.toContain("Critical");
  });

  it("shows No data when an author changed no source code", () => {
    const html = renderCard(
      metrics({
        mode: "contributor",
        contributorDisplayName: "A. Student",
        locSource: "gitChurn",
        testLoc: 50,
        sourceLoc: 0,
        testLocRatio: 0,
      }),
    );
    expect(html).toContain("No data");
    expect(html).toMatch(/>—<\/p>/);
    expect(html).not.toContain("Critical");
  });
});