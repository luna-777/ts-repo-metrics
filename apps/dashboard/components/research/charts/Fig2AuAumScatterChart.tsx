"use client";

import {
  CartesianGrid,
  Layer,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  useXAxisScale,
  useYAxisScale,
} from "recharts";
import { FIG2_MODEL } from "@/lib/research/paperChartData";
import { ChartContainer } from "@/components/ui/chart";

const scatter = FIG2_MODEL.scatter;
const band = FIG2_MODEL.bandSeries;
const bandHalf =
  band.length >= 2 ? Math.abs(band[1].au - band[0].au) / 2.15 : 0.035;

/**
 * Recharts 3 can render axes while Scatter/Line selectors stay empty (graphical tick path vs axis tick path).
 * Plot geometry with the official scale hooks so points, CI slabs, and the OLS line always align to the axes.
 */
function Fig2CustomPlot() {
  const xMap = useXAxisScale(0);
  const yMap = useYAxisScale(0);

  if (xMap == null || yMap == null) {
    return null;
  }

  const fitPoints = band
    .map((row) => {
      const x = xMap(row.au);
      const y = yMap(row.fit);
      return x != null && y != null && Number.isFinite(x) && Number.isFinite(y) ? `${x},${y}` : null;
    })
    .filter((s): s is string => s != null);

  return (
    <Layer>
      <g className="fig2-ci pointer-events-none">
        {band.map((row) => {
          const x1 = xMap(row.au - bandHalf);
          const x2 = xMap(row.au + bandHalf);
          const yLow = yMap(row.bandBase);
          const yHigh = yMap(row.bandBase + row.bandWidth);
          if (
            x1 == null ||
            x2 == null ||
            yLow == null ||
            yHigh == null ||
            ![x1, x2, yLow, yHigh].every((v) => Number.isFinite(v))
          ) {
            return null;
          }
          const left = Math.min(x1, x2);
          const width = Math.abs(x2 - x1);
          const top = Math.min(yLow, yHigh);
          const height = Math.abs(yHigh - yLow);
          return (
            <rect
              key={`ci-${row.au}`}
              x={left}
              y={top}
              width={width}
              height={height}
              fill="currentColor"
              className="text-indigo-500/[0.18] dark:text-indigo-400/25"
              stroke="none"
            />
          );
        })}
      </g>

      {fitPoints.length > 1 ? (
        <polyline
          className="pointer-events-none text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={fitPoints.join(" ")}
        />
      ) : null}

      <g className="pointer-events-none text-indigo-500 dark:text-indigo-300">
        {scatter.map((p, i) => {
          const cx = xMap(p.au);
          const cy = yMap(p.aum);
          if (cx == null || cy == null || !Number.isFinite(cx) || !Number.isFinite(cy)) {
            return null;
          }
          return (
            <circle
              key={`pt-${i}`}
              cx={cx}
              cy={cy}
              r={5}
              fill="currentColor"
              fillOpacity={0.58}
              stroke="currentColor"
              strokeOpacity={0.42}
              strokeWidth={1}
            />
          );
        })}
      </g>
    </Layer>
  );
}

export function Fig2AuAumScatterChart() {
  const config = {
    au: { label: "Overall AU", color: "var(--foreground)" },
    aum: { label: "Overall AUM", color: "var(--foreground)" },
  } satisfies import("@/components/ui/chart").ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="aspect-[5/4] min-h-[260px] w-full max-h-[460px] sm:min-h-[280px] md:aspect-[16/11] md:min-h-[300px]"
    >
      <ScatterChart data={scatter} margin={{ top: 12, right: 14, bottom: 32, left: 6 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/55" vertical={false} />
        <XAxis
          type="number"
          dataKey="au"
          domain={[1, 5]}
          scale="linear"
          tickCount={6}
          tickLine={false}
          axisLine={{ className: "stroke-border" }}
          label={{
            value: "Overall AU",
            position: "bottom",
            offset: 14,
            className: "fill-muted-foreground text-[11px]",
          }}
        />
        <YAxis
          type="number"
          dataKey="aum"
          domain={[1, 5]}
          scale="linear"
          tickCount={6}
          tickLine={false}
          axisLine={{ className: "stroke-border" }}
          label={{
            value: "Overall AUM",
            angle: -90,
            position: "insideLeft",
            offset: 4,
            className: "fill-muted-foreground text-[11px]",
          }}
          width={44}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value) => (typeof value === "number" ? value.toFixed(2) : String(value ?? ""))}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload as { au?: number } | undefined;
            const au = typeof row?.au === "number" ? row.au : NaN;
            return Number.isFinite(au) ? `AU ${au.toFixed(2)}` : "";
          }}
        />

        <Fig2CustomPlot />
      </ScatterChart>
    </ChartContainer>
  );
}
