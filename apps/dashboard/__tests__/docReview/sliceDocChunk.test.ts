import { describe, expect, it } from "vitest";
import { sliceDocChunk } from "../../lib/docReview/extractText";

describe("sliceDocChunk", () => {
  it("slices at chunkIndex * 12000 boundaries", () => {
    const text = "x".repeat(25_000);
    expect(sliceDocChunk(text, 0).length).toBe(12_000);
    expect(sliceDocChunk(text, 1).length).toBe(12_000);
    expect(sliceDocChunk(text, 2).length).toBe(1_000);
    expect(sliceDocChunk(text, 3)).toBe("");
  });
});
