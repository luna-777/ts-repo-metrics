/**
 * In-memory report cache when Supabase is not configured (local `next dev` only).
 * Not durable across server restarts or multiple instances.
 */

import type { RepoReport } from "@/lib/reportTypes";

const MAX_ENTRIES = 50;
const store = new Map<string, RepoReport>();

export function devStoreReport(resultId: string, report: RepoReport): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(resultId, report);
}

export function devGetReport(resultId: string): RepoReport | null {
  return store.get(resultId.trim()) ?? null;
}
