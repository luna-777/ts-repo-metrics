import { describe, expect, it } from "vitest";
import { validateHolistic } from "../../lib/docReview/validate";

describe("validateHolistic", () => {
  it("truncates long fields at 1000 chars", () => {
    const long = "a".repeat(1200);
    const result = validateHolistic({ strengths: long, improvements: "ok" });
    expect(result.strengths.length).toBe(1000);
    expect(result.improvements).toBe("ok");
  });
});
