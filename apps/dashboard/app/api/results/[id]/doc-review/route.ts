/**
 * GET /api/results/[id]/doc-review
 * Returns persisted documentation review JSON for an analysis.
 */

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
import { devGetDocReview } from "@/lib/devDocReviewStore";
import type { DocReviewResult } from "@/lib/docReview/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resultId = id.trim();

  if (isDevReportMemoryFallback()) {
    const cached = devGetDocReview(resultId);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: "Doc review not found" }, { status: 404 });
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
    .select("doc_review_json")
    .eq("result_id", resultId)
    .maybeSingle();

  if (error || !data?.doc_review_json) {
    return NextResponse.json({ error: "Doc review not found" }, { status: 404 });
  }

  return NextResponse.json(data.doc_review_json as DocReviewResult);
}
