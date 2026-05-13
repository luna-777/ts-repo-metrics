"use client";

import { cn } from "@/lib/utils";
import type { ResearchConstructAbbrev } from "@/components/research/researchConstructAbbreviations";

export interface TocItem {
  id: string;
  label: string;
}

export function ResearchToc({
  items,
  constructs,
  className,
}: {
  items: readonly TocItem[];
  constructs: readonly ResearchConstructAbbrev[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Paper sections and construct abbreviations"
      className={cn("text-sm", className)}
    >
      <p className="mb-3 font-semibold text-foreground">On this page</p>
      <ul className="flex flex-col gap-1.5 border-l border-border pl-3">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mb-2.5 mt-8 font-semibold text-foreground">Construct abbreviations</p>
      <p className="mb-3 text-[0.7rem] leading-snug text-muted-foreground">
        Short labels used in prose, charts, and Table 4. Jump to definitions in Section 3 or open the glossary below on mobile.
      </p>
      <ul className="flex flex-col gap-3 border-l border-border pl-3">
        {constructs.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className="inline-block scroll-mt-28 rounded-sm font-semibold tracking-tight text-foreground underline-offset-2 transition-colors hover:underline hover:opacity-95"
            >
              {c.abbr}
            </a>
            <p className="mt-1 text-[0.6875rem] leading-snug text-muted-foreground">{c.description}</p>
          </li>
        ))}
      </ul>
    </nav>
  );
}
