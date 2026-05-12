/**
 * Supabase URL + anon key for Node.js (API routes, Server Components, auth callback).
 *
 * Prefer SUPABASE_* (no NEXT_PUBLIC_ prefix) on Docker/Railway: Next inlines
 * NEXT_PUBLIC_* at `next build`, so runtime env cannot fix an image built with
 * empty public vars. Server-only vars are read when the process starts.
 */

export function supabaseProjectUrlNode(): string | undefined {
  const u =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return u || undefined;
}

export function supabaseAnonKeyNode(): string | undefined {
  const k =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return k || undefined;
}
