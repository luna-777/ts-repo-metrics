"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "../MetricCard";
import { VerificationLearningFooter } from "./VerificationLearningFooter";
import { VerificationLearningIntro } from "./VerificationLearningIntro";
import { VerificationTakeaways } from "./VerificationTakeaways";
import { RQ2Quadrant } from "./RQ2Quadrant";
import { SymbolRiskScatter } from "./SymbolRiskScatter";
import { SymbolRiskTable } from "./SymbolRiskTable";
import type { RepoReport } from "@/lib/reportTypes";
import { getRq2MetricValues } from "@/lib/rq2ScopeMetrics";
import { RQ1_SCOPE_TEAM, type Rq1ScopeId } from "@/lib/rq1ScopeMetrics";
import {
  RQ2PctCommitsTouchingTestsBody,
  RQ2RefactorCommitRatioBody,
  RQ2TestLocRatioBody,
  RQ3CyclomaticMaxBody,
  RQ3HighComplexityCountBody,
  RQ3LongFunctionCountBody,
} from "./metricHelpContent";
import { buildScatterPoints } from "@/lib/symbolRiskViz";
import { CoachExplainButton } from "@/components/chat/CoachExplainButton";
import { useCoachExplain } from "@/lib/repoCoachContext";
import { RQ2_EXPLAIN_PROXIMITY, RQ2_EXPLAIN_SAFETY_NETS } from "@/lib/rq2ExplainPrompts";

interface RQ2TabProps {
  report: RepoReport;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3);
}

function formatRatio(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatNumber(n);
}

export function RQ2Tab({ report }: RQ2TabProps) {
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
  const maxScatterComplexity = useMemo(() => {
    if (!symbolRiskRows?.length) return 10;
    return Math.max(10, ...symbolRiskRows.map((r) => r.cyclomaticComplexity));
  }, [symbolRiskRows]);

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
  const repoWideSmellTooltip =
    "Found by scanning the repository tree as one pass. The analyzer does not attribute these to individual authors, so the count does not change when you pick a teammate.";
  const emptyCatchTooltip =
    mv.mode === "contributor"
      ? `Catch clauses with empty body. ${repoWideSmellTooltip}`
      : `Catch clauses with empty body. ${locSnapshotTooltip}`;
  const consoleTooltip =
    mv.mode === "contributor"
      ? `console.log / warn / error calls. ${repoWideSmellTooltip}`
      : `console.log / warn / error calls. ${locSnapshotTooltip}`;
  const gitChurnTooltip =
    "Sum of lines added + deleted (git numstat) on paths in this author’s commits, split by test vs non-test file patterns—historical churn, not current tree size.";

  const sectionTitles =
    mv.mode === "team"
      ? { a: "Tests and safety nets", b: "Harder-to-review spots", c: "Risk vs tests at a glance" }
      : {
          a: `Tests and safety nets (${mv.contributorDisplayName ?? "contributor"})`,
          b: "Harder-to-review spots (whole repository)",
          c: "Risk vs tests at a glance (whole repository)",
        };

  return (
    <div className="space-y-8">
      <VerificationLearningIntro report={report} />
      {teamOnly ? <VerificationTakeaways report={report} /> : null}

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
              The first metrics in &quot;Tests and safety nets&quot; use per-author git churn (test vs
              non-test paths) for your selection. Complexity, hygiene counts, and the quadrant still
              describe the whole repository scan.
            </p>
            <p className="text-sm font-medium text-foreground max-w-3xl">
              Note: <strong>% commits touching tests</strong> and{" "}
              <strong>Refactor commit ratio</strong> are also computed for the selected author; empty catch
              and console counts stay repo-wide.
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
              <strong> Empty catch blocks</strong> and <strong>console log counts</strong> are always from the
              full repository scan—we do not split them by author.
            </p>
          </>
        )
      ) : null}

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold flex-1 min-w-0">{sectionTitles.a}</h2>
          <CoachExplainButton prompt={RQ2_EXPLAIN_SAFETY_NETS} send={coachExplain} />
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
          {mv.locSource === "profile" ? (
            <>
              Coverage and sizing use the analyzer&apos;s snapshot of the tree. Percentages that rely on
              git history follow the scope chosen above where available.
            </>
          ) : (
            <>
              Test/source churn and file counts below are from git history for the selected teammate
              (add + delete lines per path). Other cards in this section still use repo-wide scan data where
              noted.
            </>
          )}
        </p>
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
            label={mv.locSource === "gitChurn" ? "Source line churn (git)" : "Source LOC"}
            value={mv.sourceLoc}
            tooltip={
              mv.locSource === "gitChurn"
                ? `Non-test-path line churn (add + del). ${gitChurnTooltip}`
                : `Lines of code in non-test source files. ${locSnapshotTooltip}`
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
          <MetricCard
            {...cardProps}
            label={
              teamOnly ? "Empty catch blocks" : "Empty catch blocks (whole codebase)"
            }
            value={mv.emptyCatchBlocks}
            tooltip={emptyCatchTooltip}
          />
          <MetricCard
            {...cardProps}
            label={teamOnly ? "Console log count" : "Console log count (whole codebase)"}
            value={mv.consoleLogCount}
            tooltip={consoleTooltip}
          />
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
          <>
            <SymbolRiskScatter points={scatterPoints} maxComplexity={maxScatterComplexity} />
            <SymbolRiskTable rows={symbolRiskRows} />
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">{sectionTitles.b}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            {...cardProps}
            label="High complexity count"
            value={mv.highComplexityCount}
            tooltip={`Functions with complexity > 10. ${locSnapshotTooltip}`}
            metricHelp={{
              title: "High complexity function count",
              children: <RQ3HighComplexityCountBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Long function count"
            value={mv.longFunctionCount}
            tooltip={`Functions with more than 50 lines. ${locSnapshotTooltip}`}
            metricHelp={{
              title: "Long function count",
              children: <RQ3LongFunctionCountBody />,
            }}
          />
          <MetricCard
            {...cardProps}
            label="Max complexity"
            value={mv.maxComplexity}
            tooltip={`Largest per-function cyclomatic value. ${locSnapshotTooltip}`}
            metricHelp={{
              title: "Maximum cyclomatic complexity",
              children: <RQ3CyclomaticMaxBody />,
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">{sectionTitles.c}</h2>
        {!teamOnly ? (
          <p className="text-sm text-muted-foreground mb-3 max-w-3xl">
            Indices below combine repository-wide LOC and structural scan—all authors together.
          </p>
        ) : null}
        <RQ2Quadrant
          riskIndex={riskIndex}
          verificationIndex={verificationIndex}
          riskLabel={riskLabel}
          verificationLabel={verificationLabel}
        />
      </section>

      <VerificationLearningFooter />
    </div>
  );
}
