/**
 * Supabase server client for API routes.
 * Uses service role key — never expose to client. Keep SUPABASE_SERVICE_ROLE_KEY server-only.
 * Lazy init so build can succeed without env vars; throws when first used if vars are missing.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseProjectUrlNode } from "@/lib/supabase/projectEnv";

let _supabase: SupabaseClient | null = null;

/** True when both URL and service role key are set (persistence enabled). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseProjectUrlNode() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

/**
 * Use in-memory report storage instead of Supabase (only in development).
 * Production must set Supabase env vars for persistence.
 */
/** True when dev runs without Supabase — reports stored in process memory only. */
export function isDevReportMemoryFallback(): boolean {
  return process.env.NODE_ENV === "development" && !isSupabaseConfigured();
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = supabaseProjectUrlNode();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase env vars");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
