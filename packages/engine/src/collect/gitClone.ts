/**
 * Git clone module for GitHub public repos.
 *
 * Clones into .cache/ts-repo-metrics/<owner-repo> with full history.
 * Reuses cache unless --no-cache.
 */

import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { simpleGit } from "simple-git";
import type { ParsedGitHubUrl } from "../utils/githubUrl.js";

const CACHE_DIR = ".cache/ts-repo-metrics";

function cacheKey(parsed: ParsedGitHubUrl): string {
  return `${parsed.owner}-${parsed.repo}`;
}

function authenticatedCloneUrl(
  parsed: ParsedGitHubUrl,
  githubToken: string,
): string {
  const t = encodeURIComponent(githubToken);
  return `https://x-access-token:${t}@github.com/${parsed.owner}/${parsed.repo}.git`;
}

/**
 * Clone a GitHub repo or return cached path.
 *
 * @param parsed - Parsed GitHub URL.
 * @param useCache - If false, clone fresh (removes cache first).
 * @param baseDir - Base directory for cache (default: cwd).
 * @param githubToken - Optional PAT for private repositories (never logged).
 * @returns Absolute path to the cloned repo.
 */
export async function cloneOrUseCache(
  parsed: ParsedGitHubUrl,
  useCache: boolean,
  baseDir: string = process.cwd(),
  githubToken?: string,
): Promise<string> {
  const fullPath = path.resolve(baseDir, CACHE_DIR, cacheKey(parsed));

  // A previous run may have left a partial tree (e.g. interrupted clone: `.git` without HEAD).
  // Reusing that path skips clone and yields 0 source files — all metrics zero.
  if (existsSync(fullPath)) {
    let looksLikeGitRepo = false;
    try {
      looksLikeGitRepo = await simpleGit(fullPath).checkIsRepo();
    } catch {
      looksLikeGitRepo = false;
    }
    if (!looksLikeGitRepo) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }

  if (useCache && existsSync(fullPath)) {
    return fullPath;
  }

  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true });
  }

  const parentDir = path.dirname(fullPath);
  mkdirSync(parentDir, { recursive: true });

  const cloneRemote =
    githubToken?.trim() ? authenticatedCloneUrl(parsed, githubToken.trim()) : parsed.url;

  const git = simpleGit();
  await git.clone(cloneRemote, fullPath, ["--no-single-branch"]);

  return fullPath;
}
