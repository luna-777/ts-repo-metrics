"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { StageAuAumCorrRow } from "@/lib/research/paperChartData";
import { STAGE_AU_AUM_CORR, auAumSignificantStrict } from "@/lib/research/paperChartData";

const barData = STAGE_AU_AUM_CORR.map((row: StageAuAumCorrRow) => ({
  stage: row.stage,
  stageShort:
    row.stage === "Planning"
      ? "Plan"
      : row.stage === "Implementation"
        ? "Impl"
        : row.stage.slice(0, 3),
  r: row.rAuAum,
  significant: auAumSignificantStrict(row.auAumP),
}));

export function Fig3StageCorrBarChart() {
  const config = {
    r: {
      label: "|r| AU–AUM",
      theme: {
        light: "oklch(0.35 0.05 277)",
        dark: "oklch(0.82 0.05 277)",
      },
    },
    rMuted: {
      label: "|r| (n.s.)",
      theme: {
        light: "oklch(0.76 0.02 260)",
        dark: "oklch(0.45 0.02 260)",
      },
    },
  } satisfies import("@/components/ui/chart").ChartConfig;

  return (
    <ChartContainer config={config} className="min-h-[260px] w-full sm:min-h-[280px]">
      <BarChart data={barData} margin={{ top: 8, right: 12, bottom: 8, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/55" horizontal vertical={false} />
        <XAxis dataKey="stageShort" tickLine={false} interval={0} axisLine={{ className: "stroke-border" }} height={54} />
        <YAxis
          domain={[0, 0.75]}
          tickLine={false}
          axisLine={{ className: "stroke-border" }}
          tickFormatter={(v) => Number(v).toFixed(2)}
          width={40}
        />
        <Tooltip
          formatter={(v) => (typeof v === "number" ? v.toFixed(3) : String(v ?? ""))}
          labelFormatter={(_, p) => String((p?.[0]?.payload as { stage?: string })?.stage ?? "")}
        />
        <Bar dataKey="r" name="|r|" fill="var(--color-r)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {barData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.significant ? "var(--color-r)" : "var(--color-rMuted)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
