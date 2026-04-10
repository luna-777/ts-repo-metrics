import { describe, expect, it } from "vitest";
import {
  computeWeightedRedundancy,
  levenshteinRatio,
} from "../src/collect/weightedRedundancy.js";

describe("levenshteinRatio", () => {
  it("returns 1 for identical strings", () => {
    expect(levenshteinRatio("abc", "abc")).toBe(1);
  });

  it("returns between 0 and 1 for typos", () => {
    const r = levenshteinRatio("hello world", "hallo world");
    expect(r).toBeGreaterThan(0.8);
    expect(r).toBeLessThan(1);
  });
});

describe("computeWeightedRedundancy", () => {
  it("returns zero for empty duplicates", () => {
    const r = computeWeightedRedundancy("/tmp", [], 1000);
    expect(r.srs).toBe(0);
    expect(r.weightedNumerator).toBe(0);
  });
});
