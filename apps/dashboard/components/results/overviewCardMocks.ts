import type { OverviewCardItem } from "./OverviewCard";

/** Preview row aligned with design mockups. Replace with repo-derived items when ready. */
export const MOCK_OVERVIEW_CARDS: OverviewCardItem[] = [
  {
    id: "commit-habits",
    title: "Commit Habits",
    tier: "strong",
    score: 82,
    description: "Consistent cadence, healthy commit frequency",
  },
  {
    id: "code-complexity",
    title: "Code Complexity",
    tier: "good",
    score: 78,
    description: "Mean MI_norm 52.3 · 120 functions",
  },
  {
    id: "code-quality",
    title: "Code Quality",
    tier: "needs_work",
    score: 58,
    description: "21 high-complexity functions detected",
  },
  {
    id: "react-components",
    title: "React Components",
    tier: "needs_work",
    score: 54,
    description: "18 oversized components found",
  },
  {
    id: "testing",
    title: "Testing",
    tier: "critical",
    score: 12,
    description: "0% of commits touch test files",
    detailsHref: "#testing-safety-nets",
    detailsTab: "testing",
  },
];

export const MOCK_OVERVIEW_SELECTED_ID = "testing";
