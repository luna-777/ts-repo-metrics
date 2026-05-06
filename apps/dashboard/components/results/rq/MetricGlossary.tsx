"use client";

import { useId } from "react";
import { CircleHelp } from "lucide-react";
import { MathBlock } from "@/components/research/MathBlock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Phase2MetricId = "cyclomatic" | "halstead" | "cognitive" | "mi" | "reactShare";

/** Shown in dialogs and in the “Definitions & formulas” collapsible. */
const METHODOLOGY_DEEP_DIVES: Phase2MetricId[] = ["halstead", "mi", "cognitive", "reactShare"];

const LENS_ROWS = [
  {
    lens: "Lexical",
    metric: "Halstead volume",
    purpose: 'Measures "wordiness" and implementation bloat.',
    reference: "Imai (2022)",
  },
  {
    lens: "Structural",
    metric: "Cyclomatic complexity",
    purpose: "Counts logical decision paths (if / else / loops).",
    reference: "McCabe (1976)",
  },
  {
    lens: "Cognitive",
    metric: "Cognitive complexity",
    purpose: "Measures mental effort to simulate execution (nesting-weighted).",
    reference: "SonarSource / Blekinge (2025)",
  },
  {
    lens: "Structural (UI)",
    metric: "React component share",
    purpose: "Density of UI-layer functions vs logic; isolates whether hotspots concentrate in React code.",
    reference: "Engine heuristic",
  },
] as const;

type MetricBody = {
  title: string;
  short: string;
  citation: string;
  description: string;
  formulas: string[];
  significance: string;
  /** Optional note between definition and formulas (e.g. cognitive nesting rule). */
  calculationNote?: string;
  /** When set, formulas + heuristic block are shown before the generic calculationNote path (React share). */
  formulaFirst?: boolean;
  /** Numbered heuristic criteria (e.g. React component labeling). */
  heuristicBullets?: string[];
  /** Narrative bullets for RQ3 interpretation. */
  rq3Bullets?: string[];
  /** Roadmap / dashboard note (e.g. sub-population toggle). */
  futureDashboardNote?: string;
};

