"use client";

import { cn } from "@/lib/utils";

const linkButtonClass =
  "font-inherit text-primary underline-offset-4 hover:text-primary/90 hover:underline";

export function RQ1MomentumPanel({ className }: { className?: string }) {
  return (
    <section
      id="rq1-momentum"
      aria-labelledby="rq1-momentum-heading"
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-md ring-1 ring-border/60 sm:p-6",
        className,
      )}
    >
      <h2
        id="rq1-momentum-heading"
        className="text-lg font-semibold leading-6 tracking-tight text-foreground"
      >
        Keep the momentum going
      </h2>

      <div
        className={cn(
          "mt-4 rounded-lg border-l-[3px] border-l-primary bg-primary/[0.07] px-4 py-3 pl-5 sm:px-5 sm:py-4",
        )}
      >
        <p className="text-[11px] font-normal uppercase leading-normal tracking-wide text-primary">
          Keep going
        </p>
        <p className="mt-3 text-sm font-normal leading-5 text-foreground">
          Hold a steady commit rhythm—small integrations beat rare big drops, even when features
          feel “almost done.”
        </p>
      </div>

      <p className="mt-6 text-xs font-normal uppercase leading-4 tracking-wide text-muted-foreground">
        Want to go further
      </p>

      <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-[22px] text-muted-foreground marker:text-muted-foreground">
        <li>Pair commits with tests or checks when you touch production logic.</li>
        <li>Balance ownership: share hot files so knowledge—and review load—doesn’t sit on one person.</li>
        <li>Prefer clear subjects and scoped diffs so history stays searchable.</li>
      </ol>

      <p className="mt-5">
        <a href="#rq1-core-signals" className={cn("text-sm font-normal", linkButtonClass)}>
          → Explore all Commit Habits metrics in detail
        </a>
      </p>
    </section>
  );
}
