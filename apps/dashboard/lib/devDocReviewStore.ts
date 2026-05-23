/**
 * In-memory doc-review cache when Supabase is not configured (local dev only).
 */

import type { DocReviewResult } from "@/lib/docReview/types";

const MAX_ENTRIES = 50;
const store = new Map<string, DocReviewResult>();

export function devStoreDocReview(resultId: string, payload: DocReviewResult): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(resultId.trim(), payload);
}

export function devGetDocReview(resultId: string): DocReviewResult | null {
  return store.get(resultId.trim()) ?? null;
}
