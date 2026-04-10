"use client";

import { MetricCard } from "../MetricCard";
import { RQFramingHeader } from "./RQFramingHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RepoReport } from "@/lib/reportTypes";
import {
  RQ1AvgLinesPerCommitBody,
  RQ1BurstRatioBody,
  RQ1CommitsPerWeekBody,
  RQ1DuplicationPercentBody,
  RQ1EntropyBody,
  RQ1LargeCommitRatioBody,
  RQ1MedianCommitSizeBody,
} from "./metricHelpContent";

interface RQ1TabProps {
  report: RepoReport;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

export function RQ1Tab({ report }: RQ1TabProps) {
  const git = report.git;
  const gv2 = report.gitMetricsV2;

  const totalCommits = git?.totalCommits ?? 0;
  const commitsPerWeek = git?.commitsPerWeek ?? 0;
  const medianCommitSize = gv2?.commitStats?.medianCommitSize ?? git?.medianCommitSize ?? 0;
  const avgLinesPerCommit = git?.avgLinesPerCommit ?? 0;
  const largeCommitRatio = gv2?.commitStats?.pctOver500Loc ?? git?.largeCommitRatio ?? 0;
  /** Engine stores this as 0–100 (e.g. 60 = 60%). */
  const burstRatio = gv2?.burstStats?.burstRatio ?? 0;
  const entropy = gv2?.entropy?.stdDevTimeBetweenCommits ?? 0;
  const duplication = (report.duplication?.percentage ?? 0);
  const framework = report.framework?.type ?? "—";

  const churnMods = (gv2?.churn?.topByModifications ?? []) as Array<{
    file: string;
    modifications: number;
    linesChanged: number;
  }>;
  const churnLines = (gv2?.churn?.topByLinesChanged ?? []) as Array<{
    file: string;
    modifications: number;
    linesChanged: number;
  }>;

  return (
    <div className="space-y-8">
      <RQFramingHeader rq="RQ1" />
      <section>
        <h2 className="text-lg font-semibold mb-4">Development Workflow Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Total commits"
            value={totalCommits}
            rq="RQ1"
            tooltip="All commits parsed from git history for this run"
          />
          <MetricCard
            label="Commits per week"
            value={formatNumber(commitsPerWeek)}
            rq="RQ1"
            tooltip="Recent commits in the last 13 weeks ÷ 13."
            metricHelp={{
              title: "Commits per week",
              children: <RQ1CommitsPerWeekBody />,
            }}
          />
          <MetricCard
            label="Median commit size"
            value={formatNumber(medianCommitSize)}
            rq="RQ1"
            tooltip="Median total lines changed (add + delete) per commit."
            metricHelp={{
              title: "Median commit size",
              children: <RQ1MedianCommitSizeBody />,
            }}
          />
          <MetricCard
            label="Avg lines per commit"
            value={formatNumber(avgLinesPerCommit)}
            rq="RQ1"
            tooltip="Mean total lines changed per commit."
            metricHelp={{
              title: "Average lines per commit",
              children: <RQ1AvgLinesPerCommitBody />,
            }}
          />
          <MetricCard
            label="Large commit ratio (>500 LOC)"
            value={`${formatNumber(largeCommitRatio)}%`}
            rq="RQ1"
            tooltip="Share of commits with total churn &gt; 500 lines."
            metricHelp={{
              title: "Large commit ratio (&gt;500 LOC)",
              children: <RQ1LargeCommitRatioBody />,
            }}
          />
          <MetricCard
            label="Burst ratio"
            value={`${formatNumber(burstRatio)}%`}
            rq="RQ1"
            tooltip="Share of commits that fall inside a burst cluster (≥3 commits within 30 min)."
            metricHelp={{
              title: "Burst ratio",
              children: <RQ1BurstRatioBody />,
            }}
          />
          <MetricCard
            label="Commit entropy (std dev ms)"
            value={formatNumber(entropy)}
            rq="RQ1"
            tooltip="Standard deviation of gaps between consecutive commits (milliseconds)."
            metricHelp={{
              title: "Commit timing variability",
              children: <RQ1EntropyBody />,
            }}
          />
          <MetricCard
            label="Duplication %"
            value={`${formatNumber(duplication)}%`}
            rq="RQ1"
            tooltip="Same jscpd duplication % as RQ3 (cross-tab proxy)."
            metricHelp={{
              title: "Duplication percentage",
              children: <RQ1DuplicationPercentBody />,
            }}
          />
          <MetricCard
            label="Framework detected"
            value={framework}
            rq="RQ1"
            tooltip="Primary framework signal from the analyzer"
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4">Churn Concentration</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Top files by modification count and lines changed.{" "}
          <strong>Modifications</strong> is how often a file appears in commit file lists;{" "}
          <strong>lines changed</strong> is the sum of added + deleted lines across those commits.
          Concentrated churn may indicate integration style or hotspots.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-medium text-sm">
              Top by modifications
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Modifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churnMods.slice(0, 10).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]">
                      {c.file}
                    </TableCell>
                    <TableCell className="text-right">{c.modifications}</TableCell>
                  </TableRow>
                ))}
                {churnMods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No git history
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-medium text-sm">
              Top by lines changed
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Lines changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churnLines.slice(0, 10).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]">
                      {c.file}
                    </TableCell>
                    <TableCell className="text-right">{c.linesChanged}</TableCell>
                  </TableRow>
                ))}
                {churnLines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No git history
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 text-sm">
        <p className="text-blue-900 dark:text-blue-100">
          These metrics capture observable workflow behaviors that may shift
          under AI-assisted development (e.g., bursty integration, larger
          deltas, concentrated churn).
        </p>
        <p className="mt-2 text-blue-800 dark:text-blue-200 font-medium">
          RQ Mapping: RQ1
        </p>
      </div>
    </div>
  );
}
