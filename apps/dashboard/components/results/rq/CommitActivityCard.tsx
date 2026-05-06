"use client";

import { useMemo } from "react";
import type { RepoReport } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** ~12 months at one column per week */
const DEMO_WEEKS = 52;

function utcMondayStart(tsMs: number): number {
  const d = new Date(tsMs);
  const day = d.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayOffset);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function isoDateUtc(tsMs: number): string {
  const d = new Date(tsMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoMonth(iso: string): number {
  const p = iso.slice(5, 7);
  const m = parseInt(p, 10);
  return Number.isFinite(m) ? m - 1 : 0;
}

function monthTickLabels(weekStarts: string[]): (string | null)[] {
  let prev: number | null = null;
  return weekStarts.map((iso) => {
    const m = parseIsoMonth(iso);
    if (prev === null || m !== prev) {
      prev = m;
      return MONTH_SHORT[m] ?? "";
    }
    return null;
  });
}

function sumGrid(grid: number[][]): number {
  let t = 0;
  for (const row of grid) {
    for (const c of row) t += c;
  }
  return t;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Deterministic demo heatmap when real git timestamps are missing (API / zipball).
 * Pattern varies slightly by report anchor.
 */
function buildDemoVisualization(anchor: string): {
  grid: number[][];
  columnWeekStarts: string[];
  max: number;
  busiestWeekdayIndex: number;
} {
  const seed = hashStr(anchor || "demo");
  const endMonday = utcMondayStart(Date.now());
  const startMonday = endMonday - (DEMO_WEEKS - 1) * 7 * MS_PER_DAY;

  const columnWeekStarts: string[] = [];
  for (let w = 0; w < DEMO_WEEKS; w++) {
    columnWeekStarts.push(isoDateUtc(startMonday + w * 7 * MS_PER_DAY));
  }

  const grid: number[][] = Array.from({ length: 7 }, () => Array(DEMO_WEEKS).fill(0));
  let max = 0;
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];

  for (let d = 0; d < 7; d++) {
    for (let w = 0; w < DEMO_WEEKS; w++) {
      const mix = (seed >> (w % 16)) ^ (d * 941 + w * 701);
      const wave = Math.sin((w + d * 0.7) * 0.85) * 2.5 + 2.5;
      const weekdayBias = d < 5 ? 1.35 : 0.4;
      const sprint = w >= DEMO_WEEKS - 12 ? 1.2 : 1;
      let v = Math.floor((wave * weekdayBias * sprint + (mix % 3)) * 0.6);
      v = Math.min(8, Math.max(0, v));
      grid[d]![w] = v;
      weekdayTotals[d] = (weekdayTotals[d] ?? 0) + v;
      if (v > max) max = v;
    }
  }

  let busiestWeekdayIndex = 0;
  let best = -1;
  for (let d = 0; d < 7; d++) {
    if (weekdayTotals[d]! > best) {
      best = weekdayTotals[d]!;
      busiestWeekdayIndex = d;
    }
  }

  return { grid, columnWeekStarts, max, busiestWeekdayIndex };
}

function heatClass(count: number, max: number): string {
  if (max <= 0 || count <= 0) {
    return "bg-muted/60 border border-border/50";
  }
  const ratio = count / max;
  if (ratio < 0.2) return "border border-green-900/40 bg-green-950/50";
  if (ratio < 0.4) return "border border-green-800/50 bg-green-800/50";
  if (ratio < 0.6) return "border border-green-600/60 bg-green-600/70";
  if (ratio < 0.85) return "border border-emerald-500/70 bg-emerald-500/80";
  return "border border-emerald-400 bg-emerald-400/90";
}

const LABEL_COL =
  "w-8 shrink-0 text-right text-xs text-muted-foreground sm:w-10 sm:text-sm";
const MONTH_W = "flex w-5 shrink-0 justify-center sm:w-6 md:w-7";
const CELL =
  "size-5 shrink-0 rounded-[4px] sm:size-6 md:size-7";
const GAP = "gap-1 sm:gap-1.5";

export function CommitActivityCard({ report }: { report: RepoReport }) {
  const cal = report.gitMetricsV2?.commitCalendar;
  const git = report.git;

  const anchor = `${report.source?.url ?? ""}|${report.source?.commit ?? ""}|${report.analysis_timestamp ?? ""}`;

  const visualization = useMemo(() => {
    const real =
      cal?.grid?.length === 7 &&
      cal.columnWeekStarts?.length &&
      cal.grid[0]?.length;

    if (real) {
      let maxC = 0;
      for (const row of cal!.grid) {
        for (const c of row) {
          if (c > maxC) maxC = c;
        }
      }
      return {
        mode: "real" as const,
        grid: cal!.grid,
        columnWeekStarts: cal!.columnWeekStarts,
        max: maxC,
        busiestWeekdayIndex: cal!.busiestWeekdayIndex,
      };
    }

    const demo = buildDemoVisualization(anchor);
    return {
      mode: "demo" as const,
      grid: demo.grid,
      columnWeekStarts: demo.columnWeekStarts,
      max: demo.max,
      busiestWeekdayIndex: demo.busiestWeekdayIndex,
    };
  }, [anchor, cal]);

  const monthLabels = useMemo(
    () => monthTickLabels(visualization.columnWeekStarts),
    [visualization.columnWeekStarts],
  );

  const cols = visualization.grid[0]?.length ?? 0;

  const { footerLine, secondaryLine } = useMemo(() => {
    const cpw = git?.commitsPerWeek;
    const cpwStr =
      typeof cpw === "number" && cpw > 0 ? `${cpw.toFixed(1)} per week average` : null;

    if (visualization.mode === "real") {
      const total = sumGrid(visualization.grid);
      const busy =
        visualization.busiestWeekdayIndex != null &&
        visualization.busiestWeekdayIndex >= 0 &&
        visualization.busiestWeekdayIndex < 7
          ? `Most active day: ${WEEKDAY_NAMES[visualization.busiestWeekdayIndex]}`
          : null;
      const parts = [`${total} commits in the last 12 months`, cpwStr, busy].filter(Boolean) as string[];
      return { footerLine: parts.join(" · "), secondaryLine: null as string | null };
    }

    const demoTotal = sumGrid(visualization.grid);
    const busy = `Most active day: ${WEEKDAY_NAMES[visualization.busiestWeekdayIndex]}`;
    const tc = git?.totalCommits ?? 0;
    const realParts = [`${tc} commits in parsed history`, cpwStr].filter(Boolean);
    return {
      footerLine: `${demoTotal} commits (example 12 months) · ${cpwStr ?? "—"} · ${busy}`,
      secondaryLine:
        realParts.length > 0
          ? `This repo: ${realParts.join(" · ")}. Heatmap above is illustrative—re-run with a full local git clone for real activity-by-day.`
          : "Heatmap above is illustrative—re-run with a full local git clone for real activity-by-day.",
    };
  }, [git?.commitsPerWeek, git?.totalCommits, visualization]);

  const legendMax = Math.max(visualization.max, 1);

  return (
    <section aria-labelledby="rq1-commit-activity-heading" className="space-y-0">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/40 sm:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2
            id="rq1-commit-activity-heading"
            className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            Commit Activity
          </h2>
          {visualization.mode === "demo" ? (
            <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
              Example visualization
            </p>
          ) : null}
        </div>

        {visualization.mode === "demo" ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Showing a representative activity pattern for layout preview. Your live cells appear when
            analysis includes commit timestamps from a local git history.
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          <div
            className={cn("inline-flex min-w-0 flex-col", GAP)}
            role="img"
            aria-label={
              visualization.mode === "real"
                ? "Commit heatmap by day and week"
                : "Example commit heatmap by day and week"
            }
          >
            <div className={cn("flex", GAP)}>
              <div className={cn(LABEL_COL, "shrink-0")} />
              {Array.from({ length: cols }, (_, w) => (
                <div key={`mh-${visualization.columnWeekStarts[w]}-${w}`} className={MONTH_W}>
                  <span className="text-xs font-medium leading-none text-muted-foreground sm:text-sm">
                    {monthLabels[w] ?? ""}
                  </span>
                </div>
              ))}
            </div>
            {WEEKDAY_LETTERS.map((letter, d) => (
              <div key={d} className={cn("flex", GAP)}>
                <div className={cn(LABEL_COL, "select-none")}>{letter}</div>
                {visualization.grid[d]!.map((count, w) => (
                  <div
                    key={`${d}-${w}`}
                    title={
                      visualization.mode === "real"
                        ? `${WEEKDAY_NAMES[d]} ${visualization.columnWeekStarts[w] ?? ""}: ${count} commit(s)`
                        : `Example: ${WEEKDAY_NAMES[d]} — ${count}`
                    }
                    className={cn(CELL, heatClass(count, visualization.max))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm",
          )}
        >
          <span>Less</span>
          <div className={cn("flex", GAP)}>
            {[0.1, 0.35, 0.55, 0.8, 1].map((t, i) => (
              <div
                key={i}
                className={cn(
                  "size-5 rounded-[3px] sm:size-6",
                  heatClass(Math.ceil(t * legendMax), legendMax),
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground tabular-nums">{footerLine}</p>
        {secondaryLine ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{secondaryLine}</p>
        ) : null}
      </div>
    </section>
  );
}
