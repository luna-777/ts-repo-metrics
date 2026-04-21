/**
 * True when browser Supabase env is set (anon key + URL). Safe for client bundles.
 */

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
