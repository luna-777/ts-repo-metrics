import { describe, expect, it } from "vitest";
import { inferDocTypeFromFilename } from "../../lib/docReview/inferDocTypeFromFilename";

describe("inferDocTypeFromFilename", () => {
  it("classifies sprint report filenames", () => {
    expect(inferDocTypeFromFilename("documentation/sprints/sprint1-report.md")).toEqual({
      docType: "sprint_report",
      sprintNumber: 1,
    });
    expect(inferDocTypeFromFilename("documentation/sprints/sprint2-report.md")).toEqual({
      docType: "sprint_report",
      sprintNumber: 2,
    });
  });

  it("classifies sprint plan abbreviations", () => {
    expect(inferDocTypeFromFilename("docs/spr1.md")).toEqual({
      docType: "sprint_plan",
      sprintNumber: 1,
    });
  });

  it("returns null for ambiguous names", () => {
    expect(inferDocTypeFromFilename("README.md")).toBeNull();
    expect(inferDocTypeFromFilename("agents.md")).toBeNull();
  });
});
