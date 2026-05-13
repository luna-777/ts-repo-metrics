import { describe, expect, it } from "vitest";
import {
  classifyStageByPath,
  classifyStageByTimestamp,
  computeAUMScore,
} from "../lib/aiMaturityCore";

describe("aiMaturityCore", () => {
  describe("classifyStageByPath", () => {
    it("returns null for empty or whitespace working dir", () => {
      expect(classifyStageByPath("")).toBeNull();
      expect(classifyStageByPath("   ")).toBeNull();
    });

    it("classifies test paths as Testing", () => {
      expect(classifyStageByPath("proj/__tests__/foo.test.ts")).toBe("Testing");
      expect(classifyStageByPath(String.raw`proj\spec\bar.spec.tsx`)).toBe(
        "Testing",
      );
    });

    it("classifies docs and readme-style paths as Planning", () => {
      expect(classifyStageByPath("proj/docs/readme.md")).toBe("Planning");
      expect(classifyStageByPath("notes.txt")).toBe("Planning");
    });

    it("classifies typical app source as Implementation", () => {
      expect(classifyStageByPath("proj/src/App.tsx")).toBe("Implementation");
    });

    it("classifies CI workflow paths as Deployment", () => {
      expect(
        classifyStageByPath("myrepo/.github/workflows/ci.yml"),
      ).toBe("Deployment");
    });

    it("classifies package manifest paths as Maintenance", () => {
      expect(classifyStageByPath("repo/package.json")).toBe("Maintenance");
    });

    it("defaults to Implementation when no pattern matches", () => {
      expect(classifyStageByPath("foo/bar.dat")).toBe("Implementation");
    });
  });

  describe("classifyStageByTimestamp", () => {
    const start = 0;
    const end = 100;

    it("returns Implementation when range is non-positive", () => {
      expect(classifyStageByTimestamp(50, 100, 100)).toBe("Implementation");
      expect(classifyStageByTimestamp(50, 100, 99)).toBe("Implementation");
    });

    it("maps session timeline percentiles to stages", () => {
      expect(classifyStageByTimestamp(0, start, end)).toBe("Planning");
      expect(classifyStageByTimestamp(14, start, end)).toBe("Planning");
      expect(classifyStageByTimestamp(15, start, end)).toBe("Implementation");
      expect(classifyStageByTimestamp(64, start, end)).toBe("Implementation");
      expect(classifyStageByTimestamp(65, start, end)).toBe("Testing");
      expect(classifyStageByTimestamp(79, start, end)).toBe("Testing");
      expect(classifyStageByTimestamp(80, start, end)).toBe("Deployment");
      expect(classifyStageByTimestamp(89, start, end)).toBe("Deployment");
      expect(classifyStageByTimestamp(90, start, end)).toBe("Maintenance");
      expect(classifyStageByTimestamp(100, start, end)).toBe("Maintenance");
    });
  });

  describe("computeAUMScore", () => {
    it("returns 0 when there are no sessions", () => {
      expect(computeAUMScore(3, 0.5, 0)).toBe(0);
    });

    it("combines iteration and verification proxies", () => {
      expect(computeAUMScore(2, 0.5, 5)).toBe(68);
      expect(computeAUMScore(1, 1, 1)).toBe(100);
    });
  });
});
