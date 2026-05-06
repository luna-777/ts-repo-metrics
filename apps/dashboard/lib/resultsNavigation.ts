/**
 * User-facing tab ids for the Results dashboard (kebab-case, not research instrument codes).
 */

export const RESULTS_TAB = {
  commitHabits: "commit-habits",
  testing: "testing",
  codeQuality: "code-quality",
  reactComponents: "react-components",
  codeComplexity: "code-complexity",
  aiUsage: "ai-usage",
  dataset: "dataset",
} as const;

export type ResultsTabId = (typeof RESULTS_TAB)[keyof typeof RESULTS_TAB];

/** Tabs the global coach may point to (dataset excluded). */
export type CoachPriorityTabId = Exclude<ResultsTabId, typeof RESULTS_TAB.dataset>;

/** Scroll targets for in-page navigation from coach and overview cards. */
export const PANEL_SCROLL_IDS: Record<CoachPriorityTabId, string> = {
  [RESULTS_TAB.commitHabits]: "commit-habits-panel",
  [RESULTS_TAB.testing]: "testing-panel",
  [RESULTS_TAB.codeQuality]: "code-quality-panel",
  [RESULTS_TAB.reactComponents]: "react-components-panel",
  [RESULTS_TAB.codeComplexity]: "code-complexity-panel",
  [RESULTS_TAB.aiUsage]: "ai-usage-panel",
};

export function panelScrollIdForTab(tab: CoachPriorityTabId): string {
  return PANEL_SCROLL_IDS[tab];
}

/** In-page anchor id for a results tab panel (coach + overview links). */
export const panelScrollIdForCoachTab = panelScrollIdForTab;
