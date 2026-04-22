"use client";

/**
 * Shared landing block: URL input, sample repo, and copy for analyze flows.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Github, ArrowRight } from "lucide-react";
import { isValidGitHubUrl } from "@/lib/githubUrl";
import { runAnalyzeFromUrl } from "@/lib/runAnalyze";

const EXAMPLE_GITHUB_REPO = "https://github.com/scottyUX/ts-repo-metrics";

export type AnalyzeRepositoryHeroProps = {
  /** When true, omit tall min-height (e.g. on /repos above the repo grid). */
  compact?: boolean;
};

export function AnalyzeRepositoryHero({ compact }: AnalyzeRepositoryHeroProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const valid = isValidGitHubUrl(url);

  const runAnalysisForUrl = useCallback(
    async (rawUrl: string) => {
      if (loading) return;
      if (!isValidGitHubUrl(rawUrl)) {
        setError("Enter a valid GitHub repository URL");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await runAnalyzeFromUrl(rawUrl);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success("Analysis complete");
        router.push(`/r/${encodeURIComponent(result.resultId)}`);
      } catch {
        setError("Analysis failed. Please try again.");
        toast.error("Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [loading, router],
  );

  const runAnalysis = useCallback(() => {
    if (!valid || loading) return;
    void runAnalysisForUrl(url);
  }, [url, valid, loading, runAnalysisForUrl]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runAnalysis();
  }

  return (
    <div
      className={
        compact
          ? "flex w-full max-w-[700px] flex-col items-center space-y-8"
          : "flex min-h-[60vh] w-full max-w-[700px] flex-col items-center justify-center space-y-10"
      }
    >
      <div className="flex justify-center">
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          Static analysis for TypeScript, Python, and more
        </span>
      </div>

      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-primary via-orange-400 to-amber-400 bg-clip-text text-transparent">
            Analyze your repository
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Enter a GitHub URL for complexity, maintainability, duplication, and git
          behavior metrics. TypeScript and Python are supported. Use{" "}
          <strong className="font-medium text-foreground">Sign in</strong> in the
          header for private repos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex h-[60px] w-full overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:ring-2 focus-within:ring-neutral-400 focus-within:ring-offset-2 focus-within:ring-offset-background dark:border-neutral-700 dark:bg-neutral-900/50 dark:focus-within:ring-neutral-600">
          <div className="flex items-center justify-center pl-4 text-neutral-400">
            <Github className="size-5" />
          </div>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-0 text-base outline-none placeholder:text-neutral-400 disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!valid || loading}
            className="flex h-full shrink-0 items-center justify-center gap-2 bg-neutral-900 px-6 font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Analyzing…" : "Go"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">or try an example</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setUrl(EXAMPLE_GITHUB_REPO);
            void runAnalysisForUrl(EXAMPLE_GITHUB_REPO);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <Github className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Try sample repo</span>
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Public repos: no account. Private repos: GitHub sign-in with repo access.
      </p>

      {url && !valid && (
        <p className="text-center text-sm text-destructive">
          Enter a valid GitHub repository URL
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              runAnalysis();
            }}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
