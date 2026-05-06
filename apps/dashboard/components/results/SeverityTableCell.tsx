"use client";

import type { ReactNode } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  bandForJsxDepth,
  bandForNesting,
  bandForSloc,
  severityNumericCellClass,
} from "@/lib/severityTableCell";
import {
  trafficForCyclomatic,
  trafficForHalsteadVolume,
  trafficForCognitive,
  trafficForMiNorm,
} from "@/lib/phase2Traffic";

const MISSING_CLASS = "text-right tabular-nums";

type Base = { className?: string; children?: ReactNode; align?: "left" | "right" };

export type SeverityTableCellProps =
  | (Base & {
      variant: "phase2";
      kind: "mi" | "cc" | "cognitive";
      value: number | undefined | null;
    })
  | (Base & {
      variant: "halstead";
      value: number | undefined | null;
      mean: number;
      p90: number;
    })
  | (Base & { variant: "sloc"; value: number })
  | (Base & { variant: "jsxDepth"; value: number })
  | (Base & { variant: "cyclomatic"; value: number })
  | (Base & { variant: "nesting"; value: number });

function cellClassFor(props: SeverityTableCellProps): string {
  const align = props.align ?? "right";
  switch (props.variant) {
    case "phase2": {
      const v = props.value;
      if (v === undefined || v === null || Number.isNaN(v)) return MISSING_CLASS;
      const band =
        props.kind === "mi"
          ? trafficForMiNorm(v)
          : props.kind === "cc"
            ? trafficForCyclomatic(v)
            : trafficForCognitive(v);
      return severityNumericCellClass(band, align);
    }
    case "halstead": {
      const v = props.value;
      if (v === undefined || v === null || Number.isNaN(v)) return MISSING_CLASS;
      return severityNumericCellClass(trafficForHalsteadVolume(v, props.mean, props.p90), align);
    }
    case "sloc":
      return severityNumericCellClass(bandForSloc(props.value), align);
    case "jsxDepth":
      return severityNumericCellClass(bandForJsxDepth(props.value), align);
    case "cyclomatic":
      return severityNumericCellClass(trafficForCyclomatic(props.value), align);
    case "nesting":
      return severityNumericCellClass(bandForNesting(props.value), align);
    default:
      return MISSING_CLASS;
  }
}

function defaultContent(props: SeverityTableCellProps): ReactNode {
  switch (props.variant) {
    case "phase2": {
      const v = props.value;
      if (v === undefined || v === null || Number.isNaN(v)) return "—";
      return props.kind === "mi" ? v.toFixed(1) : String(v);
    }
    case "halstead": {
      const v = props.value;
      if (v === undefined || v === null || Number.isNaN(v)) return "—";
      return v.toFixed(1);
    }
    case "sloc":
      return props.value;
    case "jsxDepth":
    case "cyclomatic":
    case "nesting":
      return props.value;
    default:
      return null;
  }
}

/**
 * Unified numeric metric cell: same three-band backgrounds everywhere (Code Complexity, React oversized, hotspots).
 */
export function SeverityTableCell(props: SeverityTableCellProps) {
  const { className, children } = props;
  return (
    <TableCell className={cn(cellClassFor(props), className)}>
      {children ?? defaultContent(props)}
    </TableCell>
  );
}
