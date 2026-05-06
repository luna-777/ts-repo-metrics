"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
}: {
  title: string;
  tier: CoreSignalTier;
  value: string;
  description: string;
}) {
  const t = coreSignalTierMeta[tier];
  return (
    <Card className="flex flex-col overflow-hidden border-border/80 bg-card shadow-sm outline-none focus-visible:outline-none">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
          <Badge variant="outline" className={cn("shrink-0", t.badgeClass)}>
            {t.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0">
        <p className="text-[2rem] font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-4xl">
          {value}
        </p>
        <CardDescription className="text-sm leading-snug text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
