"use client";

import { cn } from "@/lib/utils";
import type { Phase2FunctionRow } from "@/lib/phase2Summary";

interface Phase2ComplexityImprovementSectionProps {
  topOutlier: Phase2FunctionRow | null;
  onOpenCodeQualityTab?: () => void;
  className?: string;
}

const linkButtonClass =
  "font-inherit text-primary underline-offset-4 hover:text-primary/90 hover:underline";

export function Phase2ComplexityImprovementSection({
  topOutlier,
  onOpenCodeQualityTab,
  className,
}: Phase2ComplexityImprovementSectionProps) {
  const codeQualityControl =
    onOpenCodeQualityTab != null ? (
      <button type="button" onClick={onOpenCodeQualityTab} className={linkButtonClass}>
        Code Quality tab
      </button>
    ) : (
      <span className="text-primary">Code Quality tab</span>
    );

  const fn = topOutlier?.fn;
  const name = fn?.name ?? "your worst outlier";
  const vol = fn?.halstead?.volume;
  const cog = fn?.cognitiveComplexity;

  return (
    <section
      id="phase2-how-to-improve"
      aria-labelledby="phase2-how-to-improve-heading"
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-md ring-1 ring-border/60 sm:p-6",
        className,
      )}
    >
      <h2
        id="phase2-how-to-improve-heading"
        className="text-lg font-semibold leading-6 tracking-tight text-foreground"
      >
        How to improve your Code Complexity score
      </h2>

      <div
        className={cn(
          "mt-4 rounded-lg border-l-[3px] border-l-primary bg-primary/[0.07] px-4 py-3 pl-5 sm:px-5 sm:py-4",
        )}
      >
        <p className="text-[11px] font-normal uppercase leading-normal tracking-wide text-primary">
          Start here
        </p>
        <p className="mt-3 text-sm font-normal leading-5 text-foreground">
          Simplify the <strong className="font-medium text-foreground">{name}</strong> function
          {vol !== undefined && cog !== undefined ? (
            <>
              {" "}
              — it has a Halstead volume of <strong className="font-medium text-foreground">{vol.toFixed(1)}</strong>{" "}
              and cognitive complexity of <strong className="font-medium text-foreground">{cog}</strong>. Break it into
              smaller focused functions.
            </>
          ) : (
            <> — open it from Top Complexity Outliers above and split responsibilities.</>
          )}
        </p>
      </div>

      <p className="mt-6 text-xs font-normal uppercase leading-4 tracking-wide text-muted-foreground">
        When you&apos;re ready for more:
      </p>

      <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-[22px] text-muted-foreground marker:text-muted-foreground">
        <li>
          Review all functions with MI_norm below 50—your least maintainable units on a GRAD-AI-normalized scale.
        </li>
        <li>
          Reduce nesting in the highest cognitive-complexity functions—each level adds mental load.
        </li>
        <li>
          Keep functions focused on one task—smaller surface lowers Halstead volume and improves reviewability. Pair
          refactors with checks on the {codeQualityControl}.
        </li>
      </ol>

      <p className="mt-5">
        <a href="#per-function-metrics-table" className={cn("text-sm font-normal", linkButtonClass)}>
          → Explore all Code Complexity metrics in detail
        </a>
      </p>
    </section>
  );
}
