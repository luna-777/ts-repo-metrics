import type { RepoReport } from "@/lib/reportTypes";
import type { CommitHabitsTier } from "@/lib/commitHabitsScore";
import { computeCommitHabitsScore } from "@/lib/commitHabitsScore";
import { hasReactUiScope } from "@/lib/hasReactUiScope";
import { tryGetPhase2Summary } from "@/lib/phase2Summary";
import { healthTierFromScore } from "@/lib/healthTier";
import { RESULTS_TAB, panelScrollIdForCoachTab } from "@/lib/resultsNavigation";
import type { CoachSaysPayload, CoachSaysPriorityTab } from "./coachSaysTypes";

function roundScore(x: number): number {
  return Math.round(Math.max(0, Math.min(100, x)));
}

/** Higher = healthier testing practices (heuristic 0–100). */
export function computeTestingScore(report: RepoReport): number {
  const pct = report.gitMetricsV2?.testCoupling?.pctCommitsTouchingTests ?? 0;
  const profile = report.profile;
  const testLocRatio =
    profile && profile.sourceLOC > 0 ? profile.testLOC / profile.sourceLOC : 0;
  const testFiles = profile?.testFiles ?? 0;

  let s = 35;
  s += Math.min(45, pct * 1.2);
  s += Math.min(25, testLocRatio * 120);
  if (testFiles === 0) s -= 12;
  return roundScore(s);
}

/** Higher = healthier structural snapshot (heuristic 0–100). */
export function computeCodeQualityScore(report: RepoReport): number {
  const maint = report.maintainability?.score ?? null;
  const base = maint != null ? maint : 52;
  const highCx = report.complexity?.highComplexityFunctions ?? 0;
  const dup = report.duplication?.percentage ?? 0;
  let s = base - Math.min(28, highCx * 0.9) - Math.min(18, dup * 0.35);
  return roundScore(s);
}

/** Higher = healthier React surface when TSX exists (heuristic 0–100). */
export function computeReactHealthScore(report: RepoReport): number | null {
  const rm = report.reactMetrics?.summary;
  if (!rm || rm.componentsAnalyzed <= 0) return null;
  const depthIssues = rm.tampereJsxDepthExceededCount;
  const cohesionIssues = rm.ferreiraLackOfCohesionCount;
  let s = 78 - Math.min(35, depthIssues * 4) - Math.min(25, cohesionIssues * 3);
  return roundScore(s);
}

function computeCodeComplexityHealthScore(facts: {
  phase2: { miNormMean: number; functionsWithPhase2: number } | null;
}): number {
  if (!facts.phase2 || facts.phase2.functionsWithPhase2 <= 0) {
    return 50;
  }
  return roundScore(facts.phase2.miNormMean * 1.1);
}

function computeCodeRisksHealthScore(facts: {
  phase3: { silentFailureCount: number; sfd: number | null } | null;
}): number {
  if (!facts.phase3) return 72;
  const sf = facts.phase3.silentFailureCount;
  return roundScore(100 - Math.min(80, sf * 15 + (facts.phase3.sfd ?? 0) * 12));
}

export interface CoachSaysFacts {
  commitSha: string;
  repoUrl: string;
  reactUiScope: boolean;
  allowedPriorityTabs: CoachSaysPriorityTab[];
  commitHabits: {
    score: number;
    tier: CommitHabitsTier;
    headline: string;
    totalCommits: number;
    commitsPerWeek: number;
    worstDriverLabel: string;
    worstDriverScore: number;
  };
  testing: {
    score: number;
    pctCommitsTouchingTests: number;
    testFiles: number;
    testLocRatio: number;
    testCoverageClassification: string | null;
  };
  codeQuality: {
    score: number;
    maintainabilityScore: number | null;
    maintainabilityClassification: string | null;
    highComplexityFunctions: number;
    maxComplexity: number;
    duplicationPct: number;
  };
  react: {
    enabled: boolean;
    componentsAnalyzed: number;
    jsxDepthExceededCount: number;
    lackOfCohesionCount: number;
    score: number | null;
  };
  phase2: {
    miNormMean: number;
    functionsWithPhase2: number;
  } | null;
  phase3: {
    silentFailureCount: number;
    sfd: number | null;
  } | null;
}

