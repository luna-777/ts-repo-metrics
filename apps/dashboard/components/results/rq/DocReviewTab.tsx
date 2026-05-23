"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DocReviewResult, DocumentReview } from "@/lib/docReview/types";
import type { RepoReport } from "@/lib/reportTypes";

interface DocReviewTabProps {
  resultId: string;
  report: RepoReport;
}

function ChecklistSummary({ review }: { review: DocumentReview }) {
  if (!review.structured?.checklist) return null;
  const entries = Object.entries(review.structured.checklist);
  const passed = entries.filter(([, v]) => v).length;
  return (
    <p className="text-sm text-muted-foreground">
      Checklist: {passed}/{entries.length} criteria met
    </p>
  );
}

export function DocReviewTab({ resultId, report }: DocReviewTabProps) {
  const [docReview, setDocReview] = useState<DocReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courseId = report._submission?.course_id?.trim();

  const fetchExisting = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/results/${encodeURIComponent(resultId)}/doc-review`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setDocReview(null);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to load (${res.status})`);
      }
      setDocReview((await res.json()) as DocReviewResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load doc review");
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    void fetchExisting();
  }, [fetchExisting]);

  const runReview = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/doc-review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          url: report.source?.url,
          report,
        }),
      });
      const data = (await res.json()) as DocReviewResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Review failed (${res.status})`);
      }
      setDocReview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documentation review failed");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading documentation review…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {courseId ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
          <span className="font-medium text-blue-900 dark:text-blue-100">
            Research submission
          </span>
          <span className="ml-4 text-blue-700 dark:text-blue-300">
            Documentation review supports course research and is not used to grade individual
            students.
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!docReview ? (
        <Card>
          <CardHeader>
            <CardTitle>Review project documentation</CardTitle>
            <CardDescription>
              Classify and review planning documents (.md / .pdf) in this repository against
              course rubrics. Typical run ~1 minute; requires sign-in and OpenAI configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void runReview()} disabled={running}>
              {running ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Reviewing…
                </>
              ) : (
                "Review documentation"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {docReview ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {docReview.folder_found
                  ? "Documentation folder found"
                  : "No dedicated docs folder — searched repo-wide"}
              </p>
              {docReview.timings ? (
                <p className="text-xs text-muted-foreground">
                  Completed in {(docReview.timings.totalMs / 1000).toFixed(1)}s
                </p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={() => void runReview()} disabled={running}>
              {running ? "Re-running…" : "Re-run review"}
            </Button>
          </div>

          {docReview.warnings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pipeline notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {docReview.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {docReview.consistency.warnings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Consistency checks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {docReview.consistency.warnings.map((w) => (
                    <li key={`${w.code}-${w.message}`} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{w.code}:</span> {w.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-4">
            {docReview.classifications
              .filter((c) => c.docType !== "unknown")
              .map((c) => {
                const review = docReview.reviews[c.path];
                return (
                  <Card key={c.path}>
                    <CardHeader>
                      <CardTitle className="text-base font-medium">
                        {c.docType.replace(/_/g, " ")}
                        {c.sprintNumber ? ` · Sprint ${c.sprintNumber}` : ""}
                        {c.duplicate ? (
                          <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                            duplicate
                          </span>
                        ) : null}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">{c.path}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {review?.error ? (
                        <p className="text-destructive">Review error: {review.error}</p>
                      ) : null}
                      {review ? <ChecklistSummary review={review} /> : null}
                      {review?.structured?.coach ? (
                        <p className="leading-relaxed text-muted-foreground">
                          {review.structured.coach}
                        </p>
                      ) : null}
                      {review?.holistic ? (
                        <div className="space-y-2 text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">Strengths: </span>
                            {review.holistic.strengths}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">Suggestions: </span>
                            {review.holistic.improvements}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </>
      ) : null}
    </div>
  );
}
