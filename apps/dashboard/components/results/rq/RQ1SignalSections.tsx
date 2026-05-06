"use client";

import type { RepoReport } from "@/lib/reportTypes";
import type { CommitHabitsMetricValues } from "@/lib/commitHabitsScopeMetrics";
import { CoreSignalCard, type CoreSignalTier } from "./CoreSignalsPrimitives";
import {
  RQ1AvgLinesPerCommitBody,
  RQ1DuplicationPercentBody,
} from "./metricHelpContent";
import { MetricCard } from "../MetricCard";

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function tierTotalCommits(n: number): CoreSignalTier {
  if (n <= 0) return "critical";
  if (n < 8) return "needs_work";
  if (n < 40) return "good";
  return "strong";
}

function tierCommitsPerWeek(cpw: number | null): CoreSignalTier {
  if (cpw == null || !Number.isFinite(cpw)) return "no_data";
  if (cpw < 0.25) return "critical";
  if (cpw < 1.5) return "needs_work";
  if (cpw < 4) return "good";
  return "strong";
}

/** Lower large-commit share is healthier. */
function tierLargeCommitRatio(pct: number): CoreSignalTier {
  if (pct > 40) return "critical";
  if (pct > 20) return "needs_work";
  if (pct > 8) return "good";
  return "strong";
}

function tierMedianCommitSize(lines: number, hasData: boolean): CoreSignalTier {
  if (!hasData) return "no_data";
  if (lines <= 80) return "strong";
  if (lines <= 200) return "good";
  if (lines <= 500) return "needs_work";
  return "critical";
}

function tierEntropy(entropy: number, hasData: boolean): CoreSignalTier {
  if (!hasData) return "no_data";
  if (entropy === 0) return "strong";
  if (entropy < 3_600_000) return "strong";
  if (entropy < 86_400_000) return "good";
  return "needs_work";
}

function tierBurst(pct: number, hasData: boolean): CoreSignalTier {
  if (!hasData) return "no_data";
  if (pct <= 5) return "strong";
  if (pct <= 20) return "good";
  if (pct <= 45) return "needs_work";
  return "critical";
}

export interface CommitHabitsSignalQuality {
  median: boolean;
  entropy: boolean;
  burst: boolean;
}

export function resolveCommitHabitsSignalQuality(report: RepoReport): CommitHabitsSignalQuality {
  const gv2 = report.gitMetricsV2;
  const api = report.git?.mode === "api";
  return {
    median: Boolean(gv2) && !api,
    entropy: Boolean(gv2),
    burst: Boolean(gv2),
  };
}

function describeTotalCommits(n: number, tier: CoreSignalTier): string {
  if (tier === "critical") {
    return "Very few commits in the parsed window. Push small, frequent changes so the team gets steady integration signal.";
  }
  if (tier === "needs_work") {
    return "Activity is thin relative to a healthy cadence. Aim for smaller commits landing more often.";
  }
  if (tier === "strong") {
    return `${n} commits in parsed history—a solid volume for habits and review rhythm.`;
  }
  return `${n} commits recorded. Rhythm looks reasonable; keep integrating often.`;
}

function describeCommitsPerWeek(
  cpw: number | null,
  tier: CoreSignalTier,
  scopeContributor: boolean,
): string {
  if (tier === "no_data" && scopeContributor) {
    return "Per-week rate is calculated for the whole repository (13-week window), not per author. Whole-repo figure is shown in the value above when available.";
  }
  if (tier === "no_data") {
    return "Not enough git timeline data to estimate a weekly rate.";
  }
  const w = cpw ?? 0;
  if (tier === "strong" || tier === "good") {
    return `You commit about ${formatNumber(w)} times per week on average in the recent window—steady integration.`;
  }
  if (tier === "needs_work") {
    return "Weekly commit frequency is low. Smaller, more frequent commits usually reduce merge pain.";
  }
  return "Cadence is very low. Even tiny incremental commits help keep CI and reviewers in sync.";
}

function describeLargeCommit(pct: number, tier: CoreSignalTier): string {
  if (tier === "strong") {
    return "Few commits exceed 500 lines—batches stay reviewable.";
  }
  if (tier === "good") {
    return "Most changes land in moderate-sized commits. Watch for occasional large diffs.";
  }
  if (tier === "needs_work") {
    return "A noticeable share of commits are very large. Split work where you can to ease review.";
  }
  return "Many commits are very large. Break work into smaller, testable slices.";
}

