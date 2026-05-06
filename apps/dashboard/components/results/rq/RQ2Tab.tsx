"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "../MetricCard";
import { RQ2Quadrant } from "./RQ2Quadrant";
import { SymbolRiskProximityFullPageDialog } from "./SymbolRiskProximityFullPageDialog";
import { SymbolRiskScatter } from "./SymbolRiskScatter";
import type { RepoReport } from "@/lib/reportTypes";
import { getRq2MetricValues } from "@/lib/rq2ScopeMetrics";
import { RQ1_SCOPE_TEAM, type Rq1ScopeId } from "@/lib/rq1ScopeMetrics";
import {
  RQ2PctCommitsTouchingTestsBody,
  RQ2RefactorCommitRatioBody,
  RQ2SymbolProximityScanBody,
  RQ2TestCoverageProxyBody,
  RQ2TestLocRatioBody,
} from "./metricHelpContent";
import { buildScatterPoints } from "@/lib/symbolRiskViz";
import { CoachExplainButton } from "@/components/chat/CoachExplainButton";
import { useCoachExplain } from "@/lib/repoCoachContext";
import { RQ2_EXPLAIN_PROXIMITY, RQ2_EXPLAIN_SAFETY_NETS } from "@/lib/rq2ExplainPrompts";
import { RQ2CoreSignalsSection } from "./RQ2CoreSignalsSection";
import { RQ2TestingImprovementSection } from "./RQ2TestingImprovementSection";

interface RQ2TabProps {
  report: RepoReport;
  /** Switch parent results tabs to Code Quality (cyclomatic / structural metrics). */
  onOpenCodeQualityTab?: () => void;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3);
}

function formatRatio(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatNumber(n);
}

