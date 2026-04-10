"use client";

/**
 * Landing page: paste GitHub repo URL to analyze.
 * Auto-deployment test: Git integration verified.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Github, ArrowRight } from "lucide-react";
import { isValidGitHubUrl, normalizeGitHubUrl } from "@/lib/githubUrl";
import { writeReportToSessionStorage } from "@/lib/reportLocalCache";

/** Example analysis target: the ts-repo-metrics analyzer repo (same stack as this dashboard). */
const EXAMPLE_GITHUB_REPO = "https://github.com/scottyUX/ts-repo-metrics";

export default function HomePage() {
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
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizeGitHubUrl(rawUrl) }),
        });
        const data = await res.json();
        if (!res.ok) {
          const err = data.error ?? "Analysis failed";
          setError(err);
          toast.error(err);
          return;
        }
        toast.success("Analysis complete");
        if (data.resultId && data.report) {
          writeReportToSessionStorage(data.resultId, data.report);
        }
        router.push(`/r/${encodeURIComponent(data.resultId)}`);
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
    <div className="w-full max-w-[700px] flex flex-col items-center justify-center space-y-10 min-h-[60vh]">
      {/* Pill */}
      <div className="flex justify-center">
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          Static analysis for TypeScript repositories
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Analyze public TypeScript repositories
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Enter a GitHub URL to run cyclomatic complexity, function metrics,
          maintainability, and git behavior analysis.
        </p>
      </div>

      {/* Input + Go button (inline, github.gg style) */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex w-full h-[60px] rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-neutral-400 focus-within:ring-offset-2 focus-within:ring-offset-background dark:focus-within:ring-neutral-600">
          <div className="flex items-center justify-center pl-4 text-neutral-400">
            <Github className="size-5" />
          </div>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-0 text-base placeholder:text-neutral-400 outline-none disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!valid || loading}
            className="flex items-center justify-center gap-2 shrink-0 h-full px-6 bg-neutral-900 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Analyzing…" : "Go"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      {/* Example repo — same stack as the analyzer; one click runs analyze */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">or try an example</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setUrl(EXAMPLE_GITHUB_REPO);
            void runAnalysisForUrl(EXAMPLE_GITHUB_REPO);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <Github className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Analyze ts-repo-metrics</span>
        </button>
        <a
          href={EXAMPLE_GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          View on GitHub
        </a>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Accepts public GitHub TypeScript repositories
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
