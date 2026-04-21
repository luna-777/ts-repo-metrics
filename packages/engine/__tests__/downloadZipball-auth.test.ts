/**
 * GitHub API helper sends Bearer token when provided (mocked fetch).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSourceFromGitHubApi } from "../src/collect/downloadZipball.js";
import type { ParsedGitHubUrl } from "../src/utils/githubUrl.js";

const parsed: ParsedGitHubUrl = {
  owner: "o",
  repo: "r",
  url: "https://github.com/o/r",
};

describe("getSourceFromGitHubApi", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends Authorization Bearer when token is provided", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ default_branch: "main" }),
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: "abc123" }),
    } as Response);
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    await getSourceFromGitHubApi(parsed, "ghp_test_token");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const first = mockFetch.mock.calls[0][1] as { headers: Record<string, string> };
    expect(first.headers.Authorization).toBe("Bearer ghp_test_token");
    const second = mockFetch.mock.calls[1][1] as { headers: Record<string, string> };
    expect(second.headers.Authorization).toBe("Bearer ghp_test_token");
  });
});
