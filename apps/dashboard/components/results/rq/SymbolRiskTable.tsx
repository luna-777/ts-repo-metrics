"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SymbolVerificationRisk } from "@/lib/reportTypes";
import { tierAction, tierFromRisk, type RiskTier } from "@/lib/symbolRiskViz";
import { cn } from "@/lib/utils";

const ALL_TIERS: RiskTier[] = ["critical", "high", "medium", "low"];

const tierLabel: Record<RiskTier, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type SortKey =
  | "name"
  | "file"
  | "cyclomaticComplexity"
  | "verificationScore"
  | "riskScore";

const tierStyle: Record<RiskTier, string> = {
  critical: "text-destructive font-medium",
  high: "text-amber-600 dark:text-amber-400 font-medium",
  medium: "text-yellow-700 dark:text-yellow-500",
  low: "text-muted-foreground",
};

interface SymbolRiskTableProps {
  rows: SymbolVerificationRisk[];
  /** Rows per page (default 25). */
  pageSize?: number;
  /** Extra class on the outer wrapper. */
  className?: string;
}

export function SymbolRiskTable({
  rows,
  pageSize: pageSizeProp = 25,
  className,
}: SymbolRiskTableProps) {
  const pageSize = Math.max(1, pageSizeProp);
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tierFilter, setTierFilter] = useState<Set<RiskTier>>(
    () => new Set(ALL_TIERS),
  );
  const [page, setPage] = useState(0);

  function toggleTier(tier: RiskTier) {
    setPage(0);
    setTierFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  }

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    const list = rows.filter((r) => tierFilter.has(tierFromRisk(r)));
    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return mul * a.name.localeCompare(b.name);
        case "file":
          return mul * a.file.localeCompare(b.file);
        case "cyclomaticComplexity":
          return mul * (a.cyclomaticComplexity - b.cyclomaticComplexity);
        case "verificationScore":
          return mul * (a.verificationScore - b.verificationScore);
        case "riskScore":
        default:
          return mul * (a.riskScore - b.riskScore);
      }
    });
    return list;
  }, [rows, sortKey, sortDir, tierFilter]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const maxPageIndex = pageCount - 1;
  const currentPage = Math.min(page, maxPageIndex);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const fromRow = sorted.length === 0 ? 0 : currentPage * pageSize + 1;
  const toRow = sorted.length === 0 ? 0 : Math.min(sorted.length, (currentPage + 1) * pageSize);

  function toggle(k: SortKey) {
    setPage(0);
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" || k === "file" ? "asc" : "desc");
    }
  }

  const activeFilterCount = tierFilter.size;
  const filteredCount = sorted.length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tier
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tier">
            {ALL_TIERS.map((tier) => {
              const on = tierFilter.has(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTier(tier)}
                  aria-pressed={on}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    on
                      ? `${tierStyle[tier]} border-current bg-muted/60`
                      : "border-border text-muted-foreground opacity-60 hover:opacity-90"
                  }`}
                >
                  {tierLabel[tier]}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {activeFilterCount === 0
            ? "Select at least one tier to see rows."
            : `Showing ${filteredCount} of ${rows.length}`}
        </p>
      </div>

      {activeFilterCount === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Turn on one or more tiers above to filter the table.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-2 font-medium">
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline text-left"
                    onClick={() => toggle("name")}
                  >
                    Symbol
                  </button>
                </th>
                <th className="p-2 font-medium hidden sm:table-cell">
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline text-left"
                    onClick={() => toggle("file")}
                  >
                    File
                  </button>
                </th>
                <th className="p-2 font-medium">
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline text-left"
                    onClick={() => toggle("cyclomaticComplexity")}
                  >
                    CC
                  </button>
                </th>
                <th className="p-2 font-medium">
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline text-left"
                    onClick={() => toggle("verificationScore")}
                  >
                    Verification
                  </button>
                </th>
                <th className="p-2 font-medium">
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline text-left"
                    onClick={() => toggle("riskScore")}
                  >
                    Risk
                  </button>
                </th>
                <th className="p-2 font-medium">Tier</th>
                <th className="p-2 font-medium">Suggested action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => {
                const tier = tierFromRisk(r);
                return (
                  <tr
                    key={`${r.file}-${r.name}-${r.startLine}-${currentPage}-${i}`}
                    className="border-b border-border/60"
                  >
                    <td className="p-2 font-mono text-xs">{r.name}</td>
                    <td
                      className="p-2 font-mono text-xs hidden sm:table-cell max-w-[12rem] truncate"
                      title={r.file}
                    >
                      {r.file}
                    </td>
                    <td className="p-2">{r.cyclomaticComplexity}</td>
                    <td className="p-2">{Math.round(r.verificationScore * 100)}%</td>
                    <td className="p-2 font-mono text-xs">{r.riskScore.toFixed(1)}</td>
                    <td className={`p-2 capitalize ${tierStyle[tier]}`}>{tier}</td>
                    <td className="p-2 text-muted-foreground text-xs">{tierAction(tier)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {activeFilterCount > 0 && sorted.length > 0 ? (
        <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Rows {fromRow}–{toRow} of {sorted.length}
            {pageCount > 1 ? ` · Page ${currentPage + 1} of ${pageCount}` : null}
          </p>
          {pageCount > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount - 1}
                onClick={() =>
                  setPage((p) => {
                    const pc = Math.max(1, Math.ceil(sorted.length / pageSize));
                    return Math.min(pc - 1, p + 1);
                  })
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
