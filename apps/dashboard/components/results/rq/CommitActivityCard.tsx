"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { RepoReport } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";
import { coreSignalTierMeta } from "./CoreSignalsPrimitives";

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

type CalendarInput = NonNullable<
  NonNullable<RepoReport["gitMetricsV2"]>["commitCalendar"]
>;

function resolveCalendar(report: RepoReport): CalendarInput | null {
  return report.gitMetricsV2?.commitCalendar ?? report.commitCalendar ?? null;
}

function isDisplayableCalendar(cal: CalendarInput | null | undefined): cal is CalendarInput {
  if (!cal?.grid?.length || !cal.columnWeekStarts?.length) return false;
  if (cal.grid.length !== 7) return false;
  const cols = cal.grid[0]?.length ?? 0;
  if (cols <= 0 || cal.columnWeekStarts.length !== cols) return false;
  return sumGrid(cal.grid) > 0;
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
  const rawCal = useMemo(() => resolveCalendar(report), [report]);
  const cal = useMemo(() => (isDisplayableCalendar(rawCal) ? rawCal : null), [rawCal]);
  const git = report.git;

  const visualization = useMemo(() => {
    if (!cal) return null;
    let maxC = 0;
    for (const row of cal.grid) {
      for (const c of row) {
        if (c > maxC) maxC = c;
      }
    }
    return {
      grid: cal.grid,
      columnWeekStarts: cal.columnWeekStarts,
      max: maxC,
      busiestWeekdayIndex: cal.busiestWeekdayIndex,
    };
  }, [cal]);

  const monthLabels = useMemo(
    () => (visualization ? monthTickLabels(visualization.columnWeekStarts) : []),
    [visualization],
  );

  const cols = visualization?.grid[0]?.length ?? 0;

  const footerLine = useMemo(() => {
    if (!visualization) return null;
    const cpw = git?.commitsPerWeek;
    const cpwStr =
      typeof cpw === "number" && cpw > 0 ? `${cpw.toFixed(1)} per week average` : null;
    const total = sumGrid(visualization.grid);
    const busy =
      visualization.busiestWeekdayIndex != null &&
      visualization.busiestWeekdayIndex >= 0 &&
      visualization.busiestWeekdayIndex < 7
        ? `Most active day: ${WEEKDAY_NAMES[visualization.busiestWeekdayIndex]}`
        : null;
    const parts = [`${total} commits in the last 12 months`, cpwStr, busy].filter(Boolean) as string[];
    return parts.join(" · ");
  }, [git?.commitsPerWeek, visualization]);

  const legendMax = Math.max(visualization?.max ?? 0, 1);
  const noDataBadgeClass = coreSignalTierMeta.no_data.badgeClass;

  return (
    <section aria-labelledby="commit-habits-commit-activity-heading" className="space-y-0">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/40 sm:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2
            id="commit-habits-commit-activity-heading"
            className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            Commit Activity
          </h2>
        </div>

        {!visualization ? (
          <div
            className="mt-6 rounded-lg border border-border/60 bg-muted/20 px-4 py-6 sm:px-5"
            role="status"
            aria-label="No commit activity data"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("shrink-0", noDataBadgeClass)}>
                {coreSignalTierMeta.no_data.label}
              </Badge>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              No commit timestamps are available for this analysis to build a day-by-week heatmap.
              Run analysis on a machine with local git access, or ensure GitHub API commit data was
              returned for this repository.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
              <div
                className={cn("inline-flex min-w-0 flex-col", GAP)}
                role="img"
                aria-label="Commit heatmap by day and week"
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
                        title={`${WEEKDAY_NAMES[d]} ${visualization.columnWeekStarts[w] ?? ""}: ${count} commit(s)`}
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

            {footerLine ? (
              <p className="mt-4 text-sm text-muted-foreground tabular-nums">{footerLine}</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
