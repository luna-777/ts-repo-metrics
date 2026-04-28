import type { SessionLogReport } from "@/lib/aiSessionLogAnalyzer";

/**
 * User messages sent to Repo Coach when someone clicks Ask AI Coach on AI Maturity.
 * The chat API receives full repo report summary separately; include tab-specific snapshots here.
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

export function buildAiMaturityPlaybookCoachPrompt(): string {
  return [
    "The developer is viewing the AI Maturity tab coach's playbook on Repo Metrics.",
    "",
    COACH_VOICE,
    "",
    "Summarize why this framing matters for developers in 5–7 sentences:",
    "1) Orchestrator archetype — pilot vs passenger; Senior Orchestrator vs micromanager loops.",
    "2) Discovery-to-action — search/read/grep vs blind edits.",
    "3) Stuck / friction loops — stop and refactor or simplify the task.",
    "4) Verification frequency — trust but verify tests/shell signals.",
    "5) Token / reasoning overhead (when present) vs blind ROI without git enrichment.",
    "End with one concrete homework item for next week.",
  ].join("\n");
}

/** Snapshot for AUM + optional session analyzer — main “Ask AI Coach” on this tab */
export function buildAiMaturityFullTabCoachPrompt(
  aumBrief: Record<string, unknown>,
  sessionReport: SessionLogReport | null,
  isDemo: boolean,
): string {
  const sessionBlob = sessionReport
    ? truncate(JSON.stringify(sessionReport, null, 0), 12_000)
    : "(No session log report — CSV-only upload hides the analyzer, or analyzer not populated.)";

  return [
    "You are Repo Coach. The teammate opened Ask AI Coach from AI Maturity (AUM research proxies + optional session-log analyzer).",
    isDemo ? "NOTE: Figures may be SAMPLE / demo data." : "",
    "",
    COACH_VOICE,
    "",
    "--- Snapshot (paste as truth for this coaching turn) ---",
    truncate(JSON.stringify({ isDemo, aumBrief }, null, 2), 8_000),
    "",
    "--- Session log analyzer JSON (may be omitted) ---",
    sessionBlob,
    "",
    "TASK:",
    "- In 10–14 sentences, synthesize BOTH the aggregate AUM story (iterations, write ratio, session concentration, stage cards) AND the session-analyzer archetype/scorecards/patterns WHEN present.",
    "- Translate numbers into coaching language — what to try next sprint, phrased as recommendations (not jargon definitions only).",
    "- If enrichment-only metrics are missing from export, acknowledge limits honestly.",
    "- Close with TWO bullet recommendations prioritized by leverage.",
    "",
    "Tone: constructive, respectful, concise.",
  ].join("\n")
    .replace(/\n\n\n+/g, "\n\n");
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

/** Aggregates-only AUM area when session section hidden or narrow question. */
export function buildAiMaturityAggregateCoachPrompt(aumBrief: Record<string, unknown>): string {
  return [
    "You are Repo Coach. The teammate clicked Ask AI about the AUM profile (overall score, KPIs, SDLC stage bars below).",
    "",
    COACH_VOICE,
    "",
    "--- AUM aggregates ---",
    truncate(JSON.stringify(aumBrief, null, 2), 8_000),
    "",
    "Explain iterative prompting vs verification proxies in plain English and give 4–6 coaching recommendations referencing their numbers.",
  ].join("\n");
}
