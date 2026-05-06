"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Band({ color, label }: { color: "green" | "yellow" | "red"; label: string }) {
  const bg =
    color === "green"
      ? "bg-emerald-500/80"
      : color === "yellow"
        ? "bg-amber-500/80"
        : "bg-red-500/80";
  return (
    <div className="text-muted-foreground flex items-start gap-2 text-xs leading-snug">
      <span className={cnDot(bg)} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function cnDot(bg: string) {
  return `mt-0.5 size-2 shrink-0 rounded-sm ${bg}`;
}

/**
 * Explains calibrated bands for conditional formatting on the per-function metrics table,
 * with academic / industry provenance and interpretive significance.
 */
export function Phase2ThresholdLegend() {
  return (
    <details className="bg-card text-card-foreground group rounded-xl border border-muted-foreground/25 shadow-sm">
      <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-base font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
        <span>Threshold calibration</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground group-open:hidden"
          aria-hidden
        />
        <ChevronUp
          className="hidden size-4 shrink-0 text-muted-foreground group-open:inline"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t px-5 pb-5 pt-4">
        <p className="text-muted-foreground text-sm font-normal leading-relaxed">
          This listing colors <strong className="text-foreground font-medium">MI_norm</strong>,{" "}
          <strong className="text-foreground font-medium">CC</strong>, and{" "}
          <strong className="text-foreground font-medium">cognitive complexity</strong> using the bands below. Sources
          follow widely cited benchmarks—not ad hoc cutoffs.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[10rem]">Metric</TableHead>
                <TableHead className="min-w-[11rem]">Implementation (dashboard)</TableHead>
                <TableHead className="min-w-[10rem] whitespace-nowrap">
                  Academic / industry source
                </TableHead>
                <TableHead className="min-w-[14rem]">Significance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium">
                  Maintainability Index (MI<sub className="text-xs">norm</sub>)
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1.5">
                    <Band color="green" label="Green: ≥85" />
                    <Band color="yellow" label="Yellow: 65–84" />
                    <Band color="red" label="Red: &lt;65" />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm">
                  Gambo et al. (2025) / Microsoft
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm leading-relaxed">
                  &lt;65 is the &ldquo;Danger Zone.&rdquo; At this level, the cost of change often outweighs the value of
                  the code.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Cyclomatic complexity (CC)</TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1.5">
                    <Band color="green" label="Green: ≤10" />
                    <Band color="yellow" label="Yellow: 11–20" />
                    <Band color="red" label="Red: &gt;20" />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm">
                  McCabe (1976) / NIST
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm leading-relaxed">
                  &gt;10 is the standard threshold where automated testing becomes exponentially harder to cover.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Cognitive complexity (CoC)</TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1.5">
                    <Band color="green" label="Green: ≤8" />
                    <Band color="yellow" label="Yellow: 9–15" />
                    <Band color="red" label="Red: &gt;15" />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm">
                  SonarSource / Jönsson (2025)
                </TableCell>
                <TableCell className="text-muted-foreground align-top text-sm leading-relaxed">
                  &gt;15 is where a human developer can no longer &ldquo;mentally simulate&rdquo; the code without
                  making errors.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </details>
  );
}
