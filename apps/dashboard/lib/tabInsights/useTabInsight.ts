"use client";

import { useEffect, useMemo, useState } from "react";
import type { TabInsightId } from "./types";
import type { CommitHabitsInsightPayload } from "./types";
import { fetchTabInsight } from "./fetchTabInsight";

interface UseTabInsightState {
  data: CommitHabitsInsightPayload | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Fetches tab-specific AI copy (deduped via fetchTabInsight in-flight cache).
 */
export function useTabInsight(
  tabId: TabInsightId,
  facts: Record<string, unknown> | null,
  enabled: boolean,
): UseTabInsightState {
  const [state, setState] = useState<UseTabInsightState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const factsKey = useMemo(() => (facts ? JSON.stringify(facts) : ""), [facts]);

  useEffect(() => {
    if (!enabled || !facts || factsKey === "") {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    void fetchTabInsight(tabId, facts)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, isLoading: false });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const err = e instanceof Error ? e : new Error(String(e));
          setState({ data: null, error: err, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tabId, factsKey, enabled, facts]);

  return state;
}
