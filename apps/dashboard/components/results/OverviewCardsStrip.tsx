"use client";

import { OverviewCard, type OverviewCardItem } from "./OverviewCard";
import { cn } from "@/lib/utils";
import type { ResultsTabId } from "@/lib/resultsNavigation";

export type { OverviewCardItem } from "./OverviewCard";

interface OverviewCardsStripProps {
  items: OverviewCardItem[];
  selectedId?: string | null;
  className?: string;
  onRequestTab?: (tab: ResultsTabId) => void;
}

export function OverviewCardsStrip({
  items,
  selectedId = null,
  className,
  onRequestTab,
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
        className="flex w-max min-w-full gap-x-4 gap-y-4 px-1 sm:grid sm:w-full sm:grid-cols-5 sm:items-stretch sm:gap-4"
        role="list"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="min-w-[258px] max-w-[272px] shrink-0 sm:min-w-0 sm:max-w-none sm:w-full"
            role="listitem"
          >
            <OverviewCard item={item} selected={item.id === selectedId} onRequestTab={onRequestTab} />
          </div>
        ))}
      </div>
    </div>
  );
}
