/**
 * GET /api/results/[id]/ai-usage
 * Returns persisted AI usage CSV for an analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isDevReportMemoryFallback,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";
import { devGetAiUsageCsv } from "@/lib/devAiUsageStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resultId = id.trim();

  if (isDevReportMemoryFallback()) {
    const cached = devGetAiUsageCsv(resultId);
    if (cached) return NextResponse.json({ resultId, csvText: cached });
    return NextResponse.json({ error: "AI usage not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured() || !isUserSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Storage is not configured." },
      { status: 503 },
    );
  }

  const userSb = await createUserSupabaseServerClient();
  const {
    data: { user },
  } = await userSb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await userSb
    .from("analyses")
    .select("ai_usage_csv")
    .eq("result_id", resultId)
    .maybeSingle();

  if (error || !data?.ai_usage_csv) {
    return NextResponse.json({ error: "AI usage not found" }, { status: 404 });
  }

  return NextResponse.json({ resultId, csvText: data.ai_usage_csv as string });
}
