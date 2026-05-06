"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Shared signal quality bands + no-data placeholder for results “core signals” cards. */
export type CoreSignalTier = "strong" | "good" | "needs_work" | "critical" | "no_data";

export const coreSignalTierMeta: Record<
  CoreSignalTier,
  { label: string; badgeClass: string }
> = {
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
  no_data: {
    label: "No data",
    badgeClass: "border-0 bg-muted font-medium text-muted-foreground shadow-none",
  },
};

export function CoreSignalCard({
  title,
  tier,
  value,
  description,
  badgeLabel,
  secondaryValue,
  titleInfo,
  onOpenDeepDive,
  deepDiveHint = "Open reference guide",
}: {
  title: string;
  tier: CoreSignalTier;
  value: string;
  description: string;
  /** When set, replaces the default tier name on the badge (e.g. descriptive band for one metric). */
  badgeLabel?: string;
  /** Smaller line under the main value (e.g. secondary statistic). */
  secondaryValue?: string;
  /** Hover / focus explanation next to the title (info icon). */
  titleInfo?: string;
  /** When set, the whole card is a button that opens the deep-dive dialog (keyboard-accessible). */
  onOpenDeepDive?: () => void;
  /** Accessible hint when `onOpenDeepDive` is set. */
  deepDiveHint?: string;
}) {
  const t = coreSignalTierMeta[tier];
  const interactive = Boolean(onOpenDeepDive);

  const cardInner = (
    <>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-1.5">
            <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
            {titleInfo ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 rounded-sm text-muted-foreground outline-none ring-offset-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`About: ${title}`}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Info className="size-3.5" aria-hidden strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs leading-relaxed">
                  {titleInfo}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <Badge variant="outline" className={cn("shrink-0", t.badgeClass)}>
            {badgeLabel ?? t.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0">
        <p className="text-[2rem] font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-4xl">
          {value}
        </p>
        {secondaryValue ? (
          <p className="text-sm font-medium tabular-nums text-muted-foreground">{secondaryValue}</p>
        ) : null}
        <CardDescription className="text-sm leading-snug text-muted-foreground">{description}</CardDescription>
        {interactive ? (
          <p className="text-xs font-medium text-primary">{deepDiveHint}</p>
        ) : null}
      </CardContent>
    </>
  );

  if (interactive) {
    return (
      <Card
        role="button"
        tabIndex={0}
        className={cn(
          "flex flex-col overflow-hidden border-border/80 bg-card shadow-sm outline-none transition-colors",
          "cursor-pointer hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={onOpenDeepDive}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDeepDive?.();
          }
        }}
        aria-label={`${deepDiveHint}: ${title}`}
      >
        {cardInner}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 bg-card shadow-sm outline-none focus-visible:outline-none">
      {cardInner}
    </Card>
  );
}
