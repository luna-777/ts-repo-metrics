import type { PerFileEntry } from "@/lib/reportTypes";

export interface FileAggregateStats {
  maxComplexity: number;
  avgComplexity: number;
  longestFn: number;
  maxNesting: number;
}

/** Per-file aggregates used by file-level tables (max/avg complexity, nesting, longest function). */
export function fileStats(pf: PerFileEntry): FileAggregateStats {
  const maxComplexity =
    pf.complexity.length > 0 ? Math.max(...pf.complexity.map((c) => c.complexity)) : 0;
  const avgComplexity =
    pf.complexity.length > 0
      ? pf.complexity.reduce((s, c) => s + c.complexity, 0) / pf.complexity.length
      : 0;
  const longestFn =
    pf.functionMetrics.length > 0
      ? Math.max(...pf.functionMetrics.map((f) => f.lines))
      : 0;
  const maxNesting =
    pf.functionMetrics.length > 0
      ? Math.max(...pf.functionMetrics.map((f) => f.maxNestingDepth))
      : 0;
  return { maxComplexity, avgComplexity, longestFn, maxNesting };
}
