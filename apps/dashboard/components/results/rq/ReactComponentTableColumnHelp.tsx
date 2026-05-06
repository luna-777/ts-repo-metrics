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
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Table header cell: label + help dialog (same interaction pattern as MetricCard / Phase 3).
 */
export function ReactComponentTableColumnHelp({
  label,
  title,
  children,
  align = "left",
}: {
  label: string;
  title: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-0.5",
        align === "right" && "w-full justify-end",
      )}
    >
      <span className="truncate">{label}</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={`About column: ${label}`}
          >
            <CircleHelp className="size-3" aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground">{children}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
