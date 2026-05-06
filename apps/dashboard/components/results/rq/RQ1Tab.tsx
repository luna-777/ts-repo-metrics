"use client";

import { useEffect, useMemo, useState } from "react";
import { getRq1MetricValues, RQ1_SCOPE_TEAM, type Rq1ScopeId } from "@/lib/rq1ScopeMetrics";
import type { RepoReport } from "@/lib/reportTypes";
import { CommitActivityCard } from "./CommitActivityCard";
import { RQ1ChurnHotspotCards, RQ1ContributorsTableCard } from "./RQ1GitTables";
import { RQ1MomentumPanel } from "./RQ1MomentumPanel";
import {
  RQ1AdditionalSignalsSection,
  RQ1CoreSignalsSection,
  resolveRq1SignalQuality,
} from "./RQ1SignalSections";

interface RQ1TabProps {
  report: RepoReport;
}

export function RQ1Tab({ report }: RQ1TabProps) {
  const contributors = useMemo(() => report.contributors ?? [], [report.contributors]);
  const [scopeId, setScopeId] = useState<Rq1ScopeId>(RQ1_SCOPE_TEAM);

  useEffect(() => {
    setScopeId(RQ1_SCOPE_TEAM);
  }, [report.analysis_timestamp, report.source?.commit]);

  const mv = useMemo(() => getRq1MetricValues(report, scopeId), [report, scopeId]);
  const signalQuality = useMemo(() => resolveRq1SignalQuality(report), [report]);

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

  const teamOnly = mv.mode === "team";

  return (
    <div className="space-y-8">
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

      <RQ1CoreSignalsSection report={report} mv={mv} />
      <RQ1AdditionalSignalsSection mv={mv} quality={signalQuality} />

      <CommitActivityCard report={report} />

      {contributors.length > 0 ? (
        <section>
          <RQ1ContributorsTableCard contributors={contributors} />
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
        <RQ1ChurnHotspotCards churnMods={churnMods} churnLines={churnLines} />
      </section>

      <RQ1MomentumPanel />
    </div>
  );
}
