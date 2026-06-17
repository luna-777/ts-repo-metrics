/**
 * Download a GitHub repo as a zipball (no git binary required).
 * Used when git is unavailable (e.g. Vercel serverless).
 */

import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import type { ParsedGitHubUrl } from "../utils/githubUrl.js";
import type { SourceInfo } from "../types/report.js";

const CACHE_DIR = ".cache/ts-repo-metrics";

function cacheKey(parsed: ParsedGitHubUrl, commitSha?: string): string {
  const base = `${parsed.owner}-${parsed.repo}`;
  return commitSha ? `${base}-${commitSha.slice(0, 12)}` : base;
}

function githubApiHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token?.trim()) {
    h.Authorization = `Bearer ${token.trim()}`;
  }
  return h;
}

/**
 * Fetch default branch and latest commit SHA from GitHub API.
 * @param token - Optional PAT for private repositories.
 */
export async function getSourceFromGitHubApi(
  parsed: ParsedGitHubUrl,
  token?: string,
): Promise<SourceInfo> {
  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
  const res = await fetch(apiUrl, {
    headers: githubApiHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} for ${parsed.url}`);
  }
  const repo = (await res.json()) as { default_branch?: string };
  const branch = repo.default_branch ?? "main";

  const commitsUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${branch}`;
  const commitsRes = await fetch(commitsUrl, {
    headers: githubApiHeaders(token),
  });
  if (!commitsRes.ok) {
    return {
      type: "git",
      url: parsed.url,
      commit: "",
      branch,
    };
  }
  const commitData = (await commitsRes.json()) as { sha?: string };
  const commit = commitData.sha ?? "";

  return {
    type: "git",
    url: parsed.url,
    commit,
    branch,
  };
}

/**
 * Download repo as zipball and extract to cache dir. Returns path to repo root.
 * Zipball has one top-level dir (owner-repo-sha); we flatten so repo root is fullPath.
 * When commitSha is provided, the cache is keyed by commit and the zipball of
 * that exact ref is downloaded, so a new push can never reuse a stale snapshot.
 * Without commitSha the cache is never reused (a snapshot of unknown ref could
 * be stale) and the default branch is re-downloaded.
 * @param githubToken - Optional PAT for private repository zipball download.
 * @param commitSha - Latest commit SHA of the default branch (from getSourceFromGitHubApi).
 */
export async function downloadZipball(
  parsed: ParsedGitHubUrl,
  baseDir: string,
  useCache: boolean = true,
  githubToken?: string,
  commitSha?: string,
): Promise<string> {
  const sha = commitSha?.trim() || undefined;
  const fullPath = path.resolve(baseDir, CACHE_DIR, cacheKey(parsed, sha));

  const parentDir = path.dirname(fullPath);
  mkdirSync(parentDir, { recursive: true });

  if (useCache && sha && existsSync(fullPath)) {
    try {
      const entries = readdirSync(fullPath);
      if (entries.length > 0) return fullPath;
    } catch {
      // ignore, re-download
    }
  }

  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true });
  }

  const zipUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/zipball${
    sha ? `/${sha}` : ""
  }`;
  const res = await fetch(zipUrl, {
    redirect: "follow",
    headers: githubApiHeaders(githubToken),
  });
  if (!res.ok) {
    throw new Error(`Failed to download zipball: ${res.status} for ${parsed.url}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const extractDir = fullPath + ".extract";
  zip.extractAllTo(extractDir, true);

  const entries = readdirSync(extractDir);
  if (entries.length !== 1 || !entries[0]) {
    rmSync(extractDir, { recursive: true });
    throw new Error("Zipball had unexpected structure");
  }
  const innerDir = path.join(extractDir, entries[0]);
  mkdirSync(fullPath, { recursive: true });
  for (const name of readdirSync(innerDir)) {
    renameSync(path.join(innerDir, name), path.join(fullPath, name));
  }
  rmSync(extractDir, { recursive: true });

  return fullPath;
}