function capitalizeWord(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function RQ2Tab({ report, onOpenCodeQualityTab }: RQ2TabProps) {
  const coachExplain = useCoachExplain();

  const contributors = useMemo(() => report.contributors ?? [], [report.contributors]);
  const [scopeId, setScopeId] = useState<Rq1ScopeId>(RQ1_SCOPE_TEAM);

  useEffect(() => {
    setScopeId(RQ1_SCOPE_TEAM);
  }, [report.analysis_timestamp, report.source?.commit]);

  const mv = useMemo(() => getRq2MetricValues(report, scopeId), [report, scopeId]);

  const symbolRiskRows = report.symbolVerificationRisks;
  const scatterPoints = useMemo(
    () => (symbolRiskRows?.length ? buildScatterPoints(symbolRiskRows) : []),
    [symbolRiskRows],
  );

  const symbolProximitySummary = useMemo(() => {
    const rows = report.symbolVerificationRisks;
    if (!rows?.length) return null;
    let referencedInTest = 0;
    let pairedFileOnly = 0;
    let none = 0;
    for (const r of rows) {
      if (r.evidence === "referenced_in_test") referencedInTest++;
      else if (r.evidence === "paired_file_only") pairedFileOnly++;
      else none++;
    }
    const withSignal = referencedInTest + pairedFileOnly;
    return { total: rows.length, referencedInTest, pairedFileOnly, none, withSignal };
  }, [report.symbolVerificationRisks]);

  const complexity = report.complexity;
  const smells = report.smells;
  const profile = report.profile;
  const testLocRatioForQuadrant =
    profile && profile.sourceLOC > 0 ? profile.testLOC / profile.sourceLOC : 0;

  const { riskIndex, verificationIndex, riskLabel, verificationLabel } = useMemo(() => {
    const highComplexityCount = complexity?.highComplexityFunctions ?? 0;
    const longFunctionCount = smells?.longFunctions ?? 0;
    const riskRaw = highComplexityCount + longFunctionCount;
    const riskIndex = Math.min(1, riskRaw / 20);
    const verificationIndex = Math.min(1, testLocRatioForQuadrant * 5);
    const riskLabel: "Low" | "High" = riskRaw >= 10 ? "High" : "Low";
    const verificationLabel: "Low" | "High" = testLocRatioForQuadrant >= 0.1 ? "High" : "Low";
    return {
      riskIndex,
      verificationIndex,
      riskLabel,
      verificationLabel,
    };
  }, [complexity?.highComplexityFunctions, smells?.longFunctions, testLocRatioForQuadrant]);

  const cardProps = { rq: "RQ2" as const, hideResearchBadge: true };
  const teamOnly = mv.mode === "team";

  const pctTestTooltip =
    mv.mode === "contributor"
      ? "Among this author's commits, the fraction that touches at least one path detected as a test file."
      : "Commits where any changed path is a test file.";
  const refactorTooltip =
    mv.mode === "contributor"
      ? "Among this author's commits, the fraction whose subjects match refactor-style keywords."
      : "Commits whose subject matches refactor-style keywords.";
  const locSnapshotTooltip =
    "Counted across the entire repository snapshot (not split by contributor).";
  const gitChurnTooltip =
    "Sum of lines added + deleted (git numstat) on paths in this author’s commits, split by test vs non-test file patterns—historical churn, not current tree size.";

  const safetyNetsSectionTitle = useMemo(() => {
    const fromGitHistory = mv.locSource === "gitChurn";
    const label = fromGitHistory ? "Git-based test signals" : "Other Signals";
    if (mv.mode === "team") return label;
    return `${label} (${mv.contributorDisplayName ?? "contributor"})`;
  }, [mv.contributorDisplayName, mv.locSource, mv.mode]);

  const riskProfileTitle =
    mv.mode === "team" ? "Your risk profile" : "Your risk profile (whole repository)";

  return (
    <div className="space-y-8">
      {contributors.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="rq2-scope" className="text-sm font-medium text-foreground">
              View metrics for
            </label>
            <select
              id="rq2-scope"
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

      {!teamOnly ? (
        mv.locSource === "gitChurn" ? (
          <>
            <p className="text-sm text-muted-foreground max-w-3xl">
              The first metrics in this section use per-author git churn (test vs
              non-test paths) for your selection. Complexity and the quadrant still describe the whole
              repository scan.
            </p>
            <p className="text-sm font-medium text-foreground max-w-3xl">
              Note: <strong>% commits touching tests</strong> and{" "}
              <strong>Refactor commit ratio</strong> are also computed for the selected author.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Per-author test vs source churn needs a full <code className="text-xs">git log --numstat</code>{" "}
              run (same pipeline as extended git metrics). This report used commit metadata only—test/source
              size below is the analyzer&apos;s snapshot of the repo (same figures for everyone), not churn
              for one person.
            </p>
            <p className="text-sm font-medium text-foreground max-w-3xl">
              Note: <strong>% commits touching tests</strong> and{" "}
              <strong>Refactor commit ratio</strong> still reflect the selected teammate on this analysis.
            </p>
          </>
        )
      ) : null}

      <RQ2CoreSignalsSection mv={mv} report={report} />

      <section id="rq2-safety-nets">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold flex-1 min-w-0">{safetyNetsSectionTitle}</h2>
          <CoachExplainButton prompt={RQ2_EXPLAIN_SAFETY_NETS} send={coachExplain} />
        </div>
        {mv.locSource === "gitChurn" ? (
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            Test/source churn and file counts below are from git history for the selected teammate (add +
            delete lines per path). Other cards in this section still use repo-wide scan data where noted.
          </p>
        ) : null}
        <div key={`rq2-primary-${scopeId}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            {...cardProps}
            label={mv.locSource === "gitChurn" ? "Test line churn (git)" : "Test LOC"}
            value={mv.testLoc}
            tooltip={
              mv.locSource === "gitChurn"
                ? `Test-path line churn (add + del). ${gitChurnTooltip}`
                : `Lines of code in test files (*.test / *.spec). ${locSnapshotTooltip}`
            }
          />
          <MetricCard
            {...cardProps}
            label={mv.locSource === "gitChurn" ? "Test churn / source churn" : "Test LOC ratio"}
            value={formatRatio(mv.testLocRatio)}
            tooltip={
              mv.locSource === "gitChurn"
                ? `test line churn divided by source line churn for this author. If source churn is 0 but test churn exists, ratio is shown as 0 (no comparable denominator). ${gitChurnTooltip}`
                : `testLOC ÷ sourceLOC. ${locSnapshotTooltip}`
            }
            metricHelp={
              mv.locSource === "profile"
                ? {
                    title: "Test LOC ratio",
                    children: <RQ2TestLocRatioBody />,
                  }
                : undefined
            }
          />
          <MetricCard
            {...cardProps}
            label={mv.locSource === "gitChurn" ? "Test files touched" : "Test files"}
            value={mv.testFiles}
            tooltip={
              mv.locSource === "gitChurn"
                ? `Distinct paths matching the test file pattern in this author’s commits. ${gitChurnTooltip}`
                : `Files matching *.test.ts, *.spec.ts, etc. ${locSnapshotTooltip}`
            }
          />
          {mv.sourceFilesTouched != null ? (
            <MetricCard
              {...cardProps}
              label="Source files touched"
              value={mv.sourceFilesTouched}
              tooltip={`Distinct non-test paths in this author’s commits. ${gitChurnTooltip}`}
            />
          ) : null}
          <MetricCard
            {...cardProps}
            label="% commits touching tests"
            value={`${formatNumber(mv.pctCommitsTouchingTests)}%`}
            tooltip={pctTestTooltip}
            metricHelp={{
              title: "Percent of commits touching tests",
              children: <RQ2PctCommitsTouchingTestsBody />,
            }}
          />
          {report.testCoverageProxy ? (
            <MetricCard
              {...cardProps}
              label="Test coverage proxy (snapshot)"
              value={`${formatNumber(report.testCoverageProxy.ratio * 100)}% · ${capitalizeWord(report.testCoverageProxy.classification)}`}
              tooltip={`Static test LOC ÷ source LOC on the full tree, bucketed low (&lt;10%), moderate (10–30%), high (&gt;30%). Same snapshot for every scope—not author churn. ${locSnapshotTooltip}`}
              metricHelp={{
                title: "Test coverage proxy",
                children: <RQ2TestCoverageProxyBody />,
              }}
            />
          ) : null}
          {symbolProximitySummary ? (
            <MetricCard
              {...cardProps}
              label="Functions with static test link"
              value={`${symbolProximitySummary.withSignal} / ${symbolProximitySummary.total}`}
              tooltip={`Whole-repository symbol scan (same rows as the scatter/table below). Referenced in paired test: ${symbolProximitySummary.referencedInTest}. Paired file only: ${symbolProximitySummary.pairedFileOnly}. No static link: ${symbolProximitySummary.none}.`}
              metricHelp={{
                title: "Static test linkage (summary)",
                children: <RQ2SymbolProximityScanBody />,
              }}
            />
          ) : null}
          <MetricCard
            {...cardProps}
            label="Refactor commit ratio"
            value={`${formatNumber(mv.refactorCommitRatio)}%`}
            tooltip={refactorTooltip}
            metricHelp={{
              title: "Refactor commit ratio",
              children: <RQ2RefactorCommitRatioBody />,
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold flex-1 min-w-0">
            Complexity versus test proximity
          </h2>
          <CoachExplainButton prompt={RQ2_EXPLAIN_PROXIMITY} send={coachExplain} />
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Each dot is one function: <strong>X</strong> is cyclomatic complexity. Rows are{" "}
          <strong>three discrete bands</strong> (no paired test file → paired file only → function name seen
          in paired test)—not a smooth 0–1 axis. Dot <strong>color</strong> is{" "}
          <strong>risk tier</strong> from complexity × proximity. That is{" "}
          <strong>not line coverage</strong>. Cursor/IDE audit logs about AI edits are not incorporated in
          this release.
        </p>
        {symbolRiskRows === undefined ? (
          <p className="text-sm text-muted-foreground border rounded-md px-4 py-3 bg-muted/30">
            Re-run analysis with the current analyzer to populate this view (cached reports may omit
            symbol-level rows).
          </p>
        ) : symbolRiskRows.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-md px-4 py-3 bg-muted/30">
            No matching rows (no qualifying functions or no paired-test layout found).
          </p>
        ) : (
          <div className="space-y-4">
            <SymbolRiskScatter points={scatterPoints} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SymbolRiskProximityFullPageDialog
                rows={symbolRiskRows}
                instanceKey={`${report.analysis_timestamp ?? ""}-${scopeId}-${symbolRiskRows.length}`}
              />
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground max-w-3xl">
          Repo-wide <strong>high complexity</strong>, <strong>long function</strong>, and{" "}
          <strong>max cyclomatic</strong> counts are on the{" "}
          <span className="font-medium text-foreground">Code Quality</span> tab (Structural complexity).
        </p>
      </section>

      <section>
        <RQ2Quadrant
          sectionTitle={riskProfileTitle}
          riskIndex={riskIndex}
          verificationIndex={verificationIndex}
          riskLabel={riskLabel}
          verificationLabel={verificationLabel}
          wholeRepositoryNote={!teamOnly}
        />
      </section>

      <RQ2TestingImprovementSection onOpenCodeQualityTab={onOpenCodeQualityTab} />
    </div>
  );
}
