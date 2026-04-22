/**
 * Extracts a compact, token-efficient text summary from a RepoReport for use
 * as AI chatbot context. Targets ~800 tokens max.
 */
import type { RepoReport } from "@/lib/reportTypes";

export function buildReportSummary(report: RepoReport): string {
  const lines: string[] = [];

  const repoUrl = report.source?.url ?? report.repoPath ?? "unknown";
  const commit = report.source?.commit?.slice(0, 7) ?? "unknown";
  lines.push(`REPO: ${repoUrl} (commit: ${commit})`);

  // Profile
  const p = report.profile;
  lines.push(
    `FILES: ${p.totalFiles} total | ${p.tsFiles} .ts | ${p.tsxFiles} .tsx | ${p.testFiles} test`,
  );
  lines.push(
    `LINES: ${p.totalLOC} total LOC | ${p.sourceLOC} source | ${p.testLOC} test`,
  );

  // Functions & complexity
  const fm = report.functionMetricsSummary;
  lines.push(
    `FUNCTIONS: ${fm.totalFunctions} total | avg length ${fm.averageLength.toFixed(1)} lines | max nesting ${fm.maxNestingDepth}`,
  );
  const cx = report.complexity;
  lines.push(
    `COMPLEXITY: avg ${cx.average.toFixed(2)} | max ${cx.max} | high-complexity functions: ${cx.highComplexityFunctions}`,
  );

  // Maintainability
  if (report.maintainability) {
    lines.push(
      `MAINTAINABILITY: score ${report.maintainability.score.toFixed(1)} (${report.maintainability.classification})`,
    );
  }

  // Test coverage proxy
  if (report.testCoverageProxy) {
    const tc = report.testCoverageProxy;
    lines.push(
      `TEST COVERAGE PROXY: ratio ${(tc.ratio * 100).toFixed(1)}% (${tc.classification})`,
    );
  }

  // Code smells
  const s = report.smells;
  lines.push(
    `CODE SMELLS: long functions ${s.longFunctions} | deep nesting ${s.deepNesting} | long param lists ${s.longParameterLists} | empty catch ${s.emptyCatchBlocks} | console.log ${s.consoleLogs}`,
  );

  // Duplication
  if (report.duplication) {
    const d = report.duplication;
    lines.push(
      `DUPLICATION: ${d.percentage.toFixed(1)}% duplicated lines | ${d.cloneClusters} clone clusters`,
    );
  }

  // Git metrics
  if (report.git) {
    const g = report.git;
    lines.push(
      `GIT: ${g.totalCommits} commits | median commit size ${g.medianCommitSize} lines | ${g.commitsPerWeek.toFixed(1)}/week | large commit ratio ${(g.largeCommitRatio * 100).toFixed(1)}%`,
    );
  }
  if (report.gitMetricsV2) {
    const gv2 = report.gitMetricsV2;
    lines.push(
      `GIT V2: refactor ratio ${(gv2.refactorBehavior.refactorCommitRatio * 100).toFixed(1)}% | test-coupling ${(gv2.testCoupling.pctCommitsTouchingTests * 100).toFixed(1)}% commits touch tests`,
    );
  }

  // Phase 3 (AI smells / pathology)
  if (report.phase3) {
    const ph3 = report.phase3;
    lines.push(
      `AI SMELLS: SFD (silent failure density) ${ph3.sfd.toFixed(4)} | SRS (structural redundancy) ${ph3.srs.toFixed(4)} | monolithic components ${ph3.monolithicComponentCount}`,
    );
  }

  // React metrics summary
  if (report.reactMetrics) {
    const rm = report.reactMetrics.summary;
    lines.push(
      `REACT: ${rm.componentsAnalyzed} components | lack-of-cohesion violations ${rm.ferreiraLackOfCohesionCount} | deep JSX violations ${rm.tampereJsxDepthExceededCount} | prop-drilling edges ${rm.totalPropDrillingEdges}`,
    );
  }

  // Top contributors (first 3)
  if (report.contributors && report.contributors.length > 0) {
    const top = report.contributors.slice(0, 3);
    const names = top
      .map((c) => `${c.displayName} (${c.commitCount} commits)`)
      .join(", ");
    lines.push(`TOP CONTRIBUTORS: ${names}`);
  }

  // Framework
  if (report.framework) {
    lines.push(
      `FRAMEWORK: ${report.framework.type} | React: ${report.framework.hasReact} | Backend: ${report.framework.hasBackend}`,
    );
  }

  return lines.join("\n");
}
