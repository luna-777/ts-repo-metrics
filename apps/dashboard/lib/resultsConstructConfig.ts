/**
 * Dashboard construct ids align with Results tabs: Commit Habits, Testing, Code Quality.
 * {@link RESULTS_CONSTRUCT_CONFIGS} supplies titles where study framing appears in the UI.
 */

export type ResultsConstructId = "commit-habits" | "testing" | "code-quality";

export interface ResultsConstructConfig {
  id: ResultsConstructId;
  title: string;
  question: string;
  operationalization: string;
}

/** Student-facing copy for the Commit Habits tab — learning-only; no research header. */
export const BEHAVIORAL_LEARNING_FRAMING = {
  title: "How your team works",
  lead:
    "This tab turns your repository’s git history into a snapshot of collaboration: how often you commit, how big those changes tend to be, whether work lands in short bursts, and which files see the most activity.",
  discussion:
    "These numbers are conversation starters for your team—not scores. Use them in standups or retros to align on habits, integration, and where the code is moving most.",
  teamVsAuthor:
    "Repository cards below summarize combined history for everyone; the teammate table shows the same kinds of measures per author where git recorded them.",
  /** Shown when analysis used API-only metadata (sparse line-level stats). */
  trustApi:
    "GitHub API mode only has commit metadata for some fields; line counts and related rates may show as zero—that usually means the data wasn’t available, not that no work happened.",
  /** Generic trust line when mode is unknown or local. */
  trustGeneric:
    "If something looks off, check the metric help (?) on each card and the documentation for how each value is computed.",
} as const;

/** Student-facing copy for the Testing tab — learning-only; no research header. */
export const VERIFICATION_LEARNING_FRAMING = {
  title: "Checking your work",
  lead:
    "This tab connects how much automated checking you have around the code (tests, test-heavy commits) with rough signals of structural risk (complexity, long functions) and hygiene (empty catches, stray console calls).",
  discussion:
    "These metrics do not judge your grade—they help your team decide where verification is thin and where logic is hardest to review.",
  scopeNote:
    "Repository-wide totals (LOC, complexity, catches) describe the codebase as scanned; git-based shares can be narrowed to one author below when contributors are known.",
} as const;

export const RESULTS_CONSTRUCT_CONFIGS: Record<ResultsConstructId, ResultsConstructConfig> = {
  "commit-habits": {
    id: "commit-habits",
    title: "Commit Habits",
    question:
      "How does access to generative AI tools correspond with observable software engineering behaviors?",
    operationalization:
      "We measure workflow cadence, commit structure, burst patterns, and churn concentration.",
  },
  testing: {
    id: "testing",
    title: "Testing",
    question:
      "Within AI-using teams, how do verification efforts and cognitive engagement patterns relate to repository indicators of quality and stability?",
    operationalization:
      "We compare verification effort (test coverage proxy, test-touch commits) against minimal structural risk exposure to assess moderation.",
  },
  "code-quality": {
    id: "code-quality",
    title: "Code Quality",
    question:
      "Do projects developed with AI exhibit differences in complexity, maintainability, documentation, and testability?",
    operationalization:
      "We measure structural complexity, maintainability index, distribution metrics, and concentration of risk.",
  },
};

/** Metric keys mapped to primary Results tab construct for optional badge display. */
export const METRIC_TO_RESULTS_CONSTRUCT: Record<string, ResultsConstructId> = {
  total_commits: "commit-habits",
  commits_per_week: "commit-habits",
  median_commit_size: "commit-habits",
  average_lines_per_commit: "commit-habits",
  large_commit_ratio: "commit-habits",
  burst_ratio: "commit-habits",
  burst_count: "commit-habits",
  std_dev_time_between_commits: "commit-habits",
  pct_over_500_loc: "commit-habits",
  pct_over_1000_loc: "commit-habits",
  duplication_percent: "commit-habits",
  framework_detected: "commit-habits",
  test_loc_ratio: "testing",
  test_loc: "testing",
  source_loc: "testing",
  test_files: "testing",
  pct_commits_touching_tests: "testing",
  refactor_commit_ratio: "testing",
  empty_catch_block_count: "testing",
  console_log_count: "testing",
  high_complexity_count: "testing",
  long_function_count: "testing",
  max_complexity: "testing",
  total_functions: "code-quality",
  avg_complexity: "code-quality",
  p90_complexity: "code-quality",
  avg_function_length: "code-quality",
  p90_function_length: "code-quality",
  max_nesting_depth: "code-quality",
  long_parameter_list_count: "code-quality",
  maintainability_score: "code-quality",
  maintainability_classification: "code-quality",
  percent_high_complexity_in_top_10_percent_files: "code-quality",
  phase3_sfd: "code-quality",
  phase3_mcr: "code-quality",
  phase3_srs: "code-quality",
  phase3_silent_failure_count: "code-quality",
  phase3_monolithic_component_count: "code-quality",
  phase3_react_component_count: "code-quality",
  phase3_srs_weighted_numerator: "code-quality",
};
