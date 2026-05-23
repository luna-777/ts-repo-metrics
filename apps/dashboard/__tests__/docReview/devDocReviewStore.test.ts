import { describe, expect, it } from "vitest";
import {
  devGetDocReview,
  devStoreDocReview,
} from "../../lib/devDocReviewStore";
import { DOC_REVIEW_VERSION } from "../../lib/docReview/types";

describe("devDocReviewStore", () => {
  it("stores and retrieves by resultId", () => {
    const id = "test-owner-repo-abc";
    const payload = {
      docReviewVersion: DOC_REVIEW_VERSION,
      generatedAt: new Date().toISOString(),
      resultId: id,
      folder_found: true,
      discovery: { docsPool: ["docs/a.md"], repoWide: [] },
      classifications: [],
      reviews: {},
      consistency: { warnings: [] },
      warnings: [],
    };
    devStoreDocReview(id, payload);
    expect(devGetDocReview(id)).toEqual(payload);
  });

  it("returns null for unknown ids", () => {
    expect(devGetDocReview("does-not-exist-xyz")).toBeNull();
  });
});