function metricBody(id: Phase2MetricId): MetricBody | null {
  switch (id) {
    case "halstead":
      return {
        title: "Halstead complexity (lexical volume)",
        short: "Halstead V",
        citation: "Imai, S. (2022). Is GitHub Copilot a substitute for human programmers? A pilot study on software quality. IST.",
        description:
          "Measures the length and vocabulary of a program. In the context of AI, high volume often indicates “boilerplate bloat.”",
        calculationNote:
          "Let n₁ and n₂ be unique operators and operands, and N₁ and N₂ total counts.",
        formulas: [
          "V = (N_1 + N_2) \\log_2(n_1 + n_2)",
          "D = \\dfrac{n_1}{2} \\cdot \\dfrac{N_2}{n_2}",
        ],
        significance:
          "High volume (V) with low difficulty (D) is a primary signature of AI-generated code (Imai, 2022).",
      };
    case "cyclomatic":
      return {
        title: "Cyclomatic complexity (structural)",
        short: "CC",
        citation: "McCabe, T. J. (1976). IEEE TSE.",
        description:
          "Counts linearly independent paths through a function’s control flow—roughly: decision points plus one. It captures how branched the logic is, not how “wordy” the code reads.",
        formulas: [
          "\\mathrm{CC}(G) = E - N + 2P \\quad \\text{(McCabe; } E\\text{: edges, } N\\text{: nodes, } P\\text{: connected pieces)}",
        ],
        significance:
          "Pairs with Halstead (lexical) and cognitive (nesting) metrics to locate the verification gap: complex control with opaque surface area is harder to defend in review.",
      };
    case "cognitive":
      return {
        title: "Cognitive complexity",
        short: "Cognitive",
        citation:
          "Jönsson, A., & Wehbi, N. (2025). Evaluating code quality of AI-generated mobile applications. Blekinge Institute of Technology.",
        description:
          "Unlike cyclomatic complexity, which counts logic, cognitive complexity weights nesting. It answers: how hard is this for a human to hold in their head?",
        calculationNote:
          "Starts at 0. Each nested control structure (if, for, switch) adds +1 plus its current nesting depth.",
        formulas: [
          "\\mathrm{CoC} = \\sum \\bigl(\\text{weight of each structure} + \\text{nesting level}\\bigr)",
        ],
        significance:
          "Key indicator for the verification gap (Jönsson & Wehbi, 2025): complexity a reviewer must mentally simulate without a matching student explanation.",
      };
    case "mi":
      return {
        title: "Maintainability index (GRAD-AI standard)",
        short: "MI_norm / MI_raw",
        citation:
          "Gambo, I., et al. (2025). GRAD-AI: An automated grading tool for code assessment. Education and Information Technologies.",
        description:
          "A composite score (0–100) indicating the relative ease of maintaining the code. Coefficients follow the GRAD-AI (2025) study for academic assessment (not the older Coleman-style composite).",
        formulas: [
          "\\mathrm{MI}_{raw} = 171 - 5.2\\ln(V) - 0.23\\,\\mathrm{CC} - 16.2\\ln(\\mathrm{LOC})",
          "\\mathrm{MI}_{norm} = \\max\\left(0, \\dfrac{\\mathrm{MI}_{raw} \\cdot 100}{171}\\right)",
        ],
        significance:
          "Thresholds: >85 high, 65–84 moderate, <65 low / technical debt. Per-function MI_norm here is GRAD-AI–normalized; repo-level maintainability.score may still reflect Coleman-style tooling elsewhere.",
      };
    case "reactShare":
      return {
        title: "React component share",
        short: "React share",
        citation:
          "Heuristic: @repo-metrics/engine (Tree-sitter). React maintainability context: Bollu, P. (2024). Tampere University.",
        description:
          "Structural density: what percentage of analyzed functions live in the UI layer (React components) versus general logic. As a domain filter for RQ3, it helps isolate whether quality decay is repo-wide or concentrated in AI-assisted UI code.",
        formulaFirst: true,
        formulas: [
          "\\text{React Component Share} = \\dfrac{\\text{Count of heuristic-matched components}}{\\text{Total number of functions}} \\times 100",
        ],
        calculationNote:
          "The engine runs a single-pass Tree-sitter analysis and does not invoke the full TypeScript type checker (too slow for batch runs). Labeling matches @repo-metrics/engine:",
        heuristicBullets: [
          "File extension: only functions in .tsx files are eligible.",
          "Component signal: labeled true if the function name is PascalCase (e.g. ResultsDashboard) or if the body contains JSX (jsx_element, jsx_self_closing_element, or jsx_fragment)—.tsx is required; both checks are disjunctive (OR), not a three-part AND.",
        ],
        significance:
          "Use the share together with per-file or per-component flags: if a modest fraction of functions are UI-labeled but most “red” rows land in .tsx files, you have evidence that AI-heavy UI work—not utilities—is driving hotspots.",
        rq3Bullets: [
          "AI “playground”: tools like Copilot or v0 are often used more for UI than for backend logic—cross-reference this share with where complexity or debt clusters to localize stickier technical debt.",
          "Normalizing complexity: avoids skew from thousands of tiny helpers vs. a few heavy components; supports comparing MI or Halstead in a React sub-population vs. pure-logic functions.",
          "Verification gap: UI is often validated in the browser; this label lets you ask whether review rigor drops for React-labeled functions even when integration tests pass.",
        ],
        futureDashboardNote:
          "Dashboard roadmap: a sub-population toggle (React-labeled vs pure logic) for Phase 2 aggregates would make these comparisons explicit in one click.",
      };
    default:
      return null;
  }
}

/** Body for MetricCard `metricHelp.children` — matches MetricHelpButton dialog content. */
export function Phase2MetricHelpDialogContent({ metricId }: { metricId: Phase2MetricId }) {
  const body = metricBody(metricId);
  if (!body) return null;
  return (
    <>
      <p className="text-muted-foreground leading-relaxed">{body.description}</p>
      <MetricBodySections body={body} variant="dialog" />
      <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
        <span className="text-foreground font-medium">Citation: </span>
        {body.citation}
      </p>
    </>
  );
}

