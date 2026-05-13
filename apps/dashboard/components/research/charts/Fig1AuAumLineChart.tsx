"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ErrorBar,
  LabelList,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  corrStarsFromP,
  FIG1_FRIEDMAN,
  FIG1_GAP_CHART_ROWS,
  FIG1_GAP_CLUSTER_INSIGHT,
  FIG1_GAP_CHART_TITLE,
  FIG1_GAP_FRIEDMAN,
  FIG1_GAP_THRESHOLD,
  FIG1_LINE_DATA,
  FIG1_Y_AXIS,
  type Fig1GapChartRow,
} from "@/lib/research/paperChartData";
import { ChartContainer } from "@/components/ui/chart";

const linedata = FIG1_LINE_DATA.map((d) => ({
  ...d,
  auErr: [d.auMean - d.auSe, d.auMean + d.auSe] as const,
  aumErr: [d.aumMean - d.aumSe, d.aumMean + d.aumSe] as const,
}));

type Datum = (typeof linedata)[number];

function LineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; name?: string; value?: unknown; payload?: Datum }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-semibold text-foreground">{row.stage}</p>
      <ul className="space-y-1.5 tabular-nums text-muted-foreground">
        <li>
          <strong style={{ color: "var(--color-au)" }}>AU:</strong> M = {row.auMean.toFixed(2)}, SD = {row.auSd},{" "}
          <span className="font-serif italic">N</span> = {row.auN}
        </li>
        <li>
          <strong style={{ color: "var(--color-aum)" }}>AUM:</strong> M = {row.aumMean.toFixed(2)}, SD = {row.aumSd},{" "}
          <span className="font-serif italic">N</span> = {row.aumN}
        </li>
      </ul>
    </div>
  );
}

function GapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Fig1GapChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p?.stage || p.gap == null) return null;
  const stars = corrStarsFromP(p.auAumP);

  return (
    <div className="max-w-[min(20rem,calc(100vw-3rem))] rounded-lg border border-border/70 bg-popover px-3 py-2.5 text-xs shadow-md">
      <p className="mb-2 font-semibold text-foreground">{p.stage}</p>
      <p className="mb-2 tabular-nums text-muted-foreground">
        Gap (AUM − AU) = <span className="font-mono text-foreground">{p.gap.toFixed(2)}</span>
        {" · "}
        <span className="text-foreground">{p.pctHigherVsAu}%</span> higher AUM vs AU score
      </p>
      <ul className="space-y-1 tabular-nums text-muted-foreground">
        <li>
          AU: M = <span className="text-foreground">{p.auMean.toFixed(2)}</span> · AUM: M ={" "}
          <span className="text-foreground">{p.aumMean.toFixed(2)}</span> ({p.calculation})
        </li>
        <li>
          Pearson AU–AUM{" "}
          <span className="font-serif italic">r</span> = {p.rAuAum.toFixed(3)}, <span className="font-serif italic">p</span>{" "}
          {p.auAumP === "<.001" ? (
            <>
              {"<"}
              {" "}
              .001
            </>
          ) : (
            "= " + p.auAumP.toFixed(3)
          )}
          {" "}
          ({stars}), <span className="font-serif italic">n</span> = {p.nAuAum}
        </li>
        <li className="leading-snug">{p.interpretation}</li>
      </ul>
    </div>
  );
}

function GapBarLabels(props: { x?: number; y?: number; width?: number; height?: number; index?: number }) {
  const { x: bx, y: by, width: bw, height: bh, index } = props;
  if (bx == null || by == null || bw == null || bh == null || index == null) return null;
  const row = FIG1_GAP_CHART_ROWS[index];
  if (!row) return null;
  const x0 = bx + bw + 6;
  const yMid = by + bh / 2;

  const rLab = corrStarsFromP(row.auAumP);

  return (
    <g className="recharts-cartesian-axis-tick-values">
      <text
        x={x0}
        y={yMid - 5}
        dominantBaseline="middle"
        className="fill-foreground text-[10px]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {row.gap.toFixed(2)} ({row.pctHigherVsAu}%)
      </text>
      <text
        x={x0}
        y={yMid + 10}
        dominantBaseline="middle"
        className="fill-muted-foreground text-[10px]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <tspan fontStyle="italic" className="font-serif">
          r
        </tspan>
        {" = "}
        {row.rAuAum.toFixed(2)} {rLab}
      </text>
    </g>
  );
}

