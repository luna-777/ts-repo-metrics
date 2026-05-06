import type { TabInsightId } from "./types";
import type { CommitHabitsInsightPayload } from "./types";

const MAX_FACTS_BYTES = 48_000;

const resolvedCache = new Map<string, CommitHabitsInsightPayload>();
const inflightCache = new Map<string, Promise<CommitHabitsInsightPayload>>();

export function stableFactsKey(tabId: TabInsightId, facts: Record<string, unknown>): string {
  return `${tabId}:${JSON.stringify(facts)}`;
}

export async function fetchTabInsight(
  tabId: TabInsightId,
  facts: Record<string, unknown>,
): Promise<CommitHabitsInsightPayload> {
  const raw = JSON.stringify(facts);
  if (raw.length > MAX_FACTS_BYTES) {
    throw new Error("Facts payload too large");
  }
  const key = stableFactsKey(tabId, facts);

  const done = resolvedCache.get(key);
  if (done) return done;

  let inflight = inflightCache.get(key);
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch("/api/tab-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabId, facts }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(typeof err?.error === "string" ? err.error : `HTTP ${res.status}`);
        }
        const data = (await res.json()) as CommitHabitsInsightPayload;
        resolvedCache.set(key, data);
        return data;
      } finally {
        inflightCache.delete(key);
      }
    })();
    inflightCache.set(key, inflight);
  }

  return inflight;
}

/** Tests or “reset demo” can clear caches. */
export function clearTabInsightCache(): void {
  resolvedCache.clear();
  inflightCache.clear();
}
