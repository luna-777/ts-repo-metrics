import type { SymbolVerificationRisk } from "@/lib/reportTypes";

export type RiskTier = "critical" | "high" | "medium" | "low";

export type VerificationLane = "referenced" | "paired_only" | "none";

export interface SymbolRiskScatterPoint {
  /** Stable key for SVG elements */
  key: string;
  x: number;
  /** Discrete test-proximity band (not a 0–1 continuum in practice). */
  lane: VerificationLane;
  labelShort: string;
  tier: RiskTier;
}

/** Map engine evidence to visualization lane (top = stronger test signal). */
export function laneFromEvidence(evidence: SymbolVerificationRisk["evidence"]): VerificationLane {
  switch (evidence) {
    case "referenced_in_test":
      return "referenced";
    case "paired_file_only":
      return "paired_only";
    default:
      return "none";
  }
}

/**
 * Thresholds emphasize high complexity with weak test proximity (`riskScore` from engine).
 */
export function tierFromRisk(r: SymbolVerificationRisk): RiskTier {
  const rs = r.riskScore;
  const cc = r.cyclomaticComplexity;
  if (rs >= 28 || cc >= 28) return "critical";
  if (rs >= 14 || cc >= 18) return "high";
  if (rs >= 6 || cc >= 12) return "medium";
  return "low";
}

export function tierAction(tier: RiskTier): string {
  switch (tier) {
    case "critical":
      return "Prioritize tests or decompose.";
    case "high":
      return "Add characterization tests.";
    case "medium":
      return "Consider targeted coverage.";
    default:
      return "Monitor during changes.";
  }
}

export function buildScatterPoints(rows: SymbolVerificationRisk[]): SymbolRiskScatterPoint[] {
  return rows.map((r, i) => ({
    key: `${r.file}:${r.name}:${r.startLine}:${i}`,
    x: r.cyclomaticComplexity,
    lane: laneFromEvidence(r.evidence),
    labelShort: `${r.file}:${r.name}`,
    tier: tierFromRisk(r),
  }));
}
