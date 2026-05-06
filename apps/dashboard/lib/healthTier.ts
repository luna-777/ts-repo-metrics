import type { CommitHabitsTier } from "@/lib/commitHabitsScore";

/** Bands aligned with Commit Habits: strong ≥70, good ≥55, needs_work ≥35, else critical. */
export function healthTierFromScore(score: number): CommitHabitsTier {
  if (score >= 70) return "strong";
  if (score >= 55) return "good";
  if (score >= 35) return "needs_work";
  return "critical";
}
