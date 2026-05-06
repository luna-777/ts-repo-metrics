"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phase2MetricHelpDialogContent } from "./MetricGlossary";

export type Phase2DeepDiveId = "mi" | "cognitive" | "halstead" | "uiArchitecture";

const DEEP_DIVE_TITLES: Record<Phase2DeepDiveId, string> = {
  mi: "Maintainability index — reference guide",
  cognitive: "Cognitive complexity — reference guide",
  halstead: "Halstead complexity — reference guide",
  uiArchitecture: "UI component architecture — reference guide",
};

function ExternalReading({
  items,
}: {
  items: readonly { href: string; title: string; note: string }[];
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Further reading
      </h3>
      <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {item.title}
            </a>
            <span className="text-muted-foreground"> — {item.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlainSummary({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        At a glance
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function DashboardUsage({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        In this dashboard
      </h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function MiDeepDiveBody() {
  return (
    <>
      <PlainSummary>
        <p>
          The <strong>maintainability index (MI)</strong> combines size and complexity signals—classically
          Halstead volume, cyclomatic complexity, and lines of code—into one score meant to reflect how
          costly changes and reviews are likely to be. Higher values usually mean easier maintenance on
          average; derivatives differ slightly (natural log vs. log₂, comment terms, normalization to
          0–100).
        </p>
        <p>
          A common form is{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            MI ≈ 171 − 5.2·ln(V) − 0.23·CC − 16.2·ln(LOC)
          </code>{" "}
          before tooling-specific scaling (as in Visual Studio and related write-ups).
        </p>
      </PlainSummary>
      <ExternalReading
        items={[
          {
            href: "https://www.projectcodemeter.com/cost_estimation/help/GL_maintainability.htm",
            title: "Maintainability Index (MI) — ProjectCodeMeter",
            note: "Overview of MI, original factored formula, and Visual-Studio-style normalization.",
          },
        ]}
      />
      <DashboardUsage>
        <p>
          This tab shows per-function{" "}
          <strong className="text-foreground">MI_norm</strong> and repo means. Those definitions follow
          the GRAD-AI-style normalization used by the engine—see formulas below.
        </p>
      </DashboardUsage>
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Definitions &amp; formulas (engine)
        </p>
        <Phase2MetricHelpDialogContent metricId="mi" />
      </div>
    </>
  );
}

function CognitiveDeepDiveBody() {
  return (
    <>
      <PlainSummary>
        <p>
          <strong>Cognitive complexity</strong> targets how hard code is for a <em>person</em> to read and
          simulate, not just how many branches exist. Nesting, abrupt control flow, and structural
          shortcuts (e.g. breaks, nested ternaries) tend to increase the score more than flat sequences of
          simple checks.
        </p>
        <p>
          Practitioners often use static rules (increment per structure, extra weight with depth) so teams
          can compare hotspots objectively in review and CI—similar in spirit to tools that publish
          cognitive-complexity rulesets.
        </p>
      </PlainSummary>
      <ExternalReading
        items={[
          {
            href: "https://enji.ai/glossary/cognitive-complexity/",
            title: "What is cognitive complexity? — Enji glossary",
            note: "Plain-language motivations: readability, nesting, and reducing mental load.",
          },
        ]}
      />
      <DashboardUsage>
        <p>
          Outliers here pair with <strong className="text-foreground">cyclomatic</strong> and{" "}
          <strong className="text-foreground">Halstead</strong> columns: branching vs. lexical weight vs.
          perceived mental load.
        </p>
      </DashboardUsage>
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Definitions &amp; formulas (engine)
        </p>
        <Phase2MetricHelpDialogContent metricId="cognitive" />
      </div>
    </>
  );
}

function HalsteadDeepDiveBody() {
  return (
    <>
      <PlainSummary>
        <p>
          <strong>Halstead metrics</strong> are computed statically from counts of operators and operands:
          how many distinct symbols appear versus how often they are used. From those, classic measures
          include <strong>program length</strong>, <strong>volume</strong>{" "}
          <em>V = N × log₂(η)</em>, <strong>difficulty</strong>, and <strong>effort</strong>, which relate
          lexical &quot;size&quot; of an implementation to estimated comprehension and cost—not runtime
          on a specific machine.
        </p>
      </PlainSummary>
      <ExternalReading
        items={[
          {
            href: "https://en.wikipedia.org/wiki/Halstead_complexity_measures",
            title: "Halstead complexity measures — Wikipedia",
            note: "Formal definitions of η₁, η₂, N₁, N₂, volume, difficulty, and effort.",
          },
        ]}
      />
      <DashboardUsage>
        <p>
          The dashboard reports <strong className="text-foreground">Halstead volume</strong> per function
          and distributional summaries (mean, p90). High volume often tracks &quot;heavy&quot; or
          repetitive surface area in a single function.
        </p>
      </DashboardUsage>
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Definitions &amp; formulas (engine)
        </p>
        <Phase2MetricHelpDialogContent metricId="halstead" />
      </div>
    </>
  );
}

function UiArchitectureDeepDiveBody() {
  return (
    <>
      <PlainSummary>
        <p>
          Solid <strong>UI component architecture</strong> keeps boundaries clear: small, cohesive
          components with predictable props and data flow are easier to test, review, and refactor than
          large &quot;god&quot; components. Patterns such as composition, single responsibility, and
          isolating side effects reduce the chance that complexity metrics spike only in the presentation
          layer.
        </p>
        <p>
          When this tab shows a high <strong>React share</strong> and red rows concentrated in{" "}
          <code className="rounded bg-muted px-1">.tsx</code>, it is a cue to apply those design habits
          locally—not to chase numbers for their own sake.
        </p>
      </PlainSummary>
      <ExternalReading
        items={[
          {
            href: "https://medium.com/@patelava/mastering-ui-component-architecture-principles-patterns-and-practical-tips-b44cc667daad",
            title: "Mastering UI component architecture (Medium)",
            note: "Principles, patterns, and practical tips for structuring components.",
          },
        ]}
      />
      <DashboardUsage>
        <p>
          Use <strong className="text-foreground">React component share</strong> and per-row labels to see
          whether hotspots concentrate in UI code; cross-check with cognitive and Halstead outliers.
        </p>
      </DashboardUsage>
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          React share heuristic (engine)
        </p>
        <Phase2MetricHelpDialogContent metricId="reactShare" />
      </div>
    </>
  );
}

export function Phase2MetricDeepDiveDialog({
  open,
  onOpenChange,
  metricId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricId: Phase2DeepDiveId | null;
}) {
  const id = metricId;
  const title = id ? DEEP_DIVE_TITLES[id] : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,52rem)] w-[calc(100vw-1.5rem)] max-w-[min(96rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-lg leading-snug pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {id === "mi" ? <MiDeepDiveBody /> : null}
          {id === "cognitive" ? <CognitiveDeepDiveBody /> : null}
          {id === "halstead" ? <HalsteadDeepDiveBody /> : null}
          {id === "uiArchitecture" ? <UiArchitectureDeepDiveBody /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}