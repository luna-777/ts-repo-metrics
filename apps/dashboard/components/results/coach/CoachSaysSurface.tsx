import * as React from "react";

import { cn } from "@/lib/utils";

export interface CoachSaysSurfaceProps extends React.ComponentProps<"div"> {
  /** Figma global card uses a thick left rail; tab paragraph variant omits it. */
  showAccent?: boolean;
}

export function CoachSaysSurface({
  className,
  showAccent = true,
  ...props
}: CoachSaysSurfaceProps) {
  return (
    <div
      data-slot="coach-says-surface"
      className={cn(
        "w-full min-w-0 rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        showAccent && "border-l-[3px] border-l-primary",
        "p-6 sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
