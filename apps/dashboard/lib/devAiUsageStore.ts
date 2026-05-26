/**
 * In-memory AI usage CSV cache when Supabase is not configured (local dev only).
 */

const MAX_ENTRIES = 50;
const store = new Map<string, string>();

export function devStoreAiUsageCsv(resultId: string, csvText: string): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(resultId.trim(), csvText);
}

export function devGetAiUsageCsv(resultId: string): string | null {
  return store.get(resultId.trim()) ?? null;
}