export function Fig1AuAumLineChart() {
  const config = {
    au: {
      label: "AI usage (AU)",
      theme: {
        light: "#b45309",
        dark: "#fbbf24",
      },
    },
    aum: {
      label: "AI usage maturity (AUM)",
      theme: {
        light: "#1e40af",
        dark: "#93c5fd",
      },
    },
    gapHigh: {
      label: "High gap cluster",
      theme: {
        light: "#a5b4fc",
        dark: "#818cf8",
      },
    },
    gapLow: {
      label: "Low gap cluster",
      theme: {
        light: "#9ca3af",
        dark: "#6b7280",
      },
    },
  } satisfies import("@/components/ui/chart").ChartConfig;

  return (
    <div className="space-y-4">
      <div className="flex w-full min-w-0 flex-col gap-6">
        <ChartContainer
          config={config}
          className="aspect-[21/13] min-h-[280px] min-w-0 w-full [--recharts-rc-min-h:16rem] md:min-h-[320px] [&_.recharts-legend-wrapper]:pb-16"
        >
          <ComposedChart data={linedata} margin={{ top: 12, right: 18, bottom: 44, left: 6 }}>
            <defs>
              <linearGradient id="fig1-zone-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.94 0.03 248)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.98 0.01 248)" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="fig1-zone-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.85 0.035 278)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.92 0.02 278)" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <ReferenceArea x1="Planning" x2="Implementation" y1={FIG1_Y_AXIS.min} y2={FIG1_Y_AXIS.max} fill="url(#fig1-zone-high)" />
            <ReferenceArea x1="Testing" x2="Maintenance" y1={FIG1_Y_AXIS.min} y2={FIG1_Y_AXIS.max} fill="url(#fig1-zone-low)" />

            <CartesianGrid strokeDasharray="3 3" className="stroke-border/65" vertical={false} />
            <XAxis
              dataKey="stage"
              type="category"
              tickLine={false}
              axisLine={{ className: "stroke-border" }}
              angle={-34}
              textAnchor="end"
              interval={0}
              height={84}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[FIG1_Y_AXIS.min, FIG1_Y_AXIS.max]}
              ticks={[2.5, 3, 3.5, 4, 4.5]}
              tickLine={false}
              axisLine={{ className: "stroke-border" }}
              width={48}
              label={{
                value: FIG1_Y_AXIS.label,
                angle: -90,
                position: "insideLeft",
                offset: 2,
                className: "!fill-muted-foreground text-[0.6875rem]",
              }}
            />

            <ReferenceLine
              y={3}
              stroke="oklch(0.55 0.03 250 / 72%)"
              strokeDasharray="5 6"
              label={{
                value: "Likert midpoint (3.0)",
                position: "insideTopRight",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />

            <Tooltip content={<LineTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: "0.7rem", paddingBottom: "0.75rem" }} />

            <Line
              type="monotone"
              dataKey="auMean"
              name="AU — usage frequency"
              stroke="var(--color-au)"
              strokeWidth={2.75}
              dot={{ r: 4.5, fill: "var(--color-au)", strokeWidth: 1.75, stroke: "var(--card)" }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            >
              <ErrorBar dataKey="auErr" direction="y" width={11} stroke="var(--color-au)" strokeWidth={3} strokeOpacity={0.92} />
            </Line>
            <Line
              type="monotone"
              dataKey="aumMean"
              name="AUM — iterative maturity"
              stroke="var(--color-aum)"
              strokeWidth={2.75}
              dot={{ r: 4.5, fill: "var(--color-aum)", strokeWidth: 1.75, stroke: "var(--card)" }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            >
              <ErrorBar dataKey="aumErr" direction="y" width={11} stroke="var(--color-aum)" strokeWidth={3} strokeOpacity={0.92} />
            </Line>
          </ComposedChart>
        </ChartContainer>

        <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg border border-border/70 bg-muted/15 px-2 py-3 sm:px-3">
          <div>
            <p className="text-center text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">{FIG1_GAP_CHART_TITLE}</p>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center text-[0.62rem] leading-snug text-muted-foreground">
              <span className="inline-flex flex-wrap items-center justify-center gap-1 whitespace-nowrap text-indigo-600/95 dark:text-indigo-300">
                Higher maturity–usage gap
              </span>
              <span className="text-foreground/50" aria-hidden>
                {" "}
                → → →{" "}
              </span>
              <span className="whitespace-nowrap text-slate-600 dark:text-slate-400">Narrowing toward later phases</span>
            </p>
          </div>

          <ChartContainer
            config={config}
            className="aspect-auto min-h-[260px] w-full min-w-0 [--recharts-rc-min-h:15rem] max-h-[min(22rem,calc(100vw-8rem))] md:aspect-[24/11] md:min-h-[280px] [&_.recharts-cartesian-axis-tick_text]:text-[10px]"
          >
            <BarChart layout="vertical" data={[...FIG1_GAP_CHART_ROWS]} margin={{ top: 6, right: 128, left: 2, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/55" horizontal={false} />
              <XAxis type="number" domain={[0, 0.62]} tickLine={false} axisLine={{ className: "stroke-border" }} tickFormatter={(v) => Number(v).toFixed(2)} />
              <YAxis type="category" dataKey="stage" width={112} tickLine={false} axisLine={{ className: "stroke-border" }} tickMargin={6} />
              <Tooltip content={<GapTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.38)" }} />
              <ReferenceLine x={FIG1_GAP_THRESHOLD.value} stroke="oklch(0.52 0.05 278 / 0.88)" strokeWidth={2} strokeDasharray="4 6" />
              <Bar dataKey="gap" radius={[0, 5, 5, 0]} isAnimationActive={false} strokeWidth={1} stroke="oklch(0.42 0.02 278 / 0.22)" maxBarSize={24}>
                {FIG1_GAP_CHART_ROWS.map((row) => (
                  <Cell
                    key={row.stage}
                    fill={row.highGapCluster ? "var(--color-gapHigh)" : "var(--color-gapLow)"}
                    fillOpacity={row.highGapCluster ? 0.92 : 0.88}
                  />
                ))}
                <LabelList content={<GapBarLabels />} />
              </Bar>
            </BarChart>
          </ChartContainer>

          <div className="mx-auto flex flex-wrap justify-center gap-x-4 gap-y-1 px-2 text-[0.6rem] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-7 shrink-0 rounded bg-indigo-300 dark:bg-indigo-400 opacity-95" aria-hidden />
              Early cluster (plan–build)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-7 shrink-0 rounded bg-slate-400 dark:bg-slate-600 opacity-95" aria-hidden />
              Late cluster (release–maintain)
            </span>
          </div>

          <p className="px-1 text-center text-[0.6rem] leading-relaxed text-muted-foreground lg:px-0">
            <span className="font-medium text-foreground">Threshold</span> at {FIG1_GAP_THRESHOLD.value}: {FIG1_GAP_THRESHOLD.label}.
          </p>

          <p className="-mt-2 px-1 text-center text-[0.625rem] leading-relaxed text-muted-foreground lg:px-0">
            <span className="font-medium text-foreground">Friedman test (stage gaps):</span> χ² ({FIG1_GAP_FRIEDMAN.df}) = {FIG1_GAP_FRIEDMAN.chi2},{" "}
            <span className="font-serif italic">p</span> {"<"} .001; early-cycle gaps run ~2–4× larger than late-cycle (peak 0.54 vs 0.13).
          </p>

          <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">{FIG1_GAP_CLUSTER_INSIGHT}</p>
        </div>
      </div>

      <p className="-mt-1 px-2 text-center text-[0.65rem] leading-relaxed text-muted-foreground md:-mt-0">
        <span className="font-medium text-foreground">Friedman (complete-case subsamples):</span> AUM χ² ({FIG1_FRIEDMAN.aum.df}) = {FIG1_FRIEDMAN.aum.chi2},{" "}
        <span className="font-serif italic">p</span> {"<"} .001 (<span className="font-serif italic">N</span> = {FIG1_FRIEDMAN.aum.n}); AU χ² ({FIG1_FRIEDMAN.au.df}) ={" "}
        {FIG1_FRIEDMAN.au.chi2}, <span className="font-serif italic">p</span> = {FIG1_FRIEDMAN.au.p} (<span className="font-serif italic">N</span> = {FIG1_FRIEDMAN.au.n},{" "}
        n.s.)
      </p>

      <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground px-2 md:px-4">
        <span className="font-medium text-foreground">Interpretation:</span> light band — Planning through Implementation aligns with higher reported{" "}
        <span className="font-semibold text-[#1e40af] dark:text-blue-300">AUM</span>; darker band — Testing through Maintenance shows lower maturity while{" "}
        <span className="font-semibold text-[#b45309] dark:text-amber-300">AU</span> stays comparatively flat along the trajectory.
      </p>
    </div>
  );
}
