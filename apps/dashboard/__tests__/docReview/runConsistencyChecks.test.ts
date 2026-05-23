import { describe, expect, it } from "vitest";
import { runConsistencyChecks } from "../../lib/docReview/runConsistencyChecks";
import type { ClassifiedDoc } from "../../lib/docReview/types";
import type { RepoReport } from "../../lib/reportTypes";

describe("runConsistencyChecks", () => {
  it("warns on duplicate doc keys", () => {
    const classified: ClassifiedDoc[] = [
      { path: "docs/sp1a.md", docType: "sprint_plan", sprintNumber: 1 },
      { path: "docs/sp1b.md", docType: "sprint_plan", sprintNumber: 1 },
    ];
    const { warnings } = runConsistencyChecks(classified, null);
    expect(warnings.some((w) => w.code === "duplicate_doc_key")).toBe(true);
  });

  it("warns when repo language lacks matching code standards doc", () => {
    const classified: ClassifiedDoc[] = [
      { path: "docs/release.md", docType: "release_plan" },
    ];
    const report = {
      github: {
        languages: [{ language: "TypeScript", bytes: 1000, percentage: 80 }],
      },
    } as RepoReport;
    const { warnings } = runConsistencyChecks(classified, report);
    expect(warnings.some((w) => w.code === "language_coverage_gap")).toBe(true);
  });

  it("does not warn per-language when general standards exist", () => {
    const classified: ClassifiedDoc[] = [
      { path: "CODE_STANDARDS.md", docType: "code_standards", language: null },
    ];
    const report = {
      github: {
        languages: [{ language: "TypeScript", bytes: 1000, percentage: 80 }],
      },
    } as RepoReport;
    const { warnings } = runConsistencyChecks(classified, report);
    expect(warnings.some((w) => w.code === "language_coverage_gap")).toBe(false);
  });

  it("warns on sprint numbers outside 1–4", () => {
    const classified: ClassifiedDoc[] = [
      { path: "docs/sp9.md", docType: "sprint_plan", sprintNumber: 9 },
    ];
    const { warnings } = runConsistencyChecks(classified, null);
    expect(warnings.some((w) => w.code === "invalid_sprint_number")).toBe(true);
  });

  it("warns when multiple release plans are classified", () => {
    const classified: ClassifiedDoc[] = [
      { path: "docs/r1.md", docType: "release_plan" },
      { path: "docs/r2.md", docType: "release_plan" },
    ];
    const { warnings } = runConsistencyChecks(classified, null);
    expect(warnings.some((w) => w.code === "multiple_release_plans")).toBe(true);
  });

  it("emits informational warning when release_plan is missing", () => {
    const classified: ClassifiedDoc[] = [
      { path: "docs/sp1.md", docType: "sprint_plan", sprintNumber: 1 },
    ];
    const { warnings } = runConsistencyChecks(classified, null);
    expect(warnings.some((w) => w.code === "missing_release_plan")).toBe(true);
  });
});
