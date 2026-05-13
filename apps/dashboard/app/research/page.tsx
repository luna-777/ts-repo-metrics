import type { Metadata } from "next";
import Link from "next/link";
import { loadFormattedRefsFromPublic } from "@/lib/bibtexToRefs";
import { ResearchPaperBody } from "@/components/research/ResearchPaperBody";
import { RESEARCH_CONSTRUCT_ABBREVIATIONS } from "@/components/research/researchConstructAbbreviations";
import { ResearchToc } from "@/components/research/ResearchToc";
import { RESEARCH_TOC_ITEMS } from "@/components/research/researchTocItems";

export const metadata: Metadata = {
  title: "Research | Repo Metrics",
  description:
    "Stage-aware AI usage and maturity research manuscript, repository instrumentation, dashboard metric grounding, and BibTeX references.",
};

export default function ResearchPage() {
  const bibRefs = loadFormattedRefsFromPublic();

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 self-stretch px-4 pb-16">
      <div className="mb-6 lg:hidden">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Jump to section
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          {RESEARCH_TOC_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 lg:hidden">
        <details className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <summary className="cursor-pointer list-inside text-sm font-medium text-foreground marker:text-muted-foreground">
            Construct abbreviations
          </summary>
          <ul className="mt-3 space-y-3 border-t border-border pt-3 text-xs">
            {RESEARCH_CONSTRUCT_ABBREVIATIONS.map((c) => (
              <li key={c.id}>
                <Link
                  href={`#${c.id}`}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {c.abbr}
                </Link>
                <p className="mt-1 leading-snug text-muted-foreground">{c.description}</p>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="flex w-full gap-10 lg:gap-14">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8 [-webkit-overflow-scrolling:touch]">
            <ResearchToc items={RESEARCH_TOC_ITEMS} constructs={RESEARCH_CONSTRUCT_ABBREVIATIONS} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-visible">
          <ResearchPaperBody bibRefs={bibRefs} />
        </div>
      </div>
    </div>
  );
}
