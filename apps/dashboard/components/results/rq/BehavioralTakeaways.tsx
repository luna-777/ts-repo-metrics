"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBehavioralLearningTakeaways } from "@/lib/behavioralLearningSummary";
import type { RepoReport } from "@/lib/reportTypes";

export function BehavioralTakeaways({ report }: { report: RepoReport }) {
  const bullets = buildBehavioralLearningTakeaways(report);
  if (bullets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">At a glance</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {bullets.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-foreground shrink-0">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
