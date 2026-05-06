"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoachSaysFacts } from "./coachSaysFacts";
import { buildCoachSaysFallback } from "./coachSaysFacts";
import type { CoachSaysPayload } from "./coachSaysTypes";
import { fetchCoachSays } from "./fetchCoachSays";

interface UseCoachSaysState {
  payload: CoachSaysPayload;
  /** True while the first in-flight request for this facts snapshot has not settled. */
  isLoading: boolean;
  /** Populated when the API returned an error (payload falls back to deterministic copy). */
  error: Error | null;
}

/**
 * Loads global “YOUR COACH SAYS” copy (deduped via fetchCoachSays cache).
 * Shows deterministic fallback immediately, then upgrades when the API succeeds.
 */
export function useCoachSays(facts: CoachSaysFacts, enabled: boolean): UseCoachSaysState {
  const baseline = useMemo(() => buildCoachSaysFallback(facts), [facts]);

  const [override, setOverride] = useState<CoachSaysPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setOverride(null);
    setError(null);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void fetchCoachSays(facts)
      .then((data) => {
        if (!cancelled) {
          setOverride(data);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setOverride(null);
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, facts]);

  return {
    payload: override ?? baseline,
    isLoading,
    error,
  };
}
