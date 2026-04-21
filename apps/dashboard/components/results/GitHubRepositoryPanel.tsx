"use client";

import Link from "next/link";
import { Star, GitFork, Eye, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GitHubRepositoryMeta } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";

const EMPTY_GITHUB_META: GitHubRepositoryMeta = {
  description: null,
  topics: [],
  stargazersCount: 0,
  forksCount: 0,
  subscribersCount: 0,
  languages: [],
  contributors: [],
};

interface GitHubRepositoryPanelProps {
  /** When null, cards still render with empty data and an explanation (metadata API did not return). */
  meta: GitHubRepositoryMeta | null;
  repoUrl?: string;
}

export function GitHubRepositoryPanel({ meta, repoUrl }: GitHubRepositoryPanelProps) {
  const metaUnavailable = meta === null;
  const m = meta ?? EMPTY_GITHUB_META;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {metaUnavailable ? (
        <div className="lg:col-span-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">GitHub metadata not loaded</p>
          <p className="mt-1">
            Stars, languages, and contributors come from the GitHub API. If this block is empty,
            the API may have rate-limited the request, the repo may be private without a token, or
            GitHub returned an error. Re-run the analysis or configure a GitHub token (signed-in users
            use the OAuth token; guests can set <code className="text-xs">GITHUB_TOKEN</code> on the
            server).
          </p>
        </div>
      ) : null}
      <Card className="lg:col-span-1 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">About</CardTitle>
          {repoUrl ? (
            <Link
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sky-600 hover:underline dark:text-sky-400"
            >
              {repoUrl.replace(/^https:\/\//, "")}
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            {metaUnavailable
              ? "See the notice above. Repository description and topics will appear when GitHub metadata is available."
              : m.description?.trim() || "No description provided."}
          </p>
          {!metaUnavailable && m.topics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {m.topics.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal text-xs">
                  <Tag className="mr-1 size-3 opacity-70" aria-hidden />
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4 pt-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5" title="Stargazers">
              <Star className="size-4 shrink-0" aria-hidden />
              <span className="tabular-nums text-foreground font-medium">
                {m.stargazersCount}
              </span>
              <span>stars</span>
            </span>
            <span className="inline-flex items-center gap-1.5" title="Forks">
              <GitFork className="size-4 shrink-0" aria-hidden />
              <span className="tabular-nums text-foreground font-medium">
                {m.forksCount}
              </span>
              <span>forks</span>
            </span>
            <span className="inline-flex items-center gap-1.5" title="Watchers (subscribers)">
              <Eye className="size-4 shrink-0" aria-hidden />
              <span className="tabular-nums text-foreground font-medium">
                {m.subscribersCount}
              </span>
              <span>watching</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Languages</CardTitle>
          <p className="text-muted-foreground text-xs font-normal">
            Byte share from GitHub (same basis as the language bar on the repo page).
          </p>
        </CardHeader>
        <CardContent>
          {m.languages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No language data.</p>
          ) : (
            <ul className="space-y-2">
              {m.languages.map((row) => (
                <li
                  key={row.language}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium text-foreground">{row.language}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.percentage.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contributors</CardTitle>
          <p className="text-muted-foreground text-xs font-normal">
            From GitHub API (commit counts in this repository).
            {m.contributors.length > 5 ? (
              <span className="mt-1 block text-foreground/80">
                {m.contributors.length} total — scroll to see more.
              </span>
            ) : null}
          </p>
        </CardHeader>
        <CardContent className="min-h-0">
          {m.contributors.length === 0 ? (
            <p className="text-muted-foreground text-sm">No contributor data.</p>
          ) : (
            <ul
              className={cn(
                "space-y-3 overflow-x-hidden pr-1",
                m.contributors.length > 5 &&
                  "max-h-[22rem] overflow-y-auto overscroll-contain [scrollbar-width:thin]",
              )}
              aria-label="Repository contributors"
            >
              {m.contributors.map((c) => (
                <li key={c.login}>
                  <Link
                    href={c.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-md p-1 -m-1 hover:bg-muted/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-full border border-border bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground leading-tight">{c.login}</p>
                      {c.name ? (
                        <p className="text-muted-foreground text-xs truncate">{c.name}</p>
                      ) : null}
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {c.contributions} contribution{c.contributions === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
