import { cn } from "@/lib/utils";

/**
 * Traffic-light bands for Phase 2 table cells. MI thresholds follow GRAD-AI (2025);
 * CC and cognitive bands follow common SonarSource-style guidance and the project’s
 * Tampere / verification-gap framing (see dashboard legend).
 */
export type Phase2Traffic = "green" | "yellow" | "red";

export function trafficForMiNorm(mi: number): Phase2Traffic {
  if (mi >= 85) return "green";
  if (mi >= 65) return "yellow";
  return "red";
}

/** Cyclomatic complexity: green ≤10, yellow 11–20, red ≥21 */
export function trafficForCyclomatic(cc: number): Phase2Traffic {
  if (cc <= 10) return "green";
  if (cc <= 20) return "yellow";
  return "red";
}

/** Cognitive complexity: green ≤8, yellow 9–15, red ≥16 */
export function trafficForCognitive(c: number): Phase2Traffic {
  if (c <= 8) return "green";
  if (c <= 15) return "yellow";
  return "red";
}

const trafficBg: Record<Phase2Traffic, string> = {
  green: "bg-emerald-500/[0.13] dark:bg-emerald-500/[0.2]",
  yellow: "bg-amber-500/[0.14] dark:bg-amber-500/[0.22]",
  red: "bg-red-500/[0.12] dark:bg-red-500/[0.18]",
};

export function phase2TrafficCellClass(value: number | undefined, kind: "mi" | "cc" | "cognitive"): string {
  if (value === undefined || Number.isNaN(value)) {
    return "text-right tabular-nums";
  }
  const t =
    kind === "mi"
      ? trafficForMiNorm(value)
      : kind === "cc"
        ? trafficForCyclomatic(value)
        : trafficForCognitive(value);
  return cn("text-right tabular-nums", trafficBg[t]);
}
