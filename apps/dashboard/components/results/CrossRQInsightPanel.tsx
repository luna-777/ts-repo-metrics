"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFeatureVector } from "@/lib/featureVector";
import type { RepoReport } from "@/lib/reportTypes";

interface CrossRQInsightPanelProps {
  report: RepoReport;
}

const BURST_RATIO_THRESHOLD = 10;
const HIGH_COMPLEXITY_THRESHOLD = 10;
const LOW_VERIFICATION_THRESHOLD = 0.1;

export function CrossRQInsightPanel({ report }: CrossRQInsightPanelProps) {
  const insights = useMemo(() => {
    const vec = buildFeatureVector(report);
    const statements: string[] = [];

    const highComplexity = (vec.high_complexity_count as number) ?? 0;
    const testLocRatio = (vec.test_loc_ratio as number) ?? 0;
    const burstRatio = (vec.burst_ratio as number) ?? 0;

    if (highComplexity >= HIGH_COMPLEXITY_THRESHOLD && testLocRatio < LOW_VERIFICATION_THRESHOLD) {
      statements.push(
        "Structural complexity is noticeable while test coverage stays low—you may want to pair risky changes with tests or tighter review."
      );
    }

    if (typeof burstRatio === "number" && burstRatio >= BURST_RATIO_THRESHOLD) {
      statements.push(
        "Commit timing looks bursty (many commits in short windows). That can be normal near deadlines; confirm it fits how your team likes to integrate and review."
      );
    }

    const longFnCount = (vec.long_function_count as number) ?? 0;
    if (highComplexity >= HIGH_COMPLEXITY_THRESHOLD && longFnCount >= 5) {
      statements.push(
        "Several complex or long functions show up—you might target specific hotspots for refactoring instead of rewriting everything."
      );
    }

    const maintainability = (vec.maintainability_score as number) ?? 0;
    if (maintainability > 0 && maintainability < 40) {
      statements.push(
        "Maintainability looks strained at the repo level. Incremental tidy-ups plus tests on critical paths usually beat a Big Bang rewrite."
      );
    }

    return statements;
  }, [report]);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {insights.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
