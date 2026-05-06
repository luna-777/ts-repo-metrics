import * as React from "react";

import { cn } from "@/lib/utils";

export interface CoachPointerStripProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

export function CoachPointerStrip({ className, children, ...props }: CoachPointerStripProps) {
  return (
    <div
      data-slot="coach-pointer-strip"
      className={cn(
        "rounded-lg border border-violet-500/45 bg-violet-500/5 px-4 py-3.5 text-sm leading-snug text-foreground sm:px-[17px] sm:py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
