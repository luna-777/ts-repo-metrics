/**
 * POST /api/doc-review
 * Runs documentation review for a persisted analysis result.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getSupabase,
  isDevReportMemoryFallback,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";
import { getDecryptedGitHubTokenForUser } from "@/lib/userGitHubToken";
import { ANALYZE_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/analyzeConstants";
import { parseGitHubUrl, normalizeGitHubUrl } from "@/lib/github/parseGitHubUrl";
import { runDocReview } from "@/lib/docReview/runDocReview";
import type { DocReviewResult } from "@/lib/docReview/types";
import type { RepoReport } from "@/lib/reportTypes";
import { devGetDocReview, devStoreDocReview } from "@/lib/devDocReviewStore";
import { devGetReport } from "@/lib/devReportStore";

const GLOBAL_TIMEOUT_MS = 90_000;

const DOC_REVIEW_MIGRATION_HINT =
  "Add doc_review_json column: run supabase/migrations/20260522010000_analyses_doc_review.sql in the Supabase SQL Editor.";

function docReviewUpdateLooksLikeStaleSchema(error: {
  message?: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}): boolean {
  const blob = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  return error.code === "PGRST204" || /\bdoc_review_json\b/i.test(blob);
}

function asJsonObject(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.DOC_REVIEW_ENABLED !== "true") {
      return NextResponse.json(
        {
          error:
            "Documentation review is disabled. Set DOC_REVIEW_ENABLED=true and OPENAI_API_KEY to enable.",
          code: "doc_review_disabled",
        },
        { status: 503 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured.", code: "openai_missing" },
        { status: 503 },
      );
    }

    if (!isUserSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Sign-in is not configured for this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
          code: "auth_unavailable",
        },
        { status: 503 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const resultId =
      typeof body.resultId === "string" ? body.resultId.trim() : "";
    if (!resultId) {
      return NextResponse.json(
        { error: "Missing resultId. Provide { resultId: string }." },
        { status: 400 },
      );
    }

    const userSb = await createUserSupabaseServerClient();
    const {
      data: { user },
    } = await userSb.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: ANALYZE_SIGN_IN_REQUIRED_MESSAGE,
          code: "sign_in_required",
        },
        { status: 401 },
      );
    }

    const token = isSupabaseConfigured()
      ? await getDecryptedGitHubTokenForUser(user.id)
      : null;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "GitHub token not available. Sign out and sign in again with GitHub.",
          code: "github_token_missing",
        },
        { status: 403 },
      );
    }

    let repoUrl =
      typeof body.url === "string" && body.url.trim()
        ? normalizeGitHubUrl(body.url.trim())
        : null;

    let engineReport: RepoReport | null =
      body.report && typeof body.report === "object"
        ? (body.report as RepoReport)
        : null;

    if (isSupabaseConfigured()) {
      const { data: row, error: selectError } = await userSb
        .from("analyses")
        .select("repo_url, report_json, user_id")
        .eq("result_id", resultId)
        .maybeSingle();

      if (selectError || !row) {
        return NextResponse.json(
          { error: "Analysis not found for this result.", code: "not_found" },
          { status: 404 },
        );
      }

      if (row.user_id && row.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (!repoUrl && typeof row.repo_url === "string") {
        repoUrl = row.repo_url;
      }
      if (!engineReport && row.report_json) {
        engineReport = row.report_json as RepoReport;
      }
    } else if (isDevReportMemoryFallback()) {
      if (!engineReport) {
        engineReport = devGetReport(resultId);
      }
    }

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Could not resolve repository URL for this result." },
        { status: 400 },
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL on analysis record." },
        { status: 400 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GLOBAL_TIMEOUT_MS);

    let result: DocReviewResult;
    try {
      result = await runDocReview({
        owner: parsed.owner,
        repo: parsed.repo,
        githubToken: token,
        resultId,
        openai,
        engineReport,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"));
      if (isTimeout) {
        const partial = devGetDocReview(resultId);
        if (partial) {
          return NextResponse.json({
            ...partial,
            error: "pipeline_timeout",
            warnings: [...(partial.warnings ?? []), "pipeline_timeout"],
          });
        }
        return NextResponse.json(
          { error: "Documentation review timed out.", code: "pipeline_timeout" },
          { status: 504 },
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (isSupabaseConfigured()) {
      const { error: updateError } = await getSupabase()
        .from("analyses")
        .update({ doc_review_json: asJsonObject(result) })
        .eq("result_id", resultId);

      if (updateError) {
        console.error("[doc-review] Supabase update failed:", {
          code: updateError.code,
          message: updateError.message,
        });
        if (docReviewUpdateLooksLikeStaleSchema(updateError)) {
          return NextResponse.json(
            {
              error: "Could not save doc review: database is missing doc_review_json.",
              code: "analyses_schema_mismatch",
              hint: DOC_REVIEW_MIGRATION_HINT,
            },
            { status: 503 },
          );
        }
        return NextResponse.json(
          { error: "Failed to save documentation review." },
          { status: 500 },
        );
      }
    } else if (isDevReportMemoryFallback()) {
      devStoreDocReview(resultId, result);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[doc-review]", err instanceof Error ? err.message : err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Documentation review failed."
        : err instanceof Error
          ? err.message
          : "Documentation review failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
