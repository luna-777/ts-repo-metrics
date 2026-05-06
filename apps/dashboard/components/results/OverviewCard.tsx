"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResultsTabId } from "@/lib/resultsNavigation";

/** Width / height of overview tiles in design reference (~258×324). */
export const OVERVIEW_CARD_ASPECT_CLASS = "aspect-[258/324]";

export interface OverviewCardItem {
  id: string;
  title: string;
  tier: "strong" | "good" | "needs_work" | "critical";
  score: number | null;
  description: string;
  detailsLabel?: string;
  detailsHref?: string;
  /** When set, activate this results tab before following `detailsHref` (hash scroll). */
  detailsTab?: ResultsTabId;
}

const tierPositive = {
  badgeClassName:
    "border-0 bg-emerald-950 font-medium text-green-400 shadow-none",
  scoreClassName: "text-green-400",
};

const tierMeta: Record<
  OverviewCardItem["tier"],
  { label: string; badgeClassName: string; scoreClassName: string }
> = {
  strong: { label: "Strong", ...tierPositive },
  good: { label: "Good", ...tierPositive },
  needs_work: {
    label: "Needs Work",
    badgeClassName:
      "border-0 bg-amber-950 font-medium text-amber-400 shadow-none",
    scoreClassName: "text-amber-400",
  },
  critical: {
    label: "Critical",
    badgeClassName:
      "border-0 bg-red-950 font-medium text-red-400 shadow-none",
    scoreClassName: "text-red-400",
  },
};

const detailsLinkClass =
  "text-indigo-500 underline-offset-4 transition-colors hover:text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-indigo-400 dark:hover:text-indigo-300";

interface OverviewCardProps {
  item: OverviewCardItem;
  selected?: boolean;
  className?: string;
  onRequestTab?: (tab: ResultsTabId) => void;
}

export function OverviewCard({ item, selected = false, className, onRequestTab }: OverviewCardProps) {
  const tier = tierMeta[item.tier];
  const detailsLabel = item.detailsLabel ?? "View details →";

  return (
    <div className={cn("relative w-full pt-3", className)}>
      {selected ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <span className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-white/10">
            Start here
          </span>
        </div>
      ) : null}

      <Card
        className={cn(
          OVERVIEW_CARD_ASPECT_CLASS,
          "group/card flex min-h-0 w-full flex-col gap-0 overflow-visible rounded-xl border py-0 shadow-sm transition-all duration-200 ease-out",
          selected
            ? "border-red-400 shadow-[0_0_0_1px_rgb(248_113_113/0.45)]"
            : [
                "border-border hover:-translate-y-0.5 hover:border-neutral-400/55 hover:shadow-md",
                "dark:hover:border-neutral-500/60 dark:hover:shadow-lg",
              ],
          selected &&
            "hover:-translate-y-0 hover:border-red-400 hover:shadow-[0_0_0_1px_rgb(248_113_113/0.55)]",
        )}
      >
        <CardHeader className="gap-2 space-y-0 px-5 pb-3 pt-5">
          <CardTitle className="text-sm font-semibold leading-snug tracking-tight text-card-foreground">
            {item.title}
          </CardTitle>
          <Badge variant="outline" className={cn("w-fit border-0 font-medium", tier.badgeClassName)}>
            {tier.label}
          </Badge>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-5 pb-3 pt-0">
          {item.score !== null ? (
            <p
              className={cn(
                "text-[2rem] font-bold leading-none tabular-nums tracking-tight transition-colors duration-200 sm:text-4xl",
                tier.scoreClassName,
              )}
            >
              {item.score}
            </p>
          ) : (
            <p className="text-[2rem] font-bold tabular-nums leading-none text-neutral-400 sm:text-4xl dark:text-neutral-500">
              —
            </p>
          )}
          <p className="text-sm leading-snug text-neutral-500 dark:text-neutral-400">
            {item.description}
          </p>
        </CardContent>
        <CardFooter className="mt-auto px-5 pb-5 pt-0">
          {item.detailsHref && item.detailsTab && onRequestTab ? (
            <Button
              type="button"
              variant="link"
              className={cn("h-auto p-0 text-sm font-medium", detailsLinkClass)}
              onClick={() => {
                onRequestTab(item.detailsTab!);
                const id = item.detailsHref!.replace(/^#/, "");
                if (!id) return;
                window.requestAnimationFrame(() => {
                  window.setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                });
              }}
            >
              {detailsLabel}
            </Button>
          ) : item.detailsHref ? (
            <Button variant="link" className={cn("h-auto p-0 text-sm font-medium", detailsLinkClass)} asChild>
              <Link href={item.detailsHref}>{detailsLabel}</Link>
            </Button>
          ) : (
            <span className="cursor-default text-sm text-neutral-500 transition-colors group-hover/card:text-neutral-600 dark:text-neutral-400 dark:group-hover/card:text-neutral-300">
              {detailsLabel}
            </span>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