export function allowedCoachPriorityTabs(report: RepoReport): CoachSaysPriorityTab[] {
  const tabs: CoachSaysPriorityTab[] = [
    RESULTS_TAB.commitHabits,
    RESULTS_TAB.testing,
    RESULTS_TAB.codeQuality,
  ];
  if (hasReactUiScope(report)) {
    tabs.push(RESULTS_TAB.reactComponents);
  }
  tabs.push(
    RESULTS_TAB.codeComplexity,
    RESULTS_TAB.codeRisks,
    RESULTS_TAB.aiUsage,
  );
  return tabs;
}

export function footerLabelForCoachTab(tab: CoachSaysPriorityTab): string {
  const footerForTab: Record<CoachSaysPriorityTab, string> = {
    [RESULTS_TAB.commitHabits]: "+ See full Commit Habits breakdown",
    [RESULTS_TAB.testing]: "+ See full Testing breakdown",
    [RESULTS_TAB.codeQuality]: "+ See full Code Quality breakdown",
    [RESULTS_TAB.reactComponents]: "+ See full React Components breakdown",
    [RESULTS_TAB.codeComplexity]: "+ See full Code Complexity breakdown",
    [RESULTS_TAB.codeRisks]: "+ See full Code Risks breakdown",
    [RESULTS_TAB.aiUsage]: "+ Open AI Usage tab",
  };
  return footerForTab[tab];
}

/** Maps coach navigation targets to scrollable panel ids in {@link ResultsDashboard}. */
export function scrollElementIdForCoachTab(tab: CoachSaysPriorityTab): string {
  return panelScrollIdForCoachTab(tab);
}

/** Tier for the tab the coach recommends focusing on — drives amber vs red on the opportunity panel. */
export function healthTierForCoachPriorityTab(
  facts: CoachSaysFacts,
  tab: CoachSaysPriorityTab,
): CommitHabitsTier {
  switch (tab) {
    case RESULTS_TAB.commitHabits:
      return facts.commitHabits.tier;
    case RESULTS_TAB.testing:
      return healthTierFromScore(facts.testing.score);
    case RESULTS_TAB.codeQuality:
      return healthTierFromScore(facts.codeQuality.score);
    case RESULTS_TAB.reactComponents:
      return facts.react.score != null ? healthTierFromScore(facts.react.score) : "good";
    case RESULTS_TAB.codeComplexity:
      return healthTierFromScore(
        computeCodeComplexityHealthScore({ phase2: facts.phase2 }),
      );
    case RESULTS_TAB.codeRisks:
      return healthTierFromScore(
        computeCodeRisksHealthScore({ phase3: facts.phase3 }),
      );
    case RESULTS_TAB.aiUsage:
      return "good";
  }
}

