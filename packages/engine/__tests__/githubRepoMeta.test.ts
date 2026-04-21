/**
 * Tests for GitHub repository metadata fetcher (mocked fetch).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGitHubRepositoryMeta } from "../src/collect/githubRepoMeta.js";
import type { ParsedGitHubUrl } from "../src/utils/githubUrl.js";

const parsed: ParsedGitHubUrl = {
  owner: "Remy349",
  repo: "todo-app-flask-reactjs",
  url: "https://github.com/Remy349/todo-app-flask-reactjs",
};

describe("fetchGitHubRepositoryMeta", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns null when repo request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    expect(await fetchGitHubRepositoryMeta(parsed)).toBeNull();
  });

  it("assembles meta from parallel GitHub API responses", async () => {
    const repoJson = {
      description: "TODO App",
      stargazers_count: 26,
      forks_count: 75,
      subscribers_count: 1,
    };
    const topicsJson = { names: ["python", "flask", "reactjs"] };
    const langsJson = { TypeScript: 6460, Python: 2950, JavaScript: 270 };

    const contribJson = [
      {
        login: "Remy349",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        html_url: "https://github.com/Remy349",
        contributions: 173,
      },
    ];

    const userJson = { name: "Santiago Moraga Caldera" };

    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("/repos/Remy349/todo-app-flask-reactjs/contributors")) {
        return {
          ok: true,
          json: async () => contribJson,
        };
      }
      if (u.includes("/users/Remy349")) {
        return {
          ok: true,
          json: async () => userJson,
        };
      }
      if (u.endsWith("/topics")) {
        return {
          ok: true,
          json: async () => topicsJson,
        };
      }
      if (u.endsWith("/languages")) {
        return {
          ok: true,
          json: async () => langsJson,
        };
      }
      if (u.includes("/repos/Remy349/todo-app-flask-reactjs")) {
        return {
          ok: true,
          json: async () => repoJson,
        };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const meta = await fetchGitHubRepositoryMeta(parsed);
    expect(meta).not.toBeNull();
    expect(meta!.description).toBe("TODO App");
    expect(meta!.stargazersCount).toBe(26);
    expect(meta!.forksCount).toBe(75);
    expect(meta!.subscribersCount).toBe(1);
    expect(meta!.topics).toEqual(["python", "flask", "reactjs"]);
    expect(meta!.languages.length).toBe(3);
    expect(meta!.languages[0]!.language).toBe("TypeScript");
    expect(meta!.contributors).toHaveLength(1);
    expect(meta!.contributors[0]!.login).toBe("Remy349");
    expect(meta!.contributors[0]!.name).toBe("Santiago Moraga Caldera");
    expect(meta!.contributors[0]!.contributions).toBe(173);
  });
});
