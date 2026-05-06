import { cn } from "@/lib/utils";

/**
 * Three-band severity for numeric table cells (unified across Code Complexity / React / hotspots).
 * Matches dashboard threshold calibration — tinted cell backgrounds + readable foreground.
 */
export type SeverityBand = "green" | "yellow" | "red";

/**
 * Solid-ish fills (dark theme leans red/amber/emerald-950) aligned with Code Complexity table styling.
 */
const SEVERITY_SURFACE: Record<SeverityBand, string> = {
  green:
    "bg-emerald-600/[0.14] text-foreground dark:bg-emerald-950/45 dark:text-emerald-50/95",
  yellow:
    "bg-amber-600/[0.16] text-foreground dark:bg-amber-950/50 dark:text-amber-50/95",
  red: "bg-red-700/[0.22] text-foreground dark:bg-red-950/55 dark:text-red-50",
};

/**
 * Full `TableCell` className for a severity band.
 * @param align — metric columns are usually `right` (default); line counts may be `left`.
 */
export function severityNumericCellClass(
  band: SeverityBand | null | undefined,
  align: "left" | "right" = "right",
): string {
  const alignCls = align === "right" ? "text-right" : "text-left";
  if (band == null) {
    return cn("tabular-nums text-muted-foreground", alignCls);
  }
  return cn("font-medium tabular-nums", alignCls, SEVERITY_SURFACE[band]);
}

/** SLOC: >200 red, >100 yellow (oversized components). */
export function bandForSloc(lines: number): SeverityBand {
  if (lines > 200) return "red";
  if (lines > 100) return "yellow";
  return "green";
}

/**
 * JSX nesting depth: ≥7 red, ≥5 yellow (lines up with depth “hot” thresholds in the product).
 */
export function bandForJsxDepth(depth: number): SeverityBand {
  if (depth >= 7) return "red";
  if (depth >= 5) return "yellow";
  return "green";
}

/** Max nesting (file/function): ≥6 red, ≥4 yellow. */
export function bandForNesting(n: number): SeverityBand {
  if (n >= 6) return "red";
  if (n >= 4) return "yellow";
  return "green";
}