export function buildCoachSaysFacts(report: RepoReport): CoachSaysFacts {
  const ch = computeCommitHabitsScore(report);
  const git = report.git;
  const gv2 = report.gitMetricsV2;
  const profile = report.profile;
  const testLocRatio =
    profile && profile.sourceLOC > 0 ? profile.testLOC / profile.sourceLOC : 0;

  const rm = report.reactMetrics?.summary;
  const reactScore = computeReactHealthScore(report);
  const p2 = tryGetPhase2Summary(report);
  const p3 = report.phase3;

  return {
    commitSha: report.source?.commit?.slice(0, 12) ?? "",
    repoUrl: report.source?.url ?? "",
    reactUiScope: hasReactUiScope(report),
    allowedPriorityTabs: allowedCoachPriorityTabs(report),
    commitHabits: {
      score: ch.score,
      tier: ch.tier,
      headline: ch.headline,
      totalCommits: git?.totalCommits ?? 0,
      commitsPerWeek: git?.commitsPerWeek ?? 0,
      worstDriverLabel: ch.worst.label,
      worstDriverScore: ch.worst.score,
    },
    testing: {
      score: computeTestingScore(report),
      pctCommitsTouchingTests: gv2?.testCoupling?.pctCommitsTouchingTests ?? 0,
      testFiles: profile?.testFiles ?? 0,
      testLocRatio: Math.round(testLocRatio * 1000) / 1000,
      testCoverageClassification: report.testCoverageProxy?.classification ?? null,
    },
    codeQuality: {
      score: computeCodeQualityScore(report),
      maintainabilityScore: report.maintainability?.score ?? null,
      maintainabilityClassification: report.maintainability?.classification ?? null,
      highComplexityFunctions: report.complexity?.highComplexityFunctions ?? 0,
      maxComplexity: report.complexity?.max ?? 0,
      duplicationPct: Math.round((report.duplication?.percentage ?? 0) * 10) / 10,
    },
    react: {
      enabled: Boolean(rm && rm.componentsAnalyzed > 0),
      componentsAnalyzed: rm?.componentsAnalyzed ?? 0,
      jsxDepthExceededCount: rm?.tampereJsxDepthExceededCount ?? 0,
      lackOfCohesionCount: rm?.ferreiraLackOfCohesionCount ?? 0,
      score: reactScore,
    },
    phase2: p2
      ? {
          miNormMean: Math.round(p2.miNormMean * 100) / 100,
          functionsWithPhase2: p2.functionsWithPhase2,
        }
      : null,
    phase3: p3
      ? {
          silentFailureCount: p3.silentFailureEvents?.length ?? 0,
          sfd: typeof p3.sfd === "number" ? Math.round(p3.sfd * 1000) / 1000 : null,
        }
      : null,
  };
}

/**
 * Deterministic copy when the coach API is unavailable — picks priority tab by weakest heuristic score.
 */
