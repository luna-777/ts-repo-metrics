import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

/**
 * Repo-derived instrumentation narrative (distinct from survey RQs in the paper).
 */
export function InstrumentationSection() {
  return (
    <section
      id="instrumentation"
      className="scroll-mt-24 space-y-8 border-t border-border pt-12"
    >
      <header>
        <h2 className="text-xl font-semibold tracking-tight">
          Repository instrumentation (this dashboard)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These questions motivate{" "}
          <strong className="text-foreground">observable git + code metrics</strong> stored per analysis.
          They complement—but do not replace—the survey constructs AU/AUM described above.
        </p>
      </header>

      <Card className="border-blue-200/80 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/25">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-950 dark:text-blue-50">
            How this relates to the AI Maturity tab
          </CardTitle>
          <CardDescription className="text-blue-900/90 dark:text-blue-200/90">
            Session-log summaries visualize interaction traces when logs are uploaded—they are{" "}
            <strong>not</strong> the same operationalization as Likert AUM in the paper.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 dark:text-blue-100">
          Use traces as exploratory prompts for discussion; validate claims with survey instruments where applicable.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dashboard RQ1 — Commit habits (behavioral shift)
          </CardTitle>
          <CardDescription>Observable workflow behaviors</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">
            How does access to generative AI tools correspond with observable software engineering behaviors in student team projects?
          </p>
          <p className="mb-2 font-medium text-foreground">Operationalization:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Commits per week</li>
            <li>Burst ratio</li>
            <li>Active commit days</li>
            <li>Median inter-commit interval</li>
            <li>Commit message informativeness</li>
          </ul>
          <p className="mt-3">
            When full git history is unavailable, API-derived workflow metrics are used. Ingestion mode is recorded:{" "}
            <code className="rounded bg-muted px-1 py-0.5">local</code> vs{" "}
            <code className="rounded bg-muted px-1 py-0.5">api</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dashboard RQ2 — Testing (verification & engagement)
          </CardTitle>
          <CardDescription>Verification proxies from the repository</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">
            Within AI-using teams, how do verification efforts relate to repository indicators of quality and stability?
          </p>
          <p className="mb-2 font-medium text-foreground">Signals:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Test density</li>
            <li>Error-handling anti-patterns</li>
            <li>Long method frequency</li>
            <li>Smell counts</li>
            <li>Structural risk exposure</li>
          </ul>
          <p className="mt-3">
            Survey-based engagement constructs are collected outside this tool and joined analytically when available.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dashboard RQ3 — Code quality (project outcomes)
          </CardTitle>
          <CardDescription>Structural complexity & maintainability</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">
            Do projects exhibit differences in structural complexity and maintainability measurable from snapshots?
          </p>
          <p className="mb-2 font-medium text-foreground">Operationalization:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Mean / tail cyclomatic complexity</li>
            <li>Long function counts</li>
            <li>Duplication percentage</li>
            <li>Maintainability index</li>
            <li>Structural risk composites</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conceptual flow</CardTitle>
          <CardDescription>Behavior → verification → structure</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2 font-medium text-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <span className="rounded-md border bg-muted/50 px-4 py-2 text-center">
              Behavioral predictors (Commit habits)
            </span>
            <span className="text-muted-foreground">↓</span>
            <span className="rounded-md border bg-muted/50 px-4 py-2 text-center">
              Verification moderators (Testing)
            </span>
            <span className="text-muted-foreground">↓</span>
            <span className="rounded-md border bg-muted/50 px-4 py-2 text-center">
              Structural outcomes (Code quality)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data integration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="list-inside list-decimal space-y-1">
            <li>Repository mining (this dashboard / engine)</li>
            <li>Course surveys & milestones (external)</li>
            <li>Cohort comparisons across terms</li>
          </ol>
          <p className="mt-4">
            Dataset exports appear under each repo&apos;s{" "}
            <strong className="text-foreground">Dataset</strong> tab — see{" "}
            <Link href="/docs/metrics" className="text-primary underline-offset-4 hover:underline">
              Metrics & calculation
            </Link>{" "}
            for field provenance.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
