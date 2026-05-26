/**
 * POST /api/ai-usage
 * Persists a raw AI usage CSV upload for an existing analysis result.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getSupabase,
  isDevReportMemoryFallback,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";
import { ANALYZE_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/analyzeConstants";
import { devStoreAiUsageCsv } from "@/lib/devAiUsageStore";

const AI_USAGE_MIGRATION_HINT =
  "Add ai_usage_csv column: run supabase/migrations/20260526120000_analyses_ai_usage_csv.sql in the Supabase SQL Editor.";

function aiUsageUpdateLooksLikeStaleSchema(error: {
  message?: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}): boolean {
  const blob = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  return error.code === "PGRST204" || /\bai_usage_csv\b/i.test(blob);
}

export async function POST(request: NextRequest) {
  try {
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
    const csvText =
      typeof body.csvText === "string" ? body.csvText : "";

    if (!resultId) {
      return NextResponse.json(
        { error: "Missing resultId. Provide { resultId: string, csvText: string }." },
        { status: 400 },
      );
    }

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "Missing csvText. Upload a non-empty CSV file." },
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

    if (isSupabaseConfigured()) {
      const { data: row, error: selectError } = await userSb
        .from("analyses")
        .select("result_id, user_id")
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

      const { error: updateError } = await getSupabase()
        .from("analyses")
        .update({ ai_usage_csv: csvText })
        .eq("result_id", resultId);

      if (updateError) {
        if (aiUsageUpdateLooksLikeStaleSchema(updateError)) {
          return NextResponse.json(
            {
              error: "Could not save AI usage CSV: database is missing ai_usage_csv.",
              code: "analyses_schema_mismatch",
              hint: AI_USAGE_MIGRATION_HINT,
            },
            { status: 503 },
          );
        }
        return NextResponse.json(
          { error: "Failed to save AI usage CSV." },
          { status: 500 },
        );
      }
    } else if (isDevReportMemoryFallback()) {
      devStoreAiUsageCsv(resultId, csvText);
    } else {
      return NextResponse.json(
        { error: "Storage is not configured." },
        { status: 503 },
      );
    }

    return NextResponse.json({ resultId, csvText });
  } catch (err) {
    console.error("[ai-usage]", err instanceof Error ? err.message : err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to save AI usage CSV."
        : err instanceof Error
          ? err.message
          : "Failed to save AI usage CSV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
