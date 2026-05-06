import * as React from "react";

import { cn } from "@/lib/utils";

const toneStyles = {
  positive: "border-l-green-500 bg-green-500/5",
  concern: "border-l-red-500 bg-red-500/5",
  informational: "border-l-primary bg-primary/5",
} as const;

export type CoachInsightToneKind = keyof typeof toneStyles;

export interface CoachInsightToneProps extends React.ComponentProps<"div"> {
  tone: CoachInsightToneKind;
  title?: string;
  /** Applied to the body wrapper (below title). */
  bodyClassName?: string;
  children: React.ReactNode;
}

export function CoachInsightTone({
  tone,
  title,
  bodyClassName,
  children,
  className,
  ...props
}: CoachInsightToneProps) {
  return (
    <div
      data-slot="coach-insight-tone"
      data-tone={tone}
      className={cn(
        "rounded-[10px] border-l-[3px] py-3.5 pl-5 pr-4 sm:py-4 sm:pl-5",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {title ? (
        <p className="text-[15px] font-semibold leading-snug text-foreground sm:text-base">
          {title}
        </p>
      ) : null}
      <div
        className={cn(
          "text-pretty break-words text-sm leading-relaxed text-muted-foreground",
          title && "mt-3",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
