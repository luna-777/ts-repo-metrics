"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp, HelpCircle } from "lucide-react";
import type { RQId } from "@/lib/rqConfig";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  rq: RQId;
  /** When true, hide the RQ1/RQ2/RQ3 badge (e.g. student-facing How we work tab). */
  hideResearchBadge?: boolean;
  /** One-line context shown under the value (lighter text). */
  description?: string;
  /** Short hover hint when no metricHelp; or one-line lead-in at the top of the dialog when metricHelp is set. */
  tooltip?: string;
  /** Rich explanation in a dialog (same pattern as Phase 3 KPI cards). */
  metricHelp?: {
    title: string;
    children: ReactNode;
  };
}

export function MetricCard({
  label,
  value,
  rq,
  hideResearchBadge = false,
  description,
  tooltip,
  metricHelp,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="flex items-center gap-2">
          {hideResearchBadge ? null : (
            <Badge variant="secondary" className="text-xs">
              {rq}
            </Badge>
          )}
          {metricHelp ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={`About: ${label}`}
                >
                  <CircleHelp className="size-3.5" aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{metricHelp.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm text-foreground">
                  {tooltip ? (
                    <p className="text-muted-foreground leading-relaxed">{tooltip}</p>
                  ) : null}
                  {metricHelp.children}
                </div>
              </DialogContent>
            </Dialog>
          ) : tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-4 text-muted-foreground cursor-help" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {description ? (
          <p className="mt-2 text-sm leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
