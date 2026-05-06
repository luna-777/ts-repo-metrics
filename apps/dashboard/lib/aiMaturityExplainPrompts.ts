import type { SessionLogReport } from "@/lib/aiSessionLogAnalyzer";

/**
 * User messages sent to Repo Coach from the AI Usage tab (uploaded agent traces).
 * The chat API receives the repo analysis separately; these prompts carry trace snapshots only.
 */

const COACH_VOICE = [
  "Philosophy: this is HIGH-PERFORMANCE COACHING, not surveillance or employee monitoring.",
  "Mirror before technical debt — help developers see their AI usage patterns with rigorous, ego-free critiques.",
  "Prefer self-reliance and specific next-session actions over vague praise.",
].join("\n");

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/** Session log analyzer panel only — when user wants depth on archetype/stuck tokens. */
export function buildAiMaturitySessionCoachPrompt(report: SessionLogReport): string {
  return [
    "You are Repo Coach. Focus ONLY on the session log analyzer snapshot below.",
    "",
    COACH_VOICE,
    "",
    "--- Session log analyzer ---",
    truncate(JSON.stringify(report, null, 2), 14_000),
    "",
    "Explain archetype, scorecard percentages, discovery ratio, verification proxies, stuck/friction, and patterns.",
    "For each numbered area, pair interpretation with ONE recommendation tailored to engineers who want to sharpen AI habits.",
    "If Token ROI/manual intervention are marked unavailable, say why bridging git would help briefly.",
    "8–12 sentences total plus 3 prioritized bullet actions.",
  ].join("\n");
}

/** Aggregates from uploaded AI trace (CSV / derived JSONL): overall score, KPIs, stage cards. */
export function buildAiMaturityAggregateCoachPrompt(profileBrief: Record<string, unknown>): string {
  return [
    "You are Repo Coach. The teammate is on the AI Usage tab and clicked Ask Coach.",
    "They uploaded an AI coding-agent trace; below are aggregates only (overall score, KPI rows, per-phase cards).",
    "",
    COACH_VOICE,
    "",
    "--- Trace aggregates ---",
    truncate(JSON.stringify(profileBrief, null, 2), 8_000),
    "",
    "Explain iterations-per-prompt, write ratio, session concentration, and stage scores in plain language.",
    "Give 4–6 concrete coaching recommendations that reference their numbers.",
  ].join("\n");
}
