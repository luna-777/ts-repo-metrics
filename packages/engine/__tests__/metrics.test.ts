import { describe, it, expect } from "vitest";
import {
  calculateMIGradAiRaw,
  normalizeMIGradAi,
} from "../src/utils/metrics.js";

describe("GRAD-AI MI helpers", () => {
  it("normalizes MI_raw=171 to 100", () => {
    expect(normalizeMIGradAi(171)).toBe(100);
  });

  it("clamps negative raw to 0 norm", () => {
    expect(normalizeMIGradAi(-50)).toBe(0);
  });

  it("computes stable MI_raw for fixed V, CC, LOC", () => {
    const raw = calculateMIGradAiRaw(100, 5, 20);
    expect(raw).toBeGreaterThan(0);
    expect(raw).toBeCloseTo(
      171 -
        5.2 * Math.log(100) -
        0.23 * 5 -
        16.2 * Math.log(20),
      2,
    );
  });
});
