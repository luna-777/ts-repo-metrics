"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleHelp } from "lucide-react";
import { RQ2RiskVsVerificationBody } from "./metricHelpContent";

interface RQ2QuadrantProps {
  riskIndex: number;
  verificationIndex: number;
  riskLabel: "Low" | "High";
  verificationLabel: "Low" | "High";
}

export function RQ2Quadrant({
  riskIndex,
  verificationIndex,
  riskLabel,
  verificationLabel,
}: RQ2QuadrantProps) {
  const quadrant =
    riskLabel === "High" && verificationLabel === "Low"
      ? "High risk / Low verification"
      : riskLabel === "High" && verificationLabel === "High"
        ? "High risk / High verification"
        : riskLabel === "Low" && verificationLabel === "Low"
          ? "Low risk / Low verification"
          : "Low risk / High verification";

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <h3 className="font-medium">Risk vs Verification Profile</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="About risk vs verification indices"
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Risk vs verification profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                How the quadrant combines structural risk (complexity + long functions) with test
                density (test LOC ratio).
              </p>
              <RQ2RiskVsVerificationBody />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Risk index: </span>
          <span className="font-mono">{riskIndex.toFixed(2)}</span>
          <span className="ml-2 text-muted-foreground">({riskLabel})</span>
        </div>
        <div>
          <span className="text-muted-foreground">Verification index: </span>
          <span className="font-mono">{verificationIndex.toFixed(2)}</span>
          <span className="ml-2 text-muted-foreground">({verificationLabel})</span>
        </div>
      </div>
      <div className="rounded bg-muted/50 px-3 py-2">
        <span className="font-medium">Quadrant: </span>
        <span>{quadrant}</span>
      </div>
    </div>
  );
}
