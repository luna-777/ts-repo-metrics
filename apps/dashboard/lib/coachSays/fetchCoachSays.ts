import type { CoachSaysFacts } from "./coachSaysFacts";
import type { CoachSaysPayload } from "./coachSaysTypes";

const MAX_FACTS_BYTES = 52_000;

const resolvedCache = new Map<string, CoachSaysPayload>();
const inflightCache = new Map<string, Promise<CoachSaysPayload>>();

export function stableCoachFactsKey(facts: CoachSaysFacts): string {
  return JSON.stringify(facts);
}

export async function fetchCoachSays(facts: CoachSaysFacts): Promise<CoachSaysPayload> {
  const raw = JSON.stringify(facts);
  if (raw.length > MAX_FACTS_BYTES) {
    throw new Error("Coach facts payload too large");
  }
  const key = raw;

  const done = resolvedCache.get(key);
  if (done) return done;

  let inflight = inflightCache.get(key);
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch("/api/coach-says", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(typeof err?.error === "string" ? err.error : `HTTP ${res.status}`);
        }
        const data = (await res.json()) as CoachSaysPayload;
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
export function clearCoachSaysCache(): void {
  resolvedCache.clear();
  inflightCache.clear();
}
