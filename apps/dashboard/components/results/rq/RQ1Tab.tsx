"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "../MetricCard";
import { BehavioralLearningFooter } from "./BehavioralLearningFooter";
import { BehavioralLearningIntro } from "./BehavioralLearningIntro";
import { BehavioralTakeaways } from "./BehavioralTakeaways";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRq1MetricValues, RQ1_SCOPE_TEAM, type Rq1ScopeId } from "@/lib/rq1ScopeMetrics";
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
  const contributors = useMemo(() => report.contributors ?? [], [report.contributors]);
  const [scopeId, setScopeId] = useState<Rq1ScopeId>(RQ1_SCOPE_TEAM);

  useEffect(() => {
    setScopeId(RQ1_SCOPE_TEAM);
  }, [report.analysis_timestamp, report.source?.commit]);

  const mv = useMemo(() => getRq1MetricValues(report, scopeId), [report, scopeId]);

  const gv2 = report.gitMetricsV2;

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

  const cardProps = { rq: "RQ1" as const, hideResearchBadge: true };
  const teamOnly = mv.mode === "team";

  const commitsPerWeekTooltip =
    mv.mode === "contributor"
      ? "Calculated only for the whole repository (recent 13-week window ÷ 13), not per author."
      : "Recent commits in the last 13 weeks ÷ 13.";

  const dupeFrameworkNoteTeam =
    "Metrics below use the full repository history. Duplication % and framework apply to the codebase as a whole, not per person.";
  const dupeFrameworkNoteContributor =
    "Git-derived numbers above reflect this author's commits where git could attribute them. Duplication % and framework still describe the entire repository together—they are not per-person scores.";

  const sectionTitle =
    mv.mode === "team"
      ? "Repository (whole team)"
      : `Contributor: ${mv.contributorDisplayName ?? "—"}`;

  const sectionLead = mv.mode === "team" ? dupeFrameworkNoteTeam : dupeFrameworkNoteContributor;

  return (
    <div className="space-y-8">
      <BehavioralLearningIntro report={report} />
      {teamOnly ? <BehavioralTakeaways report={report} /> : null}

      {contributors.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="rq1-scope" className="text-sm font-medium text-foreground">
              View metrics for
            </label>
            <select
              id="rq1-scope"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="min-w-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={RQ1_SCOPE_TEAM}>Whole repository (team)</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName || c.authorEmail || c.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold mb-4">{sectionTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-3xl">{sectionLead}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            {...cardProps}
            label="Total commits"
            value={mv.totalCommits}
            tooltip={
              mv.mode === "contributor"
                ? "Commits attributed to this author in parsed git history."
                : "All commits parsed from git history for this run"
            }
          />
          <MetricCard
            {...cardProps}
            label="Commits per week"
            value={mv.commitsPerWeek == null ? "—" : formatNumber(mv.commitsPerWeek)}
            tooltip={commitsPerWeekTooltip}
            metricHelp={{
              title: "Commits per week",
              children: <RQ1CommitsPerWeekBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Median commit size"
            value={formatNumber(mv.medianCommitSize)}
            tooltip="Median total lines changed (add + delete) per commit."
            metricHelp={{
              title: "Median commit size",
              children: <RQ1MedianCommitSizeBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Avg lines per commit"
            value={formatNumber(mv.avgLinesPerCommit)}
            tooltip="Mean total lines changed per commit."
            metricHelp={{
              title: "Average lines per commit",
              children: <RQ1AvgLinesPerCommitBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Large commit ratio (>500 LOC)"
            value={`${formatNumber(mv.largeCommitRatio)}%`}
            tooltip="Share of commits with total churn &gt; 500 lines."
            metricHelp={{
              title: "Large commit ratio (&gt;500 LOC)",
              children: <RQ1LargeCommitRatioBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Burst ratio"
            value={`${formatNumber(mv.burstRatio)}%`}
            tooltip="Share of commits that fall inside a burst cluster (≥3 commits within 30 min)."
            metricHelp={{
              title: "Burst ratio",
              children: <RQ1BurstRatioBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Commit entropy (std dev ms)"
            value={formatNumber(mv.entropy)}
            tooltip="Standard deviation of gaps between consecutive commits (milliseconds)."
            metricHelp={{
              title: "Commit timing variability",
              children: <RQ1EntropyBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Duplication %"
            value={`${formatNumber(mv.duplication)}%`}
            tooltip="Repository-wide duplicate-line share from jscpd (same scan as elsewhere in this app)."
            metricHelp={{
              title: "Duplication percentage",
              children: <RQ1DuplicationPercentBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Framework detected"
            value={mv.framework}
            tooltip="Primary framework signal from the analyzer"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 max-w-3xl">
          Duplication % and framework describe the entire codebase together—they are not separate
          scores per teammate.
        </p>
      </section>

      {contributors.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Contributors (git activity)</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-3xl">
            One row per commit author in parsed history. Line deltas come from git numstat where the
            analyzer had full history (local clone). Zipball / GitHub API modes may leave churn columns at
            zero while commit counts still reflect metadata.
          </p>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead className="text-right">Commits</TableHead>
                  <TableHead className="text-right">+Lines</TableHead>
                  <TableHead className="text-right">−Lines</TableHead>
                  <TableHead className="text-right">Median Δ / commit</TableHead>
                  <TableHead className="text-right">Burst %</TableHead>
                  <TableHead className="text-right">Test-touch %</TableHead>
                  <TableHead className="text-right">Refactor %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.displayName || c.authorEmail || c.id}</div>
                      <div className="text-muted-foreground text-xs font-mono truncate max-w-[220px]">
                        {c.authorEmail || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.commitCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.linesAdded}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.linesDeleted}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.commitStats.medianCommitSize)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.burstStats.burstRatio)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.testCoupling.pctCommitsTouchingTests)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.refactorBehavior.refactorCommitRatio)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold mb-4">Where changes cluster</h2>
        {!teamOnly ? (
          <p className="text-sm text-muted-foreground mb-2 max-w-3xl">
            Hotspots reflect <strong>full-repository</strong> history across all authors, not this
            person alone.
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground mb-4">
          Files that show up most in recent history. <strong>Modifications</strong> counts how often a
          file appears in commit file lists; <strong>lines changed</strong> is add + delete summed
          across commits. Clustered activity often marks integration hotspots worth coordinating on as
          a team.
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
      <BehavioralLearningFooter />
    </div>
  );
}
