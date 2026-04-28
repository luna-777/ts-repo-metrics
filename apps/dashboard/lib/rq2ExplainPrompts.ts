/**
 * User messages sent to the repo coach when someone clicks “What does this mean?” on RQ2.
 * The API already receives full {@link buildReportSummary} context.
 */

/** Tests and safety nets — metric cards (LOC, churn, pct commits touching tests, etc.) */
export const RQ2_EXPLAIN_SAFETY_NETS = `In 4–6 short sentences, explain the "Tests and safety nets" area of this Repo Metrics report: what Test LOC / Source LOC and test file counts represent (analyzer snapshot vs git-derived numbers), how the contributor dropdown changes—or does not change—those figures, and one common misconception (for example confusing this with line coverage/Istanbul). Use student-friendly language.`;

/** Complexity vs test proximity — bands, scatter, tier table */
export const RQ2_EXPLAIN_PROXIMITY = `In 4–6 short sentences, explain the "Complexity versus test proximity" chart and table: what the three horizontal bands mean (no paired test file vs paired-only vs function name appearing in paired test file), why dot color indicates risk tier, and that this is a static heuristic—not runtime coverage. Mention how someone should use the tier column to prioritize.`;
