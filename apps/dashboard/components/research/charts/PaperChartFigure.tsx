import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PaperChartFigure({
  figNum,
  caption,
  captionFootnote,
  children,
  figureClassName,
  chartClassName,
}: {
  figNum: number;
  caption: ReactNode;
  captionFootnote?: ReactNode;
  children: ReactNode;
  figureClassName?: string;
  /** Min height / flex for chart region */
  chartClassName?: string;
}) {
  return (
    <figure className={cn("my-10 min-w-0 w-full scroll-mt-28 space-y-3", figureClassName)}>
      <div className={cn("min-h-0 w-full min-w-0 shrink-0", chartClassName)}>{children}</div>
      <figcaption className="text-center text-xs text-muted-foreground">
        Figure {figNum} — {caption}
        {captionFootnote ? (
          <span className="mt-1 block text-[0.7rem] leading-snug text-muted-foreground/90">{captionFootnote}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
