"use client";

import { OverviewCard, type OverviewCardItem } from "./OverviewCard";
import { cn } from "@/lib/utils";

export type { OverviewCardItem } from "./OverviewCard";

interface OverviewCardsStripProps {
  items: OverviewCardItem[];
  selectedId?: string | null;
  className?: string;
}

export function OverviewCardsStrip({
  items,
  selectedId = null,
  className,
}: OverviewCardsStripProps) {
  const hasSelection = selectedId != null && selectedId !== "";

  return (
    <div
      className={cn(
        "-mx-1 overflow-x-auto overflow-y-visible pb-1 pt-1 [scrollbar-width:thin]",
        hasSelection && "pt-2",
        className,
      )}
    >
      <div
        className="flex w-max min-w-full gap-4 px-1 sm:grid sm:w-full sm:grid-cols-5 sm:gap-4"
        role="list"
      >
        {items.map((item) => (
          <div key={item.id} className="sm:min-w-0" role="listitem">
            <OverviewCard item={item} selected={item.id === selectedId} />
          </div>
        ))}
      </div>
    </div>
  );
}
