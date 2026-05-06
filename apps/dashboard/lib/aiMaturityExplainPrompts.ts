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

const EFFICIENCY_VS_SAFETY_RULES = [
  "EFFICIENCY VS SAFETY (session log scorecard — read carefully):",
  "- Efficiency blends (a) fewer tool calls per user prompt and (b) a discovery share from the tool-call mix. It is not wall-clock speed, session length, or typing rate.",
  "- Safety / compliance is separate: verification-style habits (read-back after Write/Edit; test-like shell commands when the log includes shell tools) plus penalties for edits that lack earlier read/search in the same turn. It is not a security audit.",
  "- Read-after-write means the next tool call after Write or Edit is Read in the exported sequence—not git or CI discipline.",
  "- When recommending fixes, do not tell the user that read-after-write or test-like shell usage \"improves Efficiency\"; those feed Safety. Discovery ratio feeds both Efficiency (discovery component) and the Discovery depth bucket.",
].join("\n");

/** Aggregates from uploaded AI trace (CSV / derived JSONL): overall score, KPIs, stage cards. */
export function buildAiMaturityAggregateCoachPrompt(profileBrief: Record<string, unknown>): string {
  return [
    "You are Repo Coach. The teammate is on the AI Usage tab and clicked Ask Coach.",
    "They uploaded an AI coding-agent trace; below are aggregates only (overall score, KPI rows, per-phase cards).",
    "If `sessionLog` is present, it holds parsed session-log scorecard fields (efficiency breakdown, discovery depth, verification metrics).",
    "",
    COACH_VOICE,
    "",
    EFFICIENCY_VS_SAFETY_RULES,
    "",
    "--- Trace aggregates ---",
    truncate(JSON.stringify(profileBrief, null, 2), 8_000),
    "",
    "Explain iterations-per-prompt, write ratio, and stage scores in plain language.",
    "When sessionLog is non-null, tie in efficiency, safety, discovery depth/ratio, and read-after-write using the rules above—without conflating those signals.",
    "Give 4–6 concrete coaching recommendations that reference their numbers.",
  ].join("\n");
}
