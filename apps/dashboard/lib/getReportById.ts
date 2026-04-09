/**
 * Server-only: fetches a report by resultId from Supabase (or dev memory fallback).
 * Used by the results page to avoid HTTP fetch issues.
 */

import { getSupabase, useDevReportMemoryFallback } from "@/lib/supabase/server";
import { devGetReport } from "@/lib/devReportStore";
import type { RepoReport } from "@/lib/reportTypes";

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

export async function getReportById(id: string): Promise<{
  data: RepoReport | null;
  error: string | null;
}> {
  const trimmedId = id.trim();

  try {
    if (useDevReportMemoryFallback()) {
      const mem = devGetReport(trimmedId);
      if (mem) return { data: mem, error: null };
      return { data: null, error: "Result not found" };
    }

    const supabase = getSupabase();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from("analyses")
        .select("report_json")
        .eq("result_id", trimmedId)
        .single();

      if (data && !error) {
        return { data: data.report_json as RepoReport, error: null };
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt));
      }
    }

    const { data: partial } = await supabase
      .from("analyses")
      .select("report_json")
      .like("result_id", `${trimmedId}%`)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (partial) {
      return { data: partial.report_json as RepoReport, error: null };
    }

    return { data: null, error: "Result not found" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: msg };
  }
}