export function buildCoachSaysFallback(facts: CoachSaysFacts): CoachSaysPayload {
  const tabScores: Array<{ tab: CoachSaysPriorityTab; score: number }> = [
    { tab: RESULTS_TAB.commitHabits, score: facts.commitHabits.score },
    { tab: RESULTS_TAB.testing, score: facts.testing.score },
    { tab: RESULTS_TAB.codeQuality, score: facts.codeQuality.score },
  ];

  if (facts.reactUiScope && facts.react.enabled && facts.react.score != null) {
    tabScores.push({ tab: RESULTS_TAB.reactComponents, score: facts.react.score });
  }

  tabScores.push({
    tab: RESULTS_TAB.codeComplexity,
    score: computeCodeComplexityHealthScore({ phase2: facts.phase2 }),
  });

  tabScores.push({
    tab: RESULTS_TAB.codeRisks,
    score: computeCodeRisksHealthScore({ phase3: facts.phase3 }),
  });

  tabScores.push({ tab: RESULTS_TAB.aiUsage, score: 72 });

  const allowed = new Set(facts.allowedPriorityTabs);
  const filtered = tabScores.filter((t) => allowed.has(t.tab));
  const weakest =
    filtered.length > 0
      ? filtered.reduce((a, b) => (a.score <= b.score ? a : b))
      : { tab: RESULTS_TAB.commitHabits as CoachSaysPriorityTab, score: 0 };

  const priorityTab = weakest.tab;

  const habitTier = facts.commitHabits.tier;
  const testTier = healthTierFromScore(facts.testing.score);
  const cqTier = healthTierFromScore(facts.codeQuality.score);

  const strengthParts: string[] = [];
  if (habitTier === "strong" || habitTier === "good") {
    strengthParts.push(
      `Your commit rhythm is in a ${habitTier === "strong" ? "strong" : "solid"} band (${facts.commitHabits.score}/100) — ${facts.commitHabits.totalCommits} commits in this snapshot show steady integration practice.`,
    );
  } else if (facts.commitHabits.totalCommits > 0 && facts.commitHabits.commitsPerWeek >= 1) {
    strengthParts.push(
      `You are shipping regularly (${facts.commitHabits.commitsPerWeek.toFixed(1)} commits/week on average), which is the backbone every other practice builds on.`,
    );
  }
  if (testTier === "strong" || testTier === "good") {
    strengthParts.push(
      `Verification habits are supporting you — about ${facts.testing.pctCommitsTouchingTests.toFixed(0)}% of commits touch tests with ${facts.testing.testFiles} test file(s) in the tree.`,
    );
  }
  if (cqTier === "strong" || cqTier === "good") {
    strengthParts.push(
      `Structural signals look manageable from this scan (${facts.codeQuality.score}/100): you have headroom to improve without fighting baseline complexity.`,
    );
  }
  if ((facts.phase3?.silentFailureCount ?? 0) === 0 && facts.reactUiScope) {
    strengthParts.push(
      "TSX silent-failure heuristics did not flag risky catch patterns in this pass — a clean baseline to protect as the UI grows.",
    );
  }
  if (strengthParts.length === 0) {
    strengthParts.push(
      "This snapshot is a clear baseline: small, consistent pushes plus the tabs below will make the next analysis show measurable movement.",
    );
  }

  let oppBody = "";
  switch (priorityTab) {
    case RESULTS_TAB.testing:
      oppBody = `Testing is where you can make the highest-impact improvement this quarter (${facts.testing.score}/100) — about ${facts.testing.pctCommitsTouchingTests.toFixed(
        0,
      )}% of commits touch tests today with ${facts.testing.testFiles} test file(s). Framing verification as part of every change — not an afterthought — will compound with your existing workflow.`;
      break;
    case RESULTS_TAB.codeQuality:
      oppBody = `Code Quality is your biggest opening (${facts.codeQuality.score}/100): ${facts.codeQuality.highComplexityFunctions} functions read as high-complexity (peak cyclomatic ${facts.codeQuality.maxComplexity}) and duplication sits near ${facts.codeQuality.duplicationPct}%. Tightening a few hotspots first lifts the whole codebase faster than spreading effort thin.`;
      break;
    case RESULTS_TAB.reactComponents:
      oppBody = `React-specific structure is the main growth edge (${facts.react.score ?? "—"}/100): ${facts.react.jsxDepthExceededCount} components exceed the JSX depth check and ${facts.react.lackOfCohesionCount} show cohesion warnings. Shrink the noisiest surfaces before layering new UI — reviewers and tests both get easier.`;
      break;
    case RESULTS_TAB.codeComplexity:
      oppBody = `Per-function lexical complexity is the clearest opportunity (${facts.phase2?.miNormMean ?? "—"} mean MI_norm across ${facts.phase2?.functionsWithPhase2 ?? 0} functions). Trimming cognitive and Halstead outliers in Code Complexity will move this score the fastest on the next run.`;
      break;
    case RESULTS_TAB.codeRisks:
      oppBody = `Code Risks surfaced ${facts.phase3?.silentFailureCount ?? 0} silent-failure patterns in TSX — a great place to harden error handling before the surface area grows. Small, explicit fixes here prevent painful debugging later.`;
      break;
    case RESULTS_TAB.aiUsage:
      oppBody =
        "Optional next step: add an AI usage trace on the AI Usage tab so tool choice and session phases show up next to your git habits — it completes the picture for a single repo sprint.";
      break;
  }

  const tabTitle: Record<CoachSaysPriorityTab, string> = {
    [RESULTS_TAB.commitHabits]: "Commit Habits",
    [RESULTS_TAB.testing]: "Testing",
    [RESULTS_TAB.codeQuality]: "Code Quality",
    [RESULTS_TAB.reactComponents]: "React Components",
    [RESULTS_TAB.codeComplexity]: "Code Complexity",
    [RESULTS_TAB.codeRisks]: "Code Risks",
    [RESULTS_TAB.aiUsage]: "AI Usage",
  };

  const label = tabTitle[priorityTab];

  return {
    strengthText: strengthParts.slice(0, 2).join(" "),
    opportunityText: oppBody,
    pointerText: `Your highest-impact improvement this quarter is ${label}. Head to the ${label} tab below to see exactly what to do and how to improve your score.`,
    priorityTab,
    footerLabel: footerLabelForCoachTab(priorityTab),
  };
}
