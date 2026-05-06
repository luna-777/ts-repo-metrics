"use client";

import { useEffect, useMemo, useState } from "react";
import {
  scatterComplexityDisplayMax,
  tierAction,
  type SymbolRiskScatterPoint,
  type VerificationLane,
} from "@/lib/symbolRiskViz";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const W = 560;
const H = 360;
const PAD = { l: 118, r: 20, t: 44, b: 44 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;

const LANES: { id: VerificationLane; label: string; sub: string }[] = [
  {
    id: "referenced",
    label: "Name in paired test",
    sub: "score 1.0",
  },
  {
    id: "paired_only",
    label: "Test file paired only",
    sub: "score 0.3",
  },
  {
    id: "none",
    label: "No paired test",
    sub: "score 0",
  },
];

/** Deterministic [-1, 1] from string for vertical jitter inside a lane. */
function jitter01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h % 2000) / 1000 - 1;
}

const tierColor: Record<SymbolRiskScatterPoint["tier"], string> = {
  critical: "var(--destructive)",
  high: "oklch(0.65 0.2 45)",
  medium: "oklch(0.75 0.15 85)",
  low: "oklch(0.55 0.12 145)",
};

const laneIndex: Record<VerificationLane, number> = {
  referenced: 0,
  paired_only: 1,
  none: 2,
};

function lanePlain(lane: VerificationLane): string {
  switch (lane) {
    case "referenced":
      return "Referenced in paired test";
    case "paired_only":
      return "Paired test file only";
    default:
      return "No paired test";
  }
}

function dotTooltipLines(p: SymbolRiskScatterPoint, xMax: number): string {
  const capNote =
    p.x > xMax ? "\nAxis capped — dot drawn at right edge; value shown here is exact." : "";
  return `${p.labelShort}\nCyclomatic complexity: ${p.x}${capNote}\nProximity: ${lanePlain(p.lane)}\nRisk tier: ${p.tier}\nTip: ${tierAction(p.tier)}`;
}

interface SymbolRiskScatterProps {
  points: SymbolRiskScatterPoint[];
}

