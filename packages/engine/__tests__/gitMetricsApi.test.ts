import { describe, it, expect, vi, afterEach } from "vitest";
import { extractGitMetricsApi } from "../src/collect/gitMetricsApi.js";
import type { ParsedGitHubUrl } from "../src/utils/githubUrl.js";

const parsed: ParsedGitHubUrl = {
  owner: "acme",
  repo: "demo",
  url: "https://github.com/acme/demo",
};

describe("extractGitMetricsApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns commitCalendar null when the API returns no commits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [],
      })) as typeof fetch,
    );

    const result = await extractGitMetricsApi(parsed, undefined);
    expect(result.commitCalendar).toBeNull();
    expect(result.contributors).toEqual([]);
  });

  it("returns a populated commitCalendar when commits include timestamps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            sha: "aaa",
            commit: {
              message: "one\n",
              author: { date: "2024-06-10T10:00:00Z", email: "a@x.com", name: "A" },
            },
          },
          {
            sha: "bbb",
            commit: {
              message: "two\n",
              author: { date: "2024-06-12T14:00:00Z", email: "b@x.com", name: "B" },
            },
          },
        ],
      })) as typeof fetch,
    );

    const result = await extractGitMetricsApi(parsed, undefined);
    expect(result.commitCalendar).not.toBeNull();
    const cal = result.commitCalendar!;
    expect(cal.grid.length).toBe(7);
    expect(cal.columnWeekStarts.length).toBe(52);
    expect(cal.grid[0]!.length).toBe(52);

    let total = 0;
    for (const row of cal.grid) {
      for (const c of row) total += c;
    }
    expect(total).toBe(2);
  });
});
