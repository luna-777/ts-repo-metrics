import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const GITHUB_REPO = "https://github.com/scottyUX/ts-repo-metrics";

/**
 * Citations aligned with docs/METRICS_CONCEPTS.md for dashboard/engine metrics.
 */
export function RepoMetricGrounding() {
  return (
    <section
      id="repo-metrics-grounding"
      className="scroll-mt-24 space-y-6 border-t border-border pt-12"
    >
      <header>
        <h2 className="text-xl font-semibold tracking-tight">
          Metric grounding (repository dashboard)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lexical, structural, and cognitive signals exported by{" "}
          <code className="rounded bg-muted px-1">@repo-metrics/engine</code> intentionally cite education-grade and industry sources.
          Detailed formulas live in{" "}
          <Link
            href={`${GITHUB_REPO}/blob/main/docs/METRICS_CONCEPTS.md`}
            className="text-primary underline-offset-4 hover:underline"
          >
            docs/METRICS_CONCEPTS.md
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase 2 — Lexical / cognitive / MI</CardTitle>
          <CardDescription>Tri-metric framing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-foreground">Halstead-style volume</strong> — lexical richness across modern TypeScript operators (
              Imai, 2022 — information & software technology lens).
            </li>
            <li>
              <strong className="text-foreground">Cyclomatic complexity</strong> — structural branching (McCabe, 1976; contemporary testing guidance).
            </li>
            <li>
              <strong className="text-foreground">Cognitive complexity</strong> — nesting-aware load aligned with Sonar-style practices (
              Jönsson &amp; Wehbi, 2025 — AI-generated mobile app quality context).
            </li>
            <li>
              <strong className="text-foreground">GRAD-AI MI_norm</strong> — normalized maintainability index coefficients (
              Gambo et al., 2025,{" "}
              <em>Education and Information Technologies</em>
              ).
            </li>
            <li>
              <strong className="text-foreground">Repo-level maintainability index</strong> — Coleman-style aggregation (
              Coleman et al., 1994).
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">React / TSX heuristics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Component cohesion-style insights cite Ferreira/Tampere traditions documented in{" "}
          <Link
            href={`${GITHUB_REPO}/blob/main/docs/planning/RQ3_REACT_METRICS_IMPLEMENTATION.md`}
            className="text-primary underline-offset-4 hover:underline"
          >
            planning/RQ3_REACT_METRICS_IMPLEMENTATION.md
          </Link>{" "}
          and Bollu (2024) maintainability study context for React-heavy coursework.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase 3 pathology KPIs</CardTitle>
          <CardDescription>Silent failures, monolithic components, weighted redundancy</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Derived from AST scans plus jscpd duplicate records (
          <code className="rounded bg-muted px-1">weightedRedundancy.ts</code>
          ). Interpretation guidance parallels verification-gap framing documented in METRICS_CONCEPTS.
        </CardContent>
      </Card>
    </section>
  );
}
