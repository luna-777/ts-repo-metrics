"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Phase2Summary } from "@/lib/phase2Summary";
import { cn } from "@/lib/utils";

interface Phase2WhatMetricsMeasureProps {
  summary: Phase2Summary;
  showReact: boolean;
  className?: string;
}

export function Phase2WhatMetricsMeasure({
  summary,
  showReact,
  className,
}: Phase2WhatMetricsMeasureProps) {
  const reactPct = (summary.reactShare * 100).toFixed(1);

  return (
    <section
      aria-labelledby="phase2-what-metrics-heading"
      className={cn("space-y-3", className)}
    >
      <h2 id="phase2-what-metrics-heading" className="text-lg font-semibold">
        What These Metrics Measure
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[10rem]">Metric</TableHead>
              <TableHead className="min-w-[20rem]">What it measures</TableHead>
              <TableHead className="text-right whitespace-nowrap">Mean</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="align-top font-medium">Halstead Volume</TableCell>
              <TableCell className="align-top text-muted-foreground text-sm leading-relaxed">
                The &ldquo;wordiness&rdquo; of your code—how many mental operations it takes to understand a function.
                Lower is easier to read.
              </TableCell>
              <TableCell className="align-top text-right tabular-nums font-medium">
                {summary.halsteadVolMean.toFixed(1)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-medium">Cognitive Complexity</TableCell>
              <TableCell className="align-top text-muted-foreground text-sm leading-relaxed">
                How hard it is to mentally simulate running your code—weighted for nesting, loops, and conditions.
                Scores in the green band feel easy to follow.
              </TableCell>
              <TableCell className="align-top text-right tabular-nums font-medium">
                {summary.cognitiveMean.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-medium">
                Maintainability Index (<span className="font-mono text-xs">MI_norm</span>)
              </TableCell>
              <TableCell className="align-top text-muted-foreground text-sm leading-relaxed">
                A composite score (0–100) combining complexity, volume, and code length. Above 65 is considered
                maintainable; above 85 is excellent (GRAD-AI-style normalization).
              </TableCell>
              <TableCell className="align-top text-right tabular-nums font-medium">
                {summary.miNormMean.toFixed(1)}
              </TableCell>
            </TableRow>
            {showReact ? (
              <TableRow>
                <TableCell className="align-top font-medium">React Component Share</TableCell>
                <TableCell className="align-top text-muted-foreground text-sm leading-relaxed">
                  Density of UI-layer functions versus logic functions. Shows whether complexity concentrates in your
                  UI or your business logic.
                </TableCell>
                <TableCell className="align-top text-right tabular-nums font-medium">{reactPct}%</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
