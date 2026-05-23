import { describe, expect, it } from "vitest";
import { normalizeReviewByDocType } from "../../lib/docReview/validate";

describe("normalizeReviewByDocType", () => {
  it("accepts structured sprint_plan with checklist and coach", () => {
    const result = normalizeReviewByDocType("sprint_plan", {
      checklist: { heading_complete: true, sprint_goal_present: false },
      coach: "Your team listed clear sprint goals.",
    });
    expect(result.kind).toBe("structured");
    if (result.kind === "structured") {
      expect(result.payload.checklist.heading_complete).toBe(true);
      expect(result.payload.coach).toContain("sprint goals");
    }
  });

  it("rejects structured doc without checklist object", () => {
    const result = normalizeReviewByDocType("release_plan", {
      coach: "Nice work",
    });
    expect(result).toEqual({ kind: "invalid", reason: "missing_checklist" });
  });

  it("accepts holistic definition_of_done", () => {
    const result = normalizeReviewByDocType("definition_of_done", {
      strengths: "Criteria are specific.",
      improvements: "Add task-level done rules.",
    });
    expect(result.kind).toBe("holistic");
  });

  it("rejects holistic doc with empty fields", () => {
    const result = normalizeReviewByDocType("code_standards", {});
    expect(result).toEqual({ kind: "invalid", reason: "missing_holistic_fields" });
  });

  it("rejects unknown doc types", () => {
    const result = normalizeReviewByDocType("unknown", {
      strengths: "x",
      improvements: "y",
    });
    expect(result).toEqual({ kind: "invalid", reason: "unknown_doc_type" });
  });
});
