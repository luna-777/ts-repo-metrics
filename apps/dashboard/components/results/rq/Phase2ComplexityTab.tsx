"use client";

import { useMemo } from "react";
import { RQFramingHeader } from "./RQFramingHeader";
import type { RepoReport, FunctionDetail } from "@/lib/reportTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Phase2ComplexityTabProps {
  report: RepoReport;
}

function hasPhase2Block(
  f: FunctionDetail,
): f is FunctionDetail & {
  halstead: NonNullable<FunctionDetail["halstead"]>;
  cognitiveComplexity: number;
  maintainabilityIndexGradAiNorm: number;
} {
  return (
    f.halstead !== undefined &&
    typeof f.cognitiveComplexity === "number" &&
    typeof f.maintainabilityIndexGradAiNorm === "number"
  );
}

export function Phase2ComplexityTab({ report }: Phase2ComplexityTabProps) {
  const rows = useMemo(() => {
    const out: { file: string; fn: FunctionDetail }[] = [];
    for (const pf of report.perFile ?? []) {
      for (const fn of pf.functionMetrics ?? []) {
        out.push({ file: pf.file, fn });
      }
    }
    return out;
  }, [report.perFile]);

  const hasMetrics = rows.some((r) => hasPhase2Block(r.fn));

  const summary = useMemo(() => {
    if (!hasMetrics) return null;
    const fns = rows.map((r) => r.fn).filter(hasPhase2Block);
    if (fns.length === 0) return null;
    const vol = fns.map((f) => f.halstead.volume);
    const cog = fns.map((f) => f.cognitiveComplexity);
    const mi = fns.map((f) => f.maintainabilityIndexGradAiNorm);
    const mean = (a: number[]) =>
      a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
    const median = (a: number[]) => {
      const s = sorted(a);
      if (s.length === 0) return 0;
      const m = Math.floor((s.length - 1) / 2);
      return s.length % 2 ? s[m]! : (s[m]! + s[m + 1]!) / 2;
    };
    const p90 = (a: number[]) => {
      const s = sorted(a);
      if (s.length === 0) return 0;
      const idx = Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1);
      return s[idx]!;
    };
    const reactN = fns.filter((f) => f.isReactComponent).length;
    return {
      halsteadVolMean: mean(vol),
      halsteadVolP90: p90(vol),
      cognitiveMean: mean(cog),
      cognitiveP90: p90(cog),
      miNormMean: mean(mi),
      miNormMedian: median(mi),
      reactShare: reactN / fns.length,
    };
  }, [rows, hasMetrics]);

  if (!hasMetrics) {
    return (
      <div className="space-y-4">
        <RQFramingHeader rq="RQ3" />
        <p className="text-muted-foreground text-sm max-w-2xl">
          No Phase 2 lexical / cognitive metrics in this report. Re-run analysis with the current{" "}
          <code className="rounded bg-muted px-1">@repo-metrics/engine</code>, or load a fresh result.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RQFramingHeader rq="RQ3" />
      <p className="text-muted-foreground text-sm max-w-2xl">
        <strong>Lexical</strong> (Halstead volume), <strong>structural</strong> (cyclomatic), and{" "}
        <strong>cognitive</strong> complexity per function, plus GRAD-AI maintainability index (
        <code className="rounded bg-muted px-1">MI_norm</code> on 0–100 for charts). See references below.
      </p>

      {summary && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
          <p className="font-medium">Repo-level aggregates (functions: {rows.length})</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Halstead volume — mean {summary.halsteadVolMean.toFixed(1)}, p90{" "}
              {summary.halsteadVolP90.toFixed(1)}
            </li>
            <li>
              Cognitive complexity — mean {summary.cognitiveMean.toFixed(2)}, p90{" "}
              {summary.cognitiveP90.toFixed(2)}
            </li>
            <li>
              <code className="rounded bg-muted px-1">MI_norm</code> — mean {summary.miNormMean.toFixed(1)}, median{" "}
              {summary.miNormMedian.toFixed(1)}
            </li>
            <li>React component heuristic — {(summary.reactShare * 100).toFixed(1)}% of functions</li>
          </ul>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">CC</TableHead>
              <TableHead className="text-right">Halstead V</TableHead>
              <TableHead className="text-right">Cognitive</TableHead>
              <TableHead className="text-right">MI_norm</TableHead>
              <TableHead className="text-right">MI_raw</TableHead>
              <TableHead>React?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ file, fn }) => (
              <TableRow key={`${file}:${fn.name}:${fn.startLine}`}>
                <TableCell className="font-mono text-xs max-w-[140px] truncate">{file}</TableCell>
                <TableCell className="font-mono text-sm">{fn.name}</TableCell>
                <TableCell className="text-right tabular-nums">{fn.cyclomaticComplexity}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fn.halstead?.volume?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fn.cognitiveComplexity}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fn.maintainabilityIndexGradAiNorm?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {fn.maintainabilityIndexGradAiRaw?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell>{fn.isReactComponent ? "yes" : "no"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border p-4 text-sm space-y-2 text-muted-foreground">
        <p className="font-medium text-foreground">References</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Imai, S. (2022). Halstead-style volume and AI-assisted code quality.{" "}
            <em>Information and Software Technology</em>.
          </li>
          <li>
            Gambo, I., et al. (2025). GRAD-AI maintainability-style scoring.{" "}
            <em>Education and Information Technologies</em>.
          </li>
          <li>
            Jönsson, A., &amp; Wehbi, N. (2025). Cognitive / structural quality of AI-generated mobile apps. Blekinge
            Institute of Technology.
          </li>
        </ul>
        <p>
          Repo-level <code className="rounded bg-muted px-1">maintainability.score</code> uses the Coleman-style index;
          per-function <code className="rounded bg-muted px-1">MI_norm</code> here is GRAD-AI–style (see docs).
        </p>
      </div>
    </div>
  );
}