function describeMedian(lines: number, tier: CoreSignalTier, hasData: boolean): string {
  if (!hasData) {
    return "Line-level commit sizes need full git numstat history (not available in GitHub-API-only mode or when extended metrics are missing).";
  }
  if (tier === "strong" || tier === "good") {
    return "Typical commit size stays moderate—good for review and rollback safety.";
  }
  return "Median churn per commit is high. Consider smaller steps so feedback arrives earlier.";
}

function describeEntropyMs(entropy: number, tier: CoreSignalTier, hasData: boolean): string {
  if (!hasData) {
    return "Timing variability needs consecutive commit timestamps from full git history.";
  }
  if (tier === "strong") {
    return "Gaps between commits are fairly regular—rhythm is predictable for the team.";
  }
  if (tier === "good") {
    return "Some spread in when commits land—normal for mixed priorities.";
  }
  return "Very irregular timing—either bursty work or sparse pushes. Check batch size and integration.";
}

function describeBurst(pct: number, tier: CoreSignalTier, hasData: boolean): string {
  if (!hasData) {
    return "Burst detection needs clustered commit timestamps from git history.";
  }
  if (tier === "strong" || tier === "good") {
    return "Few rapid-fire commit clusters—less thrash for neighbors rebasing.";
  }
  if (tier === "needs_work") {
    return "Several commits land in tight bursts. Batch consciously if it strains review.";
  }
  return "Many commits fall in burst clusters; consider spacing work or coordinating with reviewers.";
}

const cardProps = { rq: "RQ1" as const, hideResearchBadge: true };

export function RQ1CoreSignalsSection({
  report,
  mv,
}: {
  report: RepoReport;
  mv: CommitHabitsMetricValues;
}) {
  const teamCpw =
    mv.mode === "team"
      ? mv.commitsPerWeek
      : report.git?.commitsPerWeek ?? null;
  const cpwTier = tierCommitsPerWeek(teamCpw);
  const totalTier = tierTotalCommits(mv.totalCommits);
  const largeTier = tierLargeCommitRatio(mv.largeCommitRatio);

  const cpwValue =
    teamCpw == null || !Number.isFinite(teamCpw)
      ? "—"
      : formatNumber(teamCpw);

  return (
    <section id="commit-habits-core-signals" aria-labelledby="commit-habits-core-signals-heading" className="space-y-4">
      <h2 id="commit-habits-core-signals-heading" className="text-sm font-medium tracking-wide text-muted-foreground">
        Core Signals
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <CoreSignalCard
          title="Total Commits"
          tier={totalTier}
          value={String(mv.totalCommits)}
          description={describeTotalCommits(mv.totalCommits, totalTier)}
        />
        <CoreSignalCard
          title="Commits Per Week"
          tier={cpwTier}
          value={cpwValue}
          description={describeCommitsPerWeek(teamCpw, cpwTier, mv.mode === "contributor")}
        />
        <CoreSignalCard
          title="Large Commit Ratio"
          tier={largeTier}
          value={`${formatNumber(mv.largeCommitRatio)}%`}
          description={describeLargeCommit(mv.largeCommitRatio, largeTier)}
        />
      </div>
      {mv.mode === "contributor" ? (
        <p className="text-xs text-muted-foreground max-w-3xl">
          Commits per week reflects the whole repository’s recent window when git exposes it, not a
          per-author weekly rate.
        </p>
      ) : null}
    </section>
  );
}

export function RQ1AdditionalSignalsSection({
  mv,
  quality,
}: {
  mv: CommitHabitsMetricValues;
  quality: CommitHabitsSignalQuality;
}) {
  const medTier = tierMedianCommitSize(mv.medianCommitSize, quality.median);
  const entTier = tierEntropy(mv.entropy, quality.entropy);
  const burstTier = tierBurst(mv.burstRatio, quality.burst);

  return (
    <section aria-labelledby="commit-habits-additional-signals-heading" className="space-y-4">
      <h2 id="commit-habits-additional-signals-heading" className="text-sm font-medium tracking-wide text-muted-foreground">
        Additional Signals
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <CoreSignalCard
          title="Median Commit Size"
          tier={medTier}
          value={quality.median ? formatNumber(mv.medianCommitSize) : "—"}
          description={describeMedian(mv.medianCommitSize, medTier, quality.median)}
        />
        <CoreSignalCard
          title="Commit Entropy (std dev ms)"
          tier={entTier}
          value={quality.entropy ? formatNumber(mv.entropy) : "—"}
          description={describeEntropyMs(mv.entropy, entTier, quality.entropy)}
        />
        <CoreSignalCard
          title="Burst Ratio"
          tier={burstTier}
          value={quality.burst ? `${formatNumber(mv.burstRatio)}%` : "—"}
          description={describeBurst(mv.burstRatio, burstTier, quality.burst)}
        />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground pt-2">Repository profile</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
