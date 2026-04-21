/**
 * GitHub REST API: repository About, topics, stars/forks/subscribers,
 * language breakdown, and contributors (with profile names).
 *
 * Used when analyzing a GitHub URL; failures return null so analysis still succeeds.
 */

import type { ParsedGitHubUrl } from "../utils/githubUrl.js";
import type {
  GitHubRepositoryMeta,
  GitHubLanguageShare,
  GitHubRepoContributor,
} from "../types/report.js";

const API_VERSION = "2022-11-28";
const ACCEPT = "application/vnd.github+json";

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: ACCEPT,
    "X-GitHub-Api-Version": API_VERSION,
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function ghJson<T>(url: string, token?: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface RepoApiResponse {
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  subscribers_count: number;
}

interface TopicsApiResponse {
  names: string[];
}

interface LanguagesApiResponse {
  [language: string]: number;
}

interface ContributorApiRow {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface UserApiResponse {
  name: string | null;
}

function languagesToShares(raw: LanguagesApiResponse): GitHubLanguageShare[] {
  const entries = Object.entries(raw) as [string, number][];
  const total = entries.reduce((s, [, b]) => s + b, 0);
  if (total <= 0) return [];
  return entries
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

async function fetchAllContributors(
  owner: string,
  repo: string,
  token?: string,
): Promise<ContributorApiRow[]> {
  const out: ContributorApiRow[] = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 5;

  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) break;
    const batch = (await res.json()) as ContributorApiRow[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return out;
}

async function enrichContributorNames(
  rows: ContributorApiRow[],
  token?: string,
): Promise<GitHubRepoContributor[]> {
  const maxProfiles = 40;
  const toFetch = rows.slice(0, maxProfiles);
  const nameByLogin = new Map<string, string>();
  await Promise.all(
    toFetch.map(async (r) => {
      const u = await ghJson<UserApiResponse>(
        `https://api.github.com/users/${encodeURIComponent(r.login)}`,
        token,
      );
      const n = u?.name?.trim();
      if (n) nameByLogin.set(r.login, n);
    }),
  );

  return rows.map((r) => ({
    login: r.login,
    avatarUrl: r.avatar_url,
    htmlUrl: r.html_url,
    contributions: r.contributions,
    ...(nameByLogin.has(r.login) ? { name: nameByLogin.get(r.login)! } : {}),
  }));
}

/**
 * Fetch GitHub sidebar-style metadata for a public (or token-visible) repo.
 */
export async function fetchGitHubRepositoryMeta(
  parsed: ParsedGitHubUrl,
  token?: string,
): Promise<GitHubRepositoryMeta | null> {
  const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;

  const repo = await ghJson<RepoApiResponse>(base, token);
  if (!repo) return null;

  const [topicsRes, langsRaw, contribRows] = await Promise.all([
    ghJson<TopicsApiResponse>(`${base}/topics`, token),
    ghJson<LanguagesApiResponse>(`${base}/languages`, token),
    fetchAllContributors(parsed.owner, parsed.repo, token),
  ]);

  const topics = topicsRes?.names ?? [];
  const languages = langsRaw ? languagesToShares(langsRaw) : [];
  const contributors = await enrichContributorNames(contribRows, token);

  return {
    description: repo.description,
    topics,
    stargazersCount: repo.stargazers_count ?? 0,
    forksCount: repo.forks_count ?? 0,
    subscribersCount: repo.subscribers_count ?? 0,
    languages,
    contributors,
  };
}
