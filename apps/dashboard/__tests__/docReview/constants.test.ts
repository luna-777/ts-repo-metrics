import { describe, expect, it } from "vitest";
import {
  isDocExtension,
  isDocsPoolPath,
  pathDepth,
} from "../../lib/docReview/constants";

describe("isDocsPoolPath", () => {
  it("matches standard and extended docs folder prefixes", () => {
    expect(isDocsPoolPath("docs/readme.md")).toBe(true);
    expect(isDocsPoolPath("Documents/Plan.md")).toBe(true);
    expect(isDocsPoolPath("deliverables/sprint1.pdf")).toBe(true);
    expect(isDocsPoolPath("artifacts/report.md")).toBe(true);
  });

  it("does not match repo-root or src paths", () => {
    expect(isDocsPoolPath("README.md")).toBe(false);
    expect(isDocsPoolPath("src/utils.md")).toBe(false);
    expect(isDocsPoolPath("DEFINITION_OF_DONE.md")).toBe(false);
  });
});

describe("isDocExtension", () => {
  it("accepts md and pdf case-insensitively", () => {
    expect(isDocExtension("file.MD")).toBe(true);
    expect(isDocExtension("file.PDF")).toBe(true);
    expect(isDocExtension("file.txt")).toBe(false);
  });
});

describe("pathDepth", () => {
  it("counts path segments", () => {
    expect(pathDepth("docs/sprint/plan.md")).toBe(3);
    expect(pathDepth("README.md")).toBe(1);
  });
});
