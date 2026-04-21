/**
 * Site header: logo, nav links, GitHub project link, auth.
 */

import Link from "next/link";
import { Github } from "lucide-react";
import { HeaderGitHubAuth } from "@/components/auth/HeaderGitHubAuth";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";

export async function Header() {
  let brandHref = "/";
  if (isUserSupabaseConfigured()) {
    try {
      const sb = await createUserSupabaseServerClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) brandHref = "/repos";
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link
          href={brandHref}
          className="flex shrink-0 items-center pl-4 text-xl font-bold tracking-tight text-foreground sm:pl-6"
        >
          Repo Metrics
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-4 text-sm sm:gap-6">
          <Link
            href="/"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            Analyze
          </Link>
          <Link
            href="/repos"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            My repos
          </Link>
          <Link
            href="/docs"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/research"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            Research
          </Link>
          <Link
            href="https://github.com/scottyUX/ts-repo-metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <HeaderGitHubAuth />
        </nav>
      </div>
    </header>
  );
}
