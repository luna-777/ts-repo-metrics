"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConceptHelpDialogProps {
  title: string;
  /** Accessible name for the trigger (defaults to About: title). */
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}

/** Compact ? trigger opening a help dialog — matches MetricCard metricHelp pattern. */
export function ConceptHelpDialog({
  title,
  ariaLabel,
  children,
  className,
  iconClassName,
}: ConceptHelpDialogProps) {
  const label = ariaLabel ?? `About: ${title}`;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "text-muted-foreground hover:text-foreground shrink-0",
            className,
          )}
          aria-label={label}
        >
          <CircleHelp className={cn("size-3.5", iconClassName)} aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-foreground">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