export function SymbolRiskScatter({ points }: SymbolRiskScatterProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const xs = points.map((p) => p.x);
  const { xMax, capped } = scatterComplexityDisplayMax(xs);
  const numLanes = LANES.length;
  const laneHeight = INNER_H / numLanes;
  const jitterScale = laneHeight * 0.38;

  const scaleX = (cx: number) => PAD.l + (Math.min(cx, xMax) / xMax) * INNER_W;

  /** Y for a point: lane band center + per-key jitter */
  const dotY = (p: SymbolRiskScatterPoint): number => {
    const i = laneIndex[p.lane];
    const base = PAD.t + (i + 0.5) * laneHeight;
    return base + jitter01(p.key) * jitterScale;
  };

  const selectedPoint = useMemo(
    () => (selectedKey ? points.find((p) => p.key === selectedKey) ?? null : null),
    [points, selectedKey],
  );

  useEffect(() => {
    setSelectedKey(null);
  }, [points]);

  useEffect(() => {
    if (!selectedKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey]);

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-3 min-w-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full max-w-full"
        role="img"
        aria-label={
          capped
            ? "Functions plotted in three discrete test-proximity bands on Y (not a continuous scale); cyclomatic complexity on X; axis capped for readability—hover dots for exact complexity."
            : "Functions plotted in three discrete test-proximity bands on Y (not a continuous scale); cyclomatic complexity on X; dot colors show risk tier."
        }
      >
        {/* Alternating lane fills — Y axis is three discrete bands, not a continuous scale */}
        {LANES.map((_lane, i) => {
          const y0 = PAD.t + i * laneHeight;
          return (
            <rect
              key={`lane-bg-${i}`}
              x={PAD.l}
              y={y0}
              width={INNER_W}
              height={laneHeight}
              className={i % 2 === 0 ? "fill-muted/25" : "fill-muted/10"}
            />
          );
        })}

        <text x={W / 2} y={20} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          Cyclomatic complexity vs three test-proximity bands (not a 0–1 scale)
        </text>

        {/* Horizontal lane guides */}
        {LANES.map((lane, i) => {
          const y0 = PAD.t + i * laneHeight;
          const yMid = y0 + laneHeight / 2;
          return (
            <g key={lane.id}>
              {i > 0 ? (
                <line
                  x1={PAD.l}
                  y1={y0}
                  x2={PAD.l + INNER_W}
                  y2={y0}
                  className="stroke-border/70"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              ) : null}
              <text
                x={8}
                y={yMid + 4}
                className="fill-muted-foreground text-[9px] leading-tight"
              >
                <tspan x={8} dy="0">
                  {lane.label}
                </tspan>
                <tspan x={8} dy="11" className="text-muted-foreground/80">
                  {lane.sub}
                </tspan>
              </text>
            </g>
          );
        })}

        <line
          x1={PAD.l}
          y1={PAD.t + INNER_H}
          x2={PAD.l + INNER_W}
          y2={PAD.t + INNER_H}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={PAD.l}
          y1={PAD.t}
          x2={PAD.l}
          y2={PAD.t + INNER_H}
          className="stroke-border"
          strokeWidth={1}
        />

        <text
          x={PAD.l + INNER_W / 2}
          y={H - 10}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Cyclomatic complexity
        </text>
        <text x={PAD.l} y={PAD.t + INNER_H + 28} className="fill-muted-foreground text-[8px]">
          0
        </text>
        <text
          x={PAD.l + INNER_W - 8}
          y={PAD.t + INNER_H + 28}
          textAnchor="end"
          className="fill-muted-foreground text-[8px]"
        >
          {capped ? `${Math.round(xMax)}+` : Math.round(xMax)}
        </text>

        {points.map((p) => {
          const cx = scaleX(p.x);
          const cy = dotY(p);
          const isSel = selectedKey === p.key;
          const tip = dotTooltipLines(p, xMax);
          return (
            <Tooltip key={p.key} delayDuration={200}>
              <TooltipTrigger asChild>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSel ? 6 : 4.5}
                  fill={tierColor[p.tier]}
                  opacity={isSel ? 1 : 0.88}
                  stroke={isSel ? "oklch(0.85 0.02 260)" : "transparent"}
                  strokeWidth={isSel ? 2 : 0}
                  className="cursor-pointer outline-none focus-visible:stroke-[oklch(0.85_0.02_260)] focus-visible:stroke-2"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedKey((k) => (k === p.key ? null : p.key));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedKey((k) => (k === p.key ? null : p.key));
                    }
                  }}
                >
                  <title>{tip.replace(/\n/g, " — ")}</title>
                </circle>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs leading-snug">
                {tip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">Dot color = risk tier:</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: tierColor.critical }} />
          Critical
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: tierColor.high }} />
          High
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: tierColor.medium }} />
          Medium
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: tierColor.low }} />
          Low
        </span>
        {capped ? (
          <span className="w-full text-[10px] leading-snug sm:w-auto">
            Axis capped for readability; values above the scale sit on the right edge—hover or focus a dot for exact complexity.
          </span>
        ) : null}
      </div>

      {selectedPoint ? (
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-mono text-xs font-medium text-foreground" title={selectedPoint.labelShort}>
                {selectedPoint.labelShort}
              </p>
              <p className="text-xs text-muted-foreground">
                Cyclomatic <span className="tabular-nums text-foreground">{selectedPoint.x}</span>
                {" · "}
                {lanePlain(selectedPoint.lane)}
                {" · "}
                Tier <span className="capitalize text-foreground">{selectedPoint.tier}</span>
              </p>
              <p className="text-xs leading-snug text-muted-foreground">{tierAction(selectedPoint.tier)}</p>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setSelectedKey(null)}
            >
              Clear
            </button>
          </div>
        </div>
      ) : points.length > 0 ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Hover or focus a dot for a tooltip. Click or press Enter to pin details here (Esc clears).
        </p>
      ) : null}
    </div>
  );
}