export function getPhase2MetricHelpTitle(metricId: Phase2MetricId): string {
  return metricBody(metricId)?.title ?? metricId;
}

function MetricBodySections({
  body,
  variant,
}: {
  body: MetricBody;
  variant: "dialog" | "collapsible";
}) {
  const significanceHeading = variant === "dialog" ? "Why it matters" : "Significance";
  const formulaBlock = (
    <div>
      <p className="text-foreground mb-2 text-sm font-medium">Formulas</p>
      {body.formulas.map((tex) => (
        <MathBlock key={tex}>{tex}</MathBlock>
      ))}
    </div>
  );

  const heuristicBlock =
    body.heuristicBullets && body.heuristicBullets.length > 0 ? (
      <div className="space-y-2">
        {body.calculationNote ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{body.calculationNote}</p>
        ) : null}
        <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
          {body.heuristicBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    ) : null;

  if (body.formulaFirst) {
    return (
      <div className="space-y-3 text-sm">
        {formulaBlock}
        {heuristicBlock}
        <div>
          <p className="text-foreground mb-1 font-medium">{significanceHeading}</p>
          <p className="text-muted-foreground leading-relaxed">{body.significance}</p>
        </div>
        {body.rq3Bullets && body.rq3Bullets.length > 0 ? (
          <div className="space-y-2">
            <p className="text-foreground font-medium">Why this matters for RQ3</p>
            <ul className="text-muted-foreground list-disc space-y-2 pl-5 leading-relaxed">
              {body.rq3Bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {body.futureDashboardNote ? (
          <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">{body.futureDashboardNote}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {body.calculationNote ? (
        <p className="text-muted-foreground leading-relaxed">{body.calculationNote}</p>
      ) : null}
      {formulaBlock}
      <div>
        <p className="text-foreground mb-1 font-medium">{significanceHeading}</p>
        <p className="text-muted-foreground leading-relaxed">{body.significance}</p>
      </div>
      {body.rq3Bullets && body.rq3Bullets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-foreground font-medium">Why this matters for RQ3</p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-5 leading-relaxed">
            {body.rq3Bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {body.futureDashboardNote ? (
        <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">{body.futureDashboardNote}</p>
      ) : null}
    </div>
  );
}

export function Phase2MethodologyCard({
  className,
  includeReactLens = true,
}: {
  className?: string;
  /** When false, React component share is omitted (no .tsx in analyzed repo). */
  includeReactLens?: boolean;
}) {
  const lensRows = includeReactLens
    ? LENS_ROWS
    : LENS_ROWS.filter((row) => row.lens !== "Structural (UI)");
  const methodologyIds = includeReactLens
    ? METHODOLOGY_DEEP_DIVES
    : METHODOLOGY_DEEP_DIVES.filter((id) => id !== "reactShare");

  return (
    <Card className={cn("border-muted-foreground/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">The Research Lens</CardTitle>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <strong className="text-foreground font-medium">The Research Lens: </strong>
          We analyze software quality through three distinct but overlapping lenses to identify the{" "}
          <strong className="text-foreground font-medium">verification gap</strong>
          —where code complexity exceeds a student&apos;s ability to maintain or explain it.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lens</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="whitespace-nowrap">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lensRows.map((row) => (
                <TableRow key={row.lens}>
                  <TableCell className="font-medium">{row.lens}</TableCell>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[min(28rem,55vw)]">
                    {row.purpose}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {row.reference}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <details className="group rounded-md border border-primary/20 bg-primary/[0.03] px-4 py-3 text-sm">
          <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 font-medium [&::-webkit-details-marker]:hidden">
            <span>Definitions &amp; formulas (metric glossary)</span>
            <span className="text-muted-foreground text-xs font-normal group-open:hidden">Expand</span>
            <span className="text-muted-foreground hidden text-xs font-normal group-open:inline">Collapse</span>
          </summary>
          <div className="mt-4 space-y-8 border-t border-border pt-4">
            {methodologyIds.map((id) => {
              const body = metricBody(id);
              if (!body) return null;
              return (
                <section key={id} className="space-y-3">
                  <h4 className="text-foreground text-[0.9375rem] font-semibold leading-snug">{body.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{body.description}</p>
                  <MetricBodySections body={body} variant="collapsible" />
                  <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
                    <span className="text-foreground font-medium">Citation: </span>
                    {body.citation}
                  </p>
                </section>
              );
            })}
          </div>
        </details>

        <details className="group rounded-md border bg-muted/20 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
            How to read this table
            <span className="text-muted-foreground text-xs font-normal group-open:hidden">
              Show
            </span>
            <span className="text-muted-foreground text-xs font-normal hidden group-open:inline">
              Hide
            </span>
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Use <strong className="text-foreground">CC</strong> and{" "}
              <strong className="text-foreground">cognitive</strong> together: branching vs. nested mental load.
            </li>
            <li>
              <strong className="text-foreground">Halstead V</strong> flags lexical heaviness; cross-check with MI
              and reviews for “bloat without insight.”
            </li>
            <li>
              <strong className="text-foreground">MI_norm</strong> (0–100) summarizes maintainability under the GRAD-AI
              formula; red or low bands deserve narrative justification, not automatic blame.
            </li>
            {includeReactLens ? (
              <li>
                <strong className="text-foreground">React component share</strong> is a structural density / domain
                filter: compare it to where flagged rows cluster to see if decay is UI-heavy vs repo-wide (see glossary
                for the heuristic).
              </li>
            ) : null}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}

export function MetricHelpButton({
  metricId,
  label,
  className,
  align = "right",
}: {
  metricId: Phase2MetricId;
  label: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const titleId = useId();
  const descId = useId();
  const body = metricBody(metricId);
  if (!body) return <span className={className}>{label}</span>;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        align === "right" && "justify-end",
        align === "left" && "justify-start",
        className,
      )}
    >
      {label ? <span>{label}</span> : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={`Methodology: ${body.short}`}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent
          className={cn(
            "max-h-[min(90vh,40rem)] overflow-y-auto",
            metricId === "reactShare" ? "sm:max-w-2xl" : "sm:max-w-xl",
          )}
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <DialogHeader>
            <DialogTitle id={titleId}>{body.title}</DialogTitle>
            <DialogDescription id={descId} className="text-left">
              {body.description}
            </DialogDescription>
          </DialogHeader>
          <MetricBodySections body={body} variant="dialog" />
          <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
            <span className="text-foreground font-medium">Citation: </span>
            {body.citation}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Phase2ReferencesFooter() {
  return (
    <div className="rounded-lg border p-4 text-sm space-y-3 text-muted-foreground">
      <p className="font-medium text-foreground">References</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Imai, S. (2022). Is GitHub Copilot a substitute for human programmers? A pilot study on software quality.{" "}
          <em>Information and Software Technology</em>.
        </li>
        <li>
          Gambo, I., et al. (2025). GRAD-AI: An automated grading tool for code assessment.{" "}
          <em>Education and Information Technologies</em>.
        </li>
        <li>
          Jönsson, A., &amp; Wehbi, N. (2025). Evaluating code quality of AI-generated mobile applications. Blekinge
          Institute of Technology.
        </li>
        <li>
          Bollu, P. (2024). Ensuring maintainability in React web applications. Tampere University.
        </li>
      </ol>
      <p className="border-t pt-3 text-xs leading-relaxed">
        <span className="text-foreground font-medium">Coleman vs. GRAD-AI: </span>
        Repository-level <code className="rounded bg-muted px-1">maintainability.score</code> may follow a
        Coleman-style composite from classic tooling; per-function{" "}
        <code className="rounded bg-muted px-1">MI_norm</code> / <code className="rounded bg-muted px-1">MI_raw</code>{" "}
        in this tab use the GRAD-AI (2025) coefficients so committee-facing charts stay aligned with current
        AI-in-education instrumentation.
      </p>
    </div>
  );
}
