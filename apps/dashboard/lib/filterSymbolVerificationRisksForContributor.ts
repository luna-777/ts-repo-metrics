import type { SymbolVerificationRisk } from "@/lib/reportTypes";

/** Normalize analyzer/git relative paths for set lookup. */
export function normalizeRepoRelativePath(p: string): string {
  return String(p ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

export function filterSymbolVerificationRisksForContributor(
  rows: SymbolVerificationRisk[] | undefined,
  opts: {
    scopeTeam: boolean;
    sourcePathsTouchedList?: readonly string[] | null;
  },
): {
  rows: SymbolVerificationRisk[];
  contributorFilterActive: boolean;
  contributorFilterYieldedNone: boolean;
} {
  if (!rows?.length) {
    return { rows: [], contributorFilterActive: false, contributorFilterYieldedNone: false };
  }
  if (opts.scopeTeam || !opts.sourcePathsTouchedList?.length) {
    return { rows, contributorFilterActive: false, contributorFilterYieldedNone: false };
  }
  const set = new Set(opts.sourcePathsTouchedList.map((p) => normalizeRepoRelativePath(p)));
  const filtered = rows.filter((r) => set.has(normalizeRepoRelativePath(r.file)));
  return {
    rows: filtered,
    contributorFilterActive: true,
    contributorFilterYieldedNone: filtered.length === 0,
  };
}
