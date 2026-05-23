import { describe, expect, it } from "vitest";
import { validateCoach } from "../../lib/docReview/validate";

describe("validateCoach", () => {
  it("clears grade language including benign uses of pass/fail words", () => {
    expect(validateCoach({ coach: "this deserves a pass" })).toBe("");
    // Known limitation: \bpass\b also matches test-plan "Pass or Fail" phrasing
    expect(
      validateCoach({ coach: "Each scenario is marked Pass or Fail clearly." }),
    ).toBe("");
  });

  it("returns trimmed coach text when safe", () => {
    const text = "Your team documented sprint goals clearly.";
    expect(validateCoach({ coach: text })).toBe(text);
  });
});
