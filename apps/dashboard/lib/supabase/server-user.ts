/**
 * Supabase browser session via cookies (anon key + user JWT).
 * Use for RLS-protected reads/writes where the current user must be enforced.
 * Do not use for trusted server-only upserts — use getSupabase() (service role) instead.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  supabaseAnonKeyNode,
  supabaseProjectUrlNode,
} from "@/lib/supabase/projectEnv";

export function isUserSupabaseConfigured(): boolean {
  return Boolean(supabaseProjectUrlNode() && supabaseAnonKeyNode());
}

export async function createUserSupabaseServerClient() {
  const url = supabaseProjectUrlNode();
  const anonKey = supabaseAnonKeyNode();
  if (!url || !anonKey) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without mutable cookies — ignore.
        }
      },
    },
  });
}
