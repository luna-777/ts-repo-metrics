/**
 * GRAD-AI-style per-function Maintainability Index (Gambo et al., 2025).
 * Uses natural logarithms. Distinct from Coleman repo-level MI in maintainabilityIndex.ts.
 */

const LN_SCALE = 171;

function safeLog(x: number): number {
  return Math.log(Math.max(x, 1));
}

/**
 * MI_raw = 171 - 5.2*ln(V) - 0.23*CC - 16.2*ln(LOC)
 */
export function calculateMIGradAiRaw(
  halsteadVolume: number,
  cyclomaticComplexity: number,
  linesOfCode: number,
): number {
  const V = Math.max(halsteadVolume, 1);
  const CC = Math.max(cyclomaticComplexity, 1);
  const LOC = Math.max(linesOfCode, 1);
  const raw =
    LN_SCALE -
    5.2 * safeLog(V) -
    0.23 * CC -
    16.2 * safeLog(LOC);
  return Math.round(raw * 1000) / 1000;
}

/** MI_norm = max(0, MI_raw * 100 / 171) */
export function normalizeMIGradAi(miRaw: number): number {
  const scaled = (miRaw * 100) / LN_SCALE;
  return Math.round(Math.max(0, scaled) * 1000) / 1000;
}
