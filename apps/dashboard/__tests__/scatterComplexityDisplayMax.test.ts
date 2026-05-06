import { describe, expect, it } from "vitest";
import { scatterComplexityDisplayMax } from "@/lib/symbolRiskViz";

describe("scatterComplexityDisplayMax", () => {
  it("uses raw max when few points", () => {
    expect(scatterComplexityDisplayMax([3, 53])).toEqual({ xMax: 53, capped: false });
  });

  it("caps when one extreme outlier and bulk is low", () => {
    const bulk = Array.from({ length: 80 }, (_, i) => 2 + (i % 12));
    const xs = [...bulk, 53];
    const { xMax, capped } = scatterComplexityDisplayMax(xs);
    expect(capped).toBe(true);
    expect(xMax).toBeLessThan(53);
    expect(xMax).toBeGreaterThanOrEqual(14);
  });

  it("does not cap when max is already modest", () => {
    const { xMax, capped } = scatterComplexityDisplayMax([1, 2, 4, 8, 15, 16]);
    expect(capped).toBe(false);
    expect(xMax).toBe(16);
  });
});
