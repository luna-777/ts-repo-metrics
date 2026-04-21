"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, LogOut } from "lucide-react";
import { createUserSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/browserConfigured";

/** Sign in / account / sign out for the top navigation. */
export function HeaderGitHubAuth() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isBrowserSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const supabase = createUserSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? data.user?.user_metadata?.user_name ?? null);
    } catch {
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) return;
    const supabase = createUserSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  if (!isBrowserSupabaseConfigured()) {
    return null;
  }

  if (loading) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        …
      </span>
    );
  }

  if (email) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline"
          title={email}
        >
          {email}
        </span>
        <button
          type="button"
          onClick={async () => {
            const supabase = createUserSupabaseBrowserClient();
            await supabase.auth.signOut();
            setEmail(null);
            router.push("/");
            router.refresh();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <LogOut className="size-3.5 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createUserSupabaseBrowserClient();
        const origin = window.location.origin;
        await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${origin}/auth/callback?next=/repos`,
            scopes: "read:user user:email repo",
          },
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Github className="size-3.5 shrink-0" aria-hidden />
      Sign in
    </button>
  );
}
