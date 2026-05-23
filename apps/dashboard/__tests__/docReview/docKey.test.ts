import { describe, expect, it } from "vitest";
import { docKey, markDuplicateClassifications } from "../../lib/docReview/docKey";
import type { ClassifiedDoc } from "../../lib/docReview/types";

describe("docKey", () => {
  it("includes sprint number when present", () => {
    expect(
      docKey({ docType: "sprint_plan", sprintNumber: 2 }),
    ).toBe("sprint_plan_2");
  });

  it("uses docType alone without sprint", () => {
    expect(docKey({ docType: "release_plan" })).toBe("release_plan");
  });
});

describe("markDuplicateClassifications", () => {
  it("flags second duplicate by path sort order", () => {
    const input: ClassifiedDoc[] = [
      { path: "docs/b-sprint1.md", docType: "sprint_plan", sprintNumber: 1 },
      { path: "docs/a-sprint1.md", docType: "sprint_plan", sprintNumber: 1 },
    ];
    const out = markDuplicateClassifications(input);
    const a = out.find((d) => d.path === "docs/a-sprint1.md");
    const b = out.find((d) => d.path === "docs/b-sprint1.md");
    expect(a?.duplicate).toBe(false);
    expect(b?.duplicate).toBe(true);
  });
});
