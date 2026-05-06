"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RepoReport } from "@/lib/reportTypes";
import type { TestingScopeMetricValues } from "@/lib/testingScopeMetrics";
import { cn } from "@/lib/utils";

interface RQ2CoreSignalsSectionProps {
  mv: TestingScopeMetricValues;
  report: RepoReport;
}

type SignalTier = "strong" | "good" | "needs_work" | "critical";

const tierMeta: Record<SignalTier, { label: string; badgeClass: string }> = {
  strong: {
    label: "Strong",
    badgeClass: "border-0 bg-emerald-950 font-medium text-green-400 shadow-none",
  },
  good: {
    label: "Good",
    badgeClass: "border-0 bg-emerald-950/90 font-medium text-green-400 shadow-none",
  },
  needs_work: {
    label: "Needs Work",
    badgeClass: "border-0 bg-amber-950 font-medium text-amber-400 shadow-none",
  },
  critical: {
    label: "Critical",
    badgeClass: "border-0 bg-red-950 font-medium text-red-400 shadow-none",
  },
};

function tierForTestLocRatio(ratio: number, sourceLoc: number): SignalTier {
  if (sourceLoc > 0 && ratio <= 0) return "critical";
  if (ratio < 0.08) return "critical";
  if (ratio < 0.15) return "needs_work";
  if (ratio < 0.3) return "good";
  return "strong";
}

function tierForPctCommits(pct: number): SignalTier {
  if (pct <= 0) return "critical";
  if (pct < 10) return "needs_work";
  if (pct < 25) return "good";
  return "strong";
}

function tierForTestFiles(files: number): SignalTier {
  if (files <= 0) return "critical";
  if (files < 36) return "needs_work";
  if (files < 100) return "good";
  return "strong";
}

function formatRatioDecimal(r: number): string {
  if (!Number.isFinite(r)) return "—";
  return r.toFixed(3);
}

function totalCommitsFromReport(report: RepoReport): number | null {
  const g = report.git?.totalCommits;
  if (typeof g === "number" && g > 0) return g;
  const cs = report.contributors?.map((c) => c.commitCount) ?? [];
  const sum = cs.reduce((a, b) => a + b, 0);
  return sum > 0 ? sum : null;
}

export function RQ2CoreSignalsSection({ mv, report }: RQ2CoreSignalsSectionProps) {
  const ratioTier = tierForTestLocRatio(mv.testLocRatio, mv.sourceLoc);
  const pctTier = tierForPctCommits(mv.pctCommitsTouchingTests);
  const filesTier = tierForTestFiles(mv.testFiles);
  const totalCommits = totalCommitsFromReport(report);
  const commitsRounded = Number.isFinite(mv.pctCommitsTouchingTests)
    ? Math.round(mv.pctCommitsTouchingTests)
    : 0;

  const pctOfSource = Math.min(100, Math.max(0, Math.round(mv.testLocRatio * 100)));

  const ratioDescription = (() => {
    if (ratioTier === "strong" || ratioTier === "good") {
      return `Your test code is about ${pctOfSource}% of source—within a healthy band for this proxy. Keep pairing new features with tests so the ratio does not slip.`;
    }
    return `Your test code is ${pctOfSource}% of source. Industry standard is 20–30%. Roughly double your test coverage to reach a safe threshold.`;
  })();

  const commitsDescription = (() => {
    const n = totalCommits;
    const commitPhrase = n != null ? `${n} commit${n === 1 ? "" : "s"}` : "your commits";
    if (pctTier === "critical" && mv.pctCommitsTouchingTests <= 0) {
      return `None of your ${commitPhrase} included test file changes. Every feature shipped without a test is a future risk. This is the most important habit to build.`;
    }
    if (pctTier === "needs_work") {
      return `Only about ${commitsRounded}% of ${commitPhrase} touch tests. Aim to include at least one test change on most feature commits so verification keeps pace.`;
    }
    return `About ${commitsRounded}% of ${commitPhrase} touch tests—solid habit. Watch for regressions if complexity grows without new checks.`;
  })();

  const filesDescription = (() => {
    if (mv.testFiles <= 0) {
      return "No test files matched the analyzer’s patterns yet. Add a first spec or test module so verification has a foothold in the tree.";
    }
    if (filesTier === "needs_work" || filesTier === "critical") {
      return "You have test files but they are not growing with new features. Test count should increase alongside your source code.";
    }
    return `You have ${mv.testFiles} test file${mv.testFiles === 1 ? "" : "s"} on the snapshot—keep adding tests as you ship so this count tracks code growth.`;
  })();

  return (
    <section
      aria-labelledby="testing-core-signals-heading"
      className="space-y-4"
      id="testing-core-signals"
    >
      <div>
        <h2 id="testing-core-signals-heading" className="text-sm font-medium tracking-wide text-muted-foreground">
          Core Signals
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          title="Test Coverage Ratio"
          tier={ratioTier}
          value={formatRatioDecimal(mv.testLocRatio)}
          description={ratioDescription}
        />
        <SignalCard
          title="Commits Touching Tests"
          tier={pctTier}
          value={`${commitsRounded}%`}
          description={commitsDescription}
        />
        <SignalCard
          title="Test Files"
          tier={filesTier}
          value={`${mv.testFiles} files`}
          description={filesDescription}
        />
      </div>
    </section>
  );
}

function SignalCard({
  title,
  tier,
  value,
  description,
}: {
  title: string;
  tier: SignalTier;
  value: string;
  description: string;
}) {
  const t = tierMeta[tier];
  return (
    <Card className="flex flex-col overflow-hidden border-border/80 bg-card shadow-sm outline-none focus-visible:outline-none">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
          <Badge variant="outline" className={cn("shrink-0", t.badgeClass)}>
            {t.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0">
        <p className="text-[2rem] font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-4xl">
          {value}
        </p>
        <CardDescription className="text-sm leading-snug text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
