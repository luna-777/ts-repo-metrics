/**
 * Static coach knowledge: metric semantics, methodology, limits, product behavior.
 * Keep concise; cap when concatenating into the chat system prompt.
 */
export const MAX_COACH_CONTEXT_CHARS = 8000;

export function getCoachContextText(): string {
  return COACH_CONTEXT.trim();
}

const COACH_CONTEXT = `
## Metric definitions (high level)
- **LOC / profile:** Lines of code counts from parsed source; test vs source split uses path/test heuristics, not coverage tools.
- **Cyclomatic complexity:** Decision points per function; high values suggest harder-to-test paths. Not a quality score by itself.
- **Maintainability index (when present):** Composite heuristic from static metrics; "low" is a signal to review, not a verdict.
- **Test coverage proxy:** Ratio of test LOC to source LOC — a **structural** hint, not statement or branch coverage (not Istanbul).
- **Duplication:** Textual / structural clone detection; share of duplicated lines and cluster counts.
- **Git metrics (cadence, burst, churn):** From commit history when a full clone is available; API-only / zipball runs may omit or simplify git-rich fields (e.g. gitMetricsV2).
- **React metrics:** Component size, JSX depth, prop-drilling edges, hook-safety heuristics — static only.
- **Phase 3 / "AI smells" (when present):** Silent-failure patterns in catches, structural redundancy — heuristics over source text.

## Methodology
- **Preferred path:** Clone the repo locally for analysis when possible — enables full git history and richer gitMetricsV2.
- **Fallback:** GitHub zipball + REST may yield thinner git behavior and fewer per-commit signals.
- **Static analysis only:** No runtime profiling, no production logs, no secret scanning of live environments.

## Limitations (what not to conclude)
- Metrics are **correlational heuristics**, not proof of team skill or production incidents.
- **Incomplete history** (shallow clone, fork, force-pushes) skews git-derived numbers.
- **No execution data:** Cannot infer real user traffic, latency, or error rates.
- If a field is missing from the report JSON, say you **don't see it** — do not invent values.

## Product behavior
- **Private repositories** require the user to **sign in** with GitHub and grant access.
- **Results** may be persisted server-side (e.g. Supabase) when the deployment is configured; otherwise behavior follows the host's dev/prod mode.
- **This coach** only sees the **analysis payload** (summary + JSON sent in this request), not live GitHub files or repos the user has not analyzed.
`;
