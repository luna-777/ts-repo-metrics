"use client";

import type { SymbolRiskScatterPoint, VerificationLane } from "@/lib/symbolRiskViz";

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

interface SymbolRiskScatterProps {
  points: SymbolRiskScatterPoint[];
  maxComplexity: number;
}

export function SymbolRiskScatter({ points, maxComplexity }: SymbolRiskScatterProps) {
  const xMax = Math.max(8, maxComplexity, 1);
  const numLanes = LANES.length;
  const laneHeight = INNER_H / numLanes;
  const jitterScale = laneHeight * 0.38;

  const scaleX = (cx: number) => PAD.l + (cx / xMax) * INNER_W;

  /** Y for a point: lane band center + per-key jitter */
  const dotY = (p: SymbolRiskScatterPoint): number => {
    const i = laneIndex[p.lane];
    const base = PAD.t + (i + 0.5) * laneHeight;
    return base + jitter01(p.key) * jitterScale;
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3 overflow-x-auto space-y-3">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="max-w-full h-auto"
        role="img"
        aria-label="Cyclomatic complexity by test proximity band, with risk tier colors"
      >
        <text x={W / 2} y={20} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          Cyclomatic complexity vs test proximity (three bands)
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
          {Math.round(xMax)}
        </text>

        {points.map((p) => (
          <circle
            key={p.key}
            cx={scaleX(p.x)}
            cy={dotY(p)}
            r={4.5}
            fill={tierColor[p.tier]}
            opacity={0.88}
          >
            <title>
              {`${p.labelShort} — ${
                p.lane === "paired_only"
                  ? "paired test only"
                  : p.lane === "referenced"
                    ? "referenced"
                    : "no paired test"
              } — tier ${p.tier}`}
            </title>
          </circle>
        ))}
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
      </div>
    </div>
  );
}
