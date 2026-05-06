"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, Calculator, ChevronDown, CircleHelp, Terminal } from "lucide-react";
import type { RepoReport, SilentFailureEvent } from "@/lib/reportTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MathBlock } from "@/components/research/MathBlock";
import { cn } from "@/lib/utils";
import { ResultsConstructFramingHeader } from "./ResultsConstructFramingHeader";
import { hasReactUiScope } from "@/lib/hasReactUiScope";

interface Phase3PathologyTabProps {
  report: RepoReport;
}

const MONOLITHIC_CLASSIFICATION = {
  label: "MONOLITHIC COMPONENT",
  badgeClass:
    "border-transparent bg-violet-100 text-violet-950 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-100",
  risk:
    "Large single-component surface; harder to test, review, and refactor in isolation (maintainability literature).",
} as const;

/** Aligns dashboard copy with methodology spec used in research materials. */
const METHODOLOGY_SPEC_VERSION = "MATH_SPECS_V1.2";

export function Phase3PathologyTab({ report }: Phase3PathologyTabProps) {
  const p3 = report.phase3;
  const showReact = hasReactUiScope(report);
  const [formulasOpen, setFormulasOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const monolithicRows = useMemo(() => {
    const out: { file: string; name: string; lines: number; startLine: number }[] =
      [];
    for (const pf of report.perFile ?? []) {
      for (const fn of pf.functionMetrics ?? []) {
        if (fn.isMonolithic) {
          out.push({
            file: pf.file,
            name: fn.name,
            lines: fn.lines,
            startLine: fn.startLine,
          });
        }
      }
    }
    return out;
  }, [report.perFile]);

  return (
    <div className="space-y-8">
      <ResultsConstructFramingHeader constructId="code-quality" heading="Code Risks" />
      <p className="text-muted-foreground text-sm max-w-2xl">
        <span className="font-medium text-foreground">Phase 3 — AI smell &amp; bloat.</span> KPIs are
        framed as <strong className="text-foreground">integrity</strong>,{" "}
        <strong className="text-foreground">modularity</strong>, and{" "}
        <strong className="text-foreground">abstraction</strong> risks (
        {showReact ? "SFD, MCR, SRS" : "SFD, SRS"}). Open{" "}
        <CircleHelp className="inline size-3.5 align-text-bottom text-muted-foreground" aria-hidden />{" "}
        on each card for the full methodology; the{" "}
        <strong className="text-foreground">Formal methodology</strong> section matches{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{METHODOLOGY_SPEC_VERSION}</code>.
      </p>

      {!p3 ? (
        <p className="text-muted-foreground text-sm max-w-2xl">
          No Phase 3 metrics in this report. Re-run analysis with the current{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            @repo-metrics/engine
          </code>{" "}
          to populate KPIs and tables. Card help text still describes how each metric is computed.
        </p>
      ) : null}

      <div
        className={`grid grid-cols-1 gap-4 ${showReact ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <Phase3KpiCard
          riskLabel="Integrity risk"
          metricLabel="Silent Failure Density"
          abbrev="SFD"
          tagline="Frequency of swallowed errors per 1k LOC. High density indicates unverified AI output."
          value={p3 ? p3.sfd.toFixed(3) : "—"}
          footer={
            p3
              ? `${p3.silentFailureEvents.length} event${p3.silentFailureEvents.length === 1 ? "" : "s"}`
              : "—"
          }
          helpTitle="Silent Failure Density (SFD)"
          citation="Source: arXiv:2603.28592 (2026)."
          formula={String.raw`\mathrm{SFD} = \frac{E_{\mathrm{empty}} + E_{\mathrm{console}}}{\mathrm{Source\ KLOC}}`}
        >
          <p>
            Identifies <strong className="text-foreground">&ldquo;Lazy Implementation&rdquo;</strong>{" "}
            patterns where code provides the illusion of stability by suppressing runtime
            exceptions (empty <code className="rounded bg-muted px-1 text-xs">catch</code> or
            console-only handling in <strong className="text-foreground">.tsx</strong>).
          </p>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it matters
            </p>
            <p>
              AI assistants prioritize &ldquo;Happy Path&rdquo; solutions. SFD spikes suggest the
              developer is trusting boilerplate without adding robust error recovery.
            </p>
          </div>
        </Phase3KpiCard>

        {showReact ? (
          <Phase3KpiCard
            riskLabel="Modularity risk"
            metricLabel="Monolithic Rate"
            abbrev="MCR"
            tagline="Share of React components exceeding the 50-line maintainability threshold."
            value={
              p3 ? (p3.mcr === null ? "—" : `${(p3.mcr * 100).toFixed(1)}%`) : "—"
            }
            footer={
              p3
                ? `${p3.monolithicComponentCount} / ${p3.reactComponentCount} components`
                : "—"
            }
            helpTitle="Monolithic Component Rate (MCR)"
            citation="Source: Bollu, P. (2024)."
            formula={String.raw`\mathrm{MCR} = \frac{\#\{\,C \mid \mathrm{SLOC}(C) > 50\,\}}{\#\{\,\mathrm{Components}\,\}}`}
          >
            <p>
              Measures <strong className="text-foreground">architectural atrophy</strong> where
              features are repeatedly prompted into a single file instead of being refactored into
              smaller units.
            </p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why it matters
              </p>
              <p>
                Tampere/Bollu-line research associates very large React components with higher defect
                density; high MCR flags &ldquo;giant component&rdquo; debt often amplified by
                AI-assisted churn.
              </p>
            </div>
          </Phase3KpiCard>
        ) : null}

        <Phase3KpiCard
          riskLabel="Abstraction risk"
          metricLabel="Redundancy Score (SRS)"
          abbrev="SRS"
          tagline="Weighted measure of structural cloning vs. functional abstraction."
          value={p3 ? p3.srs.toFixed(3) : "—"}
          footer={
            p3
              ? `Numerator ${p3.srsWeightedNumerator.toFixed(1)} (exact ${p3.srsExactWeightedLines.toFixed(0)}, near ${p3.srsNearWeightedLines.toFixed(0)})`
              : "—"
          }
          helpTitle="Structural Redundancy Score (SRS)"
          citation="Source: Ferreira et al. (2023); jscpd clone detection."
          formula={String.raw`\mathrm{SRS} = \frac{W_e \, T_{\mathrm{exact}} + W_n \, T_{\mathrm{near}}}{\mathrm{Source\ KLOC}}, \quad W_e = 1,\; W_n = \tfrac{1}{2}`}
        >
          <p>
            Captures <strong className="text-foreground">prompt-driven redundancy</strong>: copy-paste
            and near-duplicate structure vs. DRY abstractions—weighted so exact clones count more than
            loose near-matches.
          </p>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it matters
            </p>
            <p>
              High SRS relative to team size hints at abstraction debt: repeated structure that
              should be factored but remains duplicated across the UI layer.
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Similarity ≤ 80% receives zero weight; 80%–100% uses half weight; 100% uses full weight.
          </p>
        </Phase3KpiCard>
      </div>

      {/* Formal methodology (MATH_SPECS) */}
      <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
        <div className="h-1 w-full bg-sky-600" aria-hidden />
        <CardHeader className="flex flex-row flex-wrap items-start gap-3 pb-2">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200">
            <Calculator className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Formal methodology</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {METHODOLOGY_SPEC_VERSION}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Long-form definitions aligned with committee-facing writeups.{" "}
              <strong className="text-foreground">Source KLOC</strong> = non-test source lines ÷
              1000. Engine implementation may use a subset of event types documented below.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setMethodologyOpen((o) => !o)}
              aria-expanded={methodologyOpen}
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200",
                  methodologyOpen && "rotate-180",
                )}
                aria-hidden
              />
              {methodologyOpen ? "Hide methodology text" : "Show methodology text"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {methodologyOpen ? (
            <div className="space-y-8 border-t pt-6 text-sm leading-relaxed">
              <section className="space-y-3">
                <h4 className="text-base font-semibold text-foreground">
                  1. Silent Failure Density (SFD)
                </h4>
                <p className="text-muted-foreground">
                  Identifies &ldquo;Lazy Implementation&rdquo; patterns where code provides the
                  illusion of stability by suppressing runtime exceptions.
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Calculation formula (research spec)
                </p>
                <div className="rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/40">
                  <div className="text-sky-950 [&>div]:my-0 [&_.katex]:text-sky-950 dark:text-sky-100 dark:[&_.katex]:text-sky-100">
                    <MathBlock displayMode>
                      {String.raw`\mathrm{SFD} = \frac{E_{\mathrm{empty\_catch}} + E_{\mathrm{unhandled}}}{\mathrm{Source\ KLOC}}`}
                    </MathBlock>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium text-foreground">As implemented: </span>
                  the engine currently counts{" "}
                  <code className="rounded bg-muted px-1">E_empty</code> and{" "}
                  <code className="rounded bg-muted px-1">E_console</code> in{" "}
                  <code className="rounded bg-muted px-1">.tsx</code> only; additional event types
                  (e.g. unhandled promises) are reserved for future instrumentation.
                </p>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Why it matters
                  </p>
                  <p className="text-muted-foreground">
                    AI assistants prioritize &ldquo;Happy Path&rdquo; solutions. SFD spikes indicate
                    that the developer is trusting the AI&apos;s boilerplate without adding robust
                    error recovery.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Source: </span>
                  arXiv:2603.28592 (2026).
                </p>
              </section>

              {showReact ? (
                <section className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">
                    2. Monolithic Component Rate (MCR)
                  </h4>
                  <p className="text-muted-foreground">
                    Measures architectural atrophy where developers repeatedly &ldquo;prompt&rdquo; for
                    features into a single file rather than refactoring.
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Calculation formula
                  </p>
                  <div className="rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/40">
                    <div className="text-sky-950 [&>div]:my-0 [&_.katex]:text-sky-950 dark:text-sky-100 dark:[&_.katex]:text-sky-100">
                      <MathBlock displayMode>
                        {String.raw`\mathrm{MCR} = \frac{\mathrm{Count}(\mathrm{Components} > 50\ \mathrm{SLOC})}{\mathrm{Total\ Components}}`}
                      </MathBlock>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Why it matters
                    </p>
                    <p className="text-muted-foreground">
                      Tampere-line research reports substantially higher bug density in very large
                      React components; high MCR suggests AI is enabling &ldquo;giant component&rdquo;
                      debt.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Source: </span>
                    Bollu, P. (2024).
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h4 className="text-base font-semibold text-foreground">
                  {showReact ? "3." : "2."} Structural Redundancy Score (SRS)
                </h4>
                <p className="text-muted-foreground">
                  Weighted jscpd clone mass per Source KLOC: exact vs. near duplicates (see KPI help
                  for weights).
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Calculation formula
                </p>
                <div className="rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/40">
                  <div className="text-sky-950 [&>div]:my-0 [&_.katex]:text-sky-950 dark:text-sky-100 dark:[&_.katex]:text-sky-100">
                    <MathBlock displayMode>
                      {String.raw`\mathrm{SRS} = \frac{W_e \, T_{\mathrm{exact}} + W_n \, T_{\mathrm{near}}}{\mathrm{Source\ KLOC}}, \quad W_e = 1,\; W_n = \tfrac{1}{2}`}
                    </MathBlock>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Source: </span>
                  Ferreira et al. (2023); clone pairs from jscpd.
                </p>
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Monolithic components */}
      {p3 && showReact ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Monolithic components (&gt;50 lines)
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Same 50-SLOC rule as MCR; each row is one qualifying component with classification and
              research risk.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-card shadow-sm dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[28%]">File &amp; line</TableHead>
                  <TableHead className="w-[18%]">Component</TableHead>
                  <TableHead className="text-right w-[8%]">Lines</TableHead>
                  <TableHead className="w-[18%]">Classification</TableHead>
                  <TableHead>Research risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monolithicRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-6 text-center"
                    >
                      None detected
                    </TableCell>
                  </TableRow>
                ) : (
                  monolithicRows.map((r) => (
                    <TableRow key={`${r.file}:${r.name}:${r.startLine}`}>
                      <TableCell className="font-mono text-xs align-top">
                        <span className="text-foreground">{r.file}</span>
                        <span className="text-muted-foreground"> : </span>
                        <span className="font-semibold text-sky-700 dark:text-sky-400">
                          {r.startLine}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm align-top">{r.name}</TableCell>
                      <TableCell className="text-right tabular-nums align-top">{r.lines}</TableCell>
                      <TableCell className="align-top">
                        <Badge
                          className={cn(
                            "rounded-md px-2.5 py-0.5 font-semibold uppercase tracking-wide",
                            MONOLITHIC_CLASSIFICATION.badgeClass,
                          )}
                        >
                          {MONOLITHIC_CLASSIFICATION.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm align-top">
                        {MONOLITHIC_CLASSIFICATION.risk}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {/* Academic citations */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-row items-start gap-3 border-b pb-4">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">Academic citations</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Literature grounding for AI-native technical debt detection.
            </p>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border pt-2">
          <CitationRow
            head="arXiv:2603.28592 (2026)"
            title="Debt Behind the AI Boom: A Large-Scale Empirical Study of AI-Generated Code."
            role="Benchmarking silent failure patterns (SFD)."
          />
          {showReact ? (
            <CitationRow
              head="Bollu, P. (2024)"
              title="Ensuring Maintainability in React Web Applications (Tampere University)."
              role="Threshold for monolithic components (50 SLOC) (MCR)."
            />
          ) : null}
          <CitationRow
            head="Ferreira et al. (2023)"
            title="React Code Smells: A Catalog and Tooling."
            role="Structural redundancy and clone clusters (SRS)."
          />
          <CitationRow
            head="Imai, S. (2022)"
            title="Is GitHub Copilot a substitute for human programmers?"
            role="Foundation for AI vs. human quality comparison."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Phase3KpiCard({
  riskLabel,
  metricLabel,
  abbrev,
  tagline,
  value,
  footer,
  helpTitle,
  citation,
  formula,
  children,
}: {
  riskLabel: string;
  metricLabel: string;
  abbrev: string;
  tagline: string;
  value: string;
  footer: string;
  helpTitle: string;
  citation: string;
  formula: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {riskLabel}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Code Risks
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label={`About ${riskLabel}: ${metricLabel}`}
              >
                <CircleHelp className="size-3.5" aria-hidden />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>{helpTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-foreground">{children}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Calculation formula (as implemented)
                </p>
                <div className="mt-2 rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/40">
                  <div className="text-sky-950 [&>div]:my-0 [&>div]:py-1 [&_.katex]:text-sky-950 dark:text-sky-100 dark:[&_.katex]:text-sky-100">
                    <MathBlock displayMode>{formula}</MathBlock>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground border-t pt-3 text-xs">
                <span className="font-medium text-foreground">Citation: </span>
                {citation}
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="text-3xl font-bold tabular-nums tracking-tight">{value}</div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{metricLabel}</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {abbrev}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">{tagline}</p>
        <p className="text-muted-foreground border-t pt-2 text-xs">{footer}</p>
      </CardContent>
    </Card>
  );
}

function CitationRow({
  head,
  title,
  role,
}: {
  head: string;
  title: string;
  role: string;
}) {
  return (
    <div className="py-4 first:pt-2">
      <p className="font-semibold text-foreground">{head}</p>
      <p className="text-muted-foreground mt-1 text-sm">&ldquo;{title}&rdquo;</p>
      <p className="mt-2 text-sm">
        <span className="text-muted-foreground">Role: </span>
        <span className="font-medium text-sky-700 dark:text-sky-400">{role}</span>
      </p>
    </div>
  );
}
