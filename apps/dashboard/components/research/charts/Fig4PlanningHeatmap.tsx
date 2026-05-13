"use client";

import type { CSSProperties } from "react";
import {
  PLANNING_CORREL_VARIABLE_DESCRIPTIONS,
  PLANNING_CORREL_VARIABLE_IDS,
  PLANNING_CORRELATION_DATA,
  PLANNING_CORRELATION_HIGHLIGHT_KEYS,
  PLANNING_HEATMAP_LABELS,
  planningCorrelationLegendHorizontalGradientCSS,
  planningCorrelationWarmColor,
} from "@/lib/research/paperChartData";

const LABELS = [...PLANNING_HEATMAP_LABELS];
const MAT = PLANNING_CORRELATION_DATA;

function describeCell(ri: number, cj: number, r: number): string {
  const ai = PLANNING_CORREL_VARIABLE_IDS[ri];
  const bj = PLANNING_CORREL_VARIABLE_IDS[cj];
  const ia = PLANNING_CORREL_VARIABLE_DESCRIPTIONS[ai];
  const ib = PLANNING_CORREL_VARIABLE_DESCRIPTIONS[bj];
  return `${ai} × ${bj} — Pearson r = ${r.toFixed(2)} (${ia}; ${ib})`;
}

export function Fig4PlanningHeatmap() {
  const n = MAT.length;
  const colTemplate = `minmax(3.85rem,0.92fr) repeat(${n}, minmax(2.65rem,1fr))`;

  return (
    <div className="min-w-0 space-y-3">
      <div className="overflow-x-auto rounded-lg border bg-card/60 p-2">
        <div className="grid gap-px" style={{ gridTemplateColumns: colTemplate }}>
          <div className="min-h-8 rounded-sm bg-transparent" aria-hidden />
          {LABELS.map((lbl, ci) => (
            <div
              key={`h-${lbl}-${ci}`}
              className="flex min-h-12 items-center justify-center rounded-sm border border-transparent bg-muted/30 px-0.5 text-center text-[0.625rem] leading-snug font-medium whitespace-pre-wrap text-muted-foreground"
            >
              {lbl}
            </div>
          ))}

          {LABELS.map((rowLbl, ri) => (
            <div key={`row-${ri}`} className="contents">
              <div className="flex items-center rounded-sm bg-muted/30 px-1.5 text-[0.625rem] leading-snug font-medium whitespace-pre-wrap text-muted-foreground">
                {rowLbl}
              </div>
              {Array.from({ length: n }).map((_, cj) => {
                const v = MAT[ri][cj];
                const { bg, useLightFg } = planningCorrelationWarmColor(v);
                const lo = Math.min(ri, cj);
                const hi = Math.max(ri, cj);
                const emphasized = PLANNING_CORRELATION_HIGHLIGHT_KEYS.has(`${lo}-${hi}`);

                const style: CSSProperties = { backgroundColor: bg };

                const textCls = [
                  useLightFg
                    ? "text-[oklch(0.99_0.02_97)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    : "text-foreground",
                  emphasized ? "font-semibold" : "font-normal",
                ].join(" ");

                const emphasizeCls = emphasized
                  ? "outline outline-[2px] -outline-offset-2 outline-primary/65 z-[1]"
                  : "";

                return (
                  <div
                    key={`c-${ri}-${cj}`}
                    title={describeCell(ri, cj, v)}
                    style={style}
                    className={`flex min-h-12 items-center justify-center rounded-sm border border-black/[0.08] px-0.5 text-center font-mono text-[0.7rem] tabular-nums dark:border-white/10 ${emphasizeCls} ${textCls}`}
                  >
                    {v.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 text-[0.625rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-[12rem] max-w-xl flex-wrap items-center gap-2 tabular-nums">
          <span className="shrink-0">Weaker association</span>
          <span className="relative h-3 min-w-[8rem] flex-1 overflow-hidden rounded-sm border border-border/70 shadow-inner">
            <span className="absolute inset-0" style={{ background: planningCorrelationLegendHorizontalGradientCSS() }} />
          </span>
          <span className="shrink-0">Stronger association</span>
        </span>
        <span className="text-[0.6rem] leading-snug sm:max-w-sm sm:text-end">
          Outlined cells echo narrative contrasts in the prose; shading follows the manuscript-style warm sequential scale.
        </span>
      </div>
    </div>
  );
}
