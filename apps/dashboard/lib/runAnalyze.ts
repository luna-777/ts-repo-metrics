/**
 * Client: POST /api/analyze for a GitHub repo URL and cache report in sessionStorage.
 */

import { normalizeGitHubUrl } from "@/lib/githubUrl";
import { writeReportToSessionStorage } from "@/lib/reportLocalCache";
import type { RepoReport } from "@/lib/reportTypes";

export type RunAnalyzeResult =
  | { ok: true; resultId: string }
  | { ok: false; error: string };

export async function runAnalyzeFromUrl(
  rawUrl: string,
): Promise<RunAnalyzeResult> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalizeGitHubUrl(rawUrl) }),
    });
    let data: {
      error?: string;
      resultId?: string;
      report?: RepoReport;
    } = {};
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return { ok: false, error: "Analysis failed" };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: (data.error ?? "Analysis failed") as string,
      };
    }
    const resultId = data.resultId;
    if (!resultId || typeof resultId !== "string") {
      return { ok: false, error: "Invalid response" };
    }
    if (data.report) {
      writeReportToSessionStorage(resultId, data.report);
    }
    return { ok: true, resultId };
  } catch {
    return { ok: false, error: "Analysis failed. Please try again." };
  }
}
