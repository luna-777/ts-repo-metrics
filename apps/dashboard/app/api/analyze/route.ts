/**
 * POST /api/analyze
 * Triggers repo-metrics analysis for a public GitHub repo URL.
 * Returns { status, resultId } or full result.
 * @see Story 4.1
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  getSupabase,
  isSupabaseConfigured,
  isDevReportMemoryFallback,
} from "@/lib/supabase/server";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";
import { getDecryptedGitHubTokenForUser } from "@/lib/userGitHubToken";
import { devStoreReport } from "@/lib/devReportStore";
import { analyzeFromGitHubUrl } from "@repo-metrics/engine";

export const runtime = "nodejs";

/** Ensure report is JSON-serializable for PostgREST jsonb (strips non-JSON values). */
function reportAsJsonObject(report: unknown): object {
  return JSON.parse(JSON.stringify(report)) as object;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim();
  const full = trimmed.startsWith("http")
    ? trimmed
    : `https://github.com/${trimmed}`;
  const m = full.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]!.replace(/\.git$/, "") };
}

function isValidGitHubUrl(input: string): boolean {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) return true;
  return /^(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(
    trimmed
  );
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let githubToken: string | undefined;

    if (isUserSupabaseConfigured()) {
      try {
        const userSb = await createUserSupabaseServerClient();
        const {
          data: { user },
        } = await userSb.auth.getUser();
        if (user) {
          userId = user.id;
          if (isSupabaseConfigured()) {
            const tok = await getDecryptedGitHubTokenForUser(user.id);
            if (tok) githubToken = tok;
          }
        }
      } catch (err) {
        console.warn("[analyze] Could not read auth session:", err);
      }
    }

    const body = await request.json();
    const url = (body?.url ?? "").toString().trim();

    if (!url) {
      return NextResponse.json(
        { error: "Missing url. Provide { url: string }." },
        { status: 400 }
      );
    }

    if (!isValidGitHubUrl(url)) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const normalizedUrl =
      url.startsWith("http") ?
        url
      : url.includes("/") && !url.includes("github.com")
        ? `https://github.com/${url}`
        : `https://${url}`;

    // Always clone under the OS temp dir — using process.cwd() (e.g. apps/dashboard) reused a
    // stale .cache/ts-repo-metrics/* tree from an older repo layout (0 .tsx files) and broke profiles.
    const baseCache = path.join(os.tmpdir(), "repo-metrics-git-cache");
    const cacheDir =
      userId && githubToken
        ? path.join(baseCache, "u", userId)
        : baseCache;

    const report = await analyzeFromGitHubUrl(normalizedUrl, {
      useCache: true,
      cacheDir,
      githubToken,
    });

    const parsed = parseGitHubUrl(normalizedUrl);
    const commitSha = report.source?.commit ?? null;
    
    // Generate resultId: owner-repo-commitSha (or UUID if no commit)
    let resultId: string;
    if (parsed) {
      const suffix = commitSha 
        ? commitSha.slice(0, 12) 
        : randomUUID().replace(/-/g, "").slice(0, 12); // Remove dashes from UUID
      resultId = `${parsed.owner}-${parsed.repo}-${suffix}`;
    } else {
      resultId = randomUUID();
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[analyze] Generated resultId:", resultId, "commitSha:", commitSha);
    }

    if (isSupabaseConfigured()) {
      const row = {
        result_id: resultId,
        repo_url: normalizedUrl,
        commit_sha: commitSha,
        report_json: reportAsJsonObject(report),
        user_id: userId,
      };

      const { error } = await getSupabase()
        .from("analyses")
        .upsert(row, { onConflict: "result_id" });

      if (error) {
        console.error("Supabase upsert failed:", error);
        const body: Record<string, unknown> = {
          error: "Failed to save result.",
          status: "failed",
        };
        if (process.env.NODE_ENV === "development") {
          body.debug = {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          };
          if (
            error.code === "PGRST204" &&
            String(error.message).includes("user_id")
          ) {
            body.hint =
              "Remote DB is missing column analyses.user_id. Run supabase/migrations in order or paste supabase/run_in_dashboard_sql_editor.sql into the Supabase SQL Editor.";
          }
        }
        return NextResponse.json(body, { status: 500 });
      }
    } else if (isDevReportMemoryFallback()) {
      devStoreReport(resultId, report);
      console.warn(
        "[analyze] Supabase not configured; result kept in server memory (dev only)."
      );
    } else {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY on the server (see .env.example), then redeploy. On Railway, SUPABASE_URL avoids build-time inlining issues.",
          status: "failed",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "done",
      resultId,
      report,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[analyze]", err);
    }
    const message =
      err instanceof Error ? err.message : "Analysis failed.";
    const clientMessage =
      process.env.NODE_ENV === "production"
        ? "Analysis failed."
        : message;
    return NextResponse.json(
      { error: clientMessage, status: "failed" },
      { status: 500 }
    );
  }
}
