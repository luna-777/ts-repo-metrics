import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  encryptGitHubAccessToken,
  isGitHubTokenEncryptionConfigured,
} from "@/lib/githubTokenCrypto";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}${nextPath}`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(
      `${origin}${nextPath}?auth_error=missing_supabase`,
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
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
          /* ignore */
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}${nextPath}?auth_error=exchange`);
  }

  const providerToken = data.session.provider_token;
  const userId = data.session.user.id;

  if (
    providerToken &&
    isSupabaseConfigured() &&
    isGitHubTokenEncryptionConfigured()
  ) {
    try {
      const encrypted = encryptGitHubAccessToken(providerToken);
      await getSupabase().from("user_github_tokens").upsert(
        {
          user_id: userId,
          encrypted_access_token: encrypted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch (err) {
      console.error("[auth/callback] Failed to persist GitHub token:", err);
    }
  } else if (providerToken && !isGitHubTokenEncryptionConfigured()) {
    console.warn(
      "[auth/callback] GITHUB_OAUTH_ENCRYPTION_KEY not set; GitHub token not stored.",
    );
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
