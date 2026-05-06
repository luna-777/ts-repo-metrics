/**
 * Extensible tab-specific AI snippets (Commit Habits first).
 */

import { RESULTS_TAB } from "@/lib/resultsNavigation";

export type TabInsightId = typeof RESULTS_TAB.commitHabits;

/** Model output for Commit Habits tab insight (validated server-side). */
export interface CommitHabitsInsightPayload {
  /** 2–5 sentences, grounded in facts only. */
  intro: string;
  /** Short encouragement / primary suggestion (1–3 sentences). */
  momentumLead: string;
  /** 3 concise next actions. */
  momentumBullets: string[];
}
