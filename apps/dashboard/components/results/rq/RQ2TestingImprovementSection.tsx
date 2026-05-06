"use client";

import { cn } from "@/lib/utils";

interface RQ2TestingImprovementSectionProps {
  /** Switch parent results tabs to Code Quality (hotspot metrics). */
  onOpenCodeQualityTab?: () => void;
  className?: string;
}

const linkButtonClass =
  "font-inherit text-primary underline-offset-4 hover:text-primary/90 hover:underline";

/**
 * Static “How to improve your Testing score” card (UCSC / Figma reference).
 * Uses theme tokens so the panel contrasts with the page in light and dark mode.
 */
export function RQ2TestingImprovementSection({
  onOpenCodeQualityTab,
  className,
}: RQ2TestingImprovementSectionProps) {
  const codeQualityTabControl =
    onOpenCodeQualityTab != null ? (
      <button type="button" onClick={onOpenCodeQualityTab} className={linkButtonClass}>
        Code Quality tab
      </button>
    ) : (
      <span className="text-primary">Code Quality tab</span>
    );

  return (
    <section
      id="testing-how-to-improve"
      aria-labelledby="testing-how-to-improve-heading"
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-md ring-1 ring-border/60 sm:p-6",
        className,
      )}
    >
      <h2
        id="rq2-how-to-improve-testing-heading"
        className="text-lg font-semibold leading-6 tracking-tight text-foreground"
      >
        How to improve your Testing score
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
          Add one test file alongside your next feature commit.
        </p>
      </div>

      <p className="mt-6 text-xs font-normal uppercase leading-4 tracking-wide text-muted-foreground">
        When you&apos;re ready for more:
      </p>

      <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-[22px] text-muted-foreground marker:text-muted-foreground">
        <li>
          Write a test for your most complex function — find it in the {codeQualityTabControl}.
        </li>
        <li>Aim for at least 30% of your commits to include test file changes this sprint.</li>
        <li>Review your existing test files and check they still cover recent features.</li>
      </ol>

      <p className="mt-5">
        <a
          href="#testing-safety-nets"
          className={cn("text-sm font-normal", linkButtonClass)}
        >
          → Explore all Testing metrics in detail
        </a>
      </p>
    </section>
  );
}
