"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CircleHelp } from "lucide-react";
import { RQ2RiskVsVerificationBody } from "./metricHelpContent";

type QuadrantPosition = "tl" | "tr" | "bl" | "br";

interface RQ2QuadrantProps {
  riskIndex: number;
  verificationIndex: number;
  riskLabel: "Low" | "High";
  verificationLabel: "Low" | "High";
  /** When true, show that indices come from the whole-repository scan (contributor dropdown does not apply). */
  wholeRepositoryNote?: boolean;
}

const QUADRANT_COPY: Record<
  QuadrantPosition,
  { title: string; description: string }
> = {
  tl: {
    title: "Low risk / Low verification",
    description:
      "Structural risk is modest and test LOC ratio is below the dashboard threshold. Fine while complexity stays low—watch both as the codebase grows.",
  },
  tr: {
    title: "Low risk / High verification",
    description:
      "Strong verification density relative to structural risk—the sweet spot for this coarse view.",
  },
  bl: {
    title: "High risk / Low verification",
    description:
      "Complex areas with comparatively little test code in the tree. Bugs are harder to catch and fix without more verification near hotspots.",
  },
  br: {
    title: "High risk / High verification",
    description:
      "Complexity is elevated but test density helps offset it. Keep tightening remaining hotspots.",
  },
};

function activePosition(
  riskLabel: "Low" | "High",
  verificationLabel: "Low" | "High",
): QuadrantPosition {
  const lowRisk = riskLabel === "Low";
  const lowVer = verificationLabel === "Low";
  if (lowRisk && lowVer) return "tl";
  if (lowRisk && !lowVer) return "tr";
  if (!lowRisk && lowVer) return "bl";
  return "br";
}

function narrativeForActive(pos: QuadrantPosition): string {
  switch (pos) {
    case "tl":
      return "Structural risk is low, but verification density (test LOC ratio) is also low. You have runway—add tests before complexity climbs.";
    case "tr":
      return "Verification density looks healthy relative to structural risk. Maintain this balance as features and complexity evolve.";
    case "bl":
      return "Structural risk is high while verification density (test LOC ratio) is low. This combination deserves attention first—increase tests or simplify risky areas.";
    case "br":
      return "Complexity is high, but test density is helping. Continue focusing reviews and tests on the highest-risk functions.";
  }
}

export function RQ2Quadrant({
  riskIndex,
  verificationIndex,
  riskLabel,
  verificationLabel,
  wholeRepositoryNote = false,
}: RQ2QuadrantProps) {
  const active = activePosition(riskLabel, verificationLabel);
  const narrative = narrativeForActive(active);

  function cell(position: QuadrantPosition) {
    const { title, description } = QUADRANT_COPY[position];
    const isHere = active === position;
    const isIdeal = position === "tr";

    return (
      <div
        role="group"
        aria-label={`${title}. ${description}${isHere ? " Current zone." : ""}`}
        className={cn(
          "relative flex min-h-[7.5rem] flex-col gap-1 rounded-lg border p-3 transition-colors sm:min-h-[8.25rem]",
          "bg-card text-card-foreground",
          isIdeal
            ? "border-emerald-600/40 bg-emerald-50/90 dark:border-emerald-500/35 dark:bg-emerald-950/35"
            : "border-border bg-muted/25 dark:bg-muted/15",
          isHere &&
            cn(
              "z-[1] ring-2 ring-offset-2 ring-offset-background",
              position === "bl"
                ? "ring-destructive/80"
                : isIdeal
                  ? "ring-emerald-600 dark:ring-emerald-500"
                  : "ring-primary",
            ),
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {isIdeal ? (
            <Badge
              variant="outline"
              className="border-emerald-600/50 text-emerald-800 dark:border-emerald-500/50 dark:text-emerald-200"
            >
              Ideal
            </Badge>
          ) : null}
          {isHere ? (
            <Badge variant="secondary" className="font-semibold">
              You are here
            </Badge>
          ) : null}
        </div>
        <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    );
  }

  const showImproveCta = active !== "tr";

  return (
    <div className="rounded-xl border bg-muted/20 p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Your risk profile
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Structural risk from complexity + long functions versus verification density (test LOC ratio)—not
            instrumented line coverage.
          </p>
          {wholeRepositoryNote ? (
            <p className="text-xs font-medium text-amber-900/90 dark:text-amber-200/90">
              Based on the whole-repository scan; unchanged when you pick a contributor above.
            </p>
          ) : null}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="How risk and verification indices are calculated"
            >
              <CircleHelp className="size-4" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Risk vs verification profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                How the quadrant combines structural risk (complexity + long functions) with verification
                density (test LOC ratio).
              </p>
              <RQ2RiskVsVerificationBody />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
        <div className="min-w-0 flex-1 space-y-2">
          <div
            className="grid gap-x-2 gap-y-2"
            style={{ gridTemplateColumns: "auto minmax(0, 1fr) minmax(0, 1fr)" }}
          >
            <div className="min-h-4" />
            <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Low verification
            </div>
            <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              High verification
            </div>

            <div className="flex max-w-[6.5rem] items-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:max-w-none sm:text-xs">
              Low structural risk
            </div>
            {cell("tl")}
            {cell("tr")}

            <div className="flex max-w-[6.5rem] items-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:max-w-none sm:text-xs">
              High structural risk
            </div>
            {cell("bl")}
            {cell("br")}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col justify-center gap-5 rounded-lg border bg-background p-5 lg:max-w-sm xl:max-w-md">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Risk index
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-3xl font-semibold tabular-nums tracking-tight",
                  riskLabel === "High" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400",
                )}
              >
                {riskIndex.toFixed(2)}
              </span>
              <Badge variant={riskLabel === "High" ? "destructive" : "outline"}>{riskLabel}</Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Verification index
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-3xl font-semibold tabular-nums tracking-tight",
                  verificationLabel === "High"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-500",
                )}
              >
                {verificationIndex.toFixed(2)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  verificationLabel === "Low" &&
                    "border-amber-600/50 text-amber-900 dark:border-amber-500/50 dark:text-amber-100",
                )}
              >
                {verificationLabel}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm leading-relaxed text-foreground">{narrative}</p>
            {showImproveCta ? (
              <p className="mt-4">
                <a
                  href="#rq2-safety-nets"
                  className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  → Jump to safety-net metrics
                </a>
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Keep pairing complexity reviews with test proximity checks as you ship.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
