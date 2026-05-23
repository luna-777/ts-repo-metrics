export interface DocsNavItem {
  slug: string;
  title: string;
}

export interface DocsNavGroup {
  label: string;
  items: DocsNavItem[];
}

export const DOC_GROUPS: DocsNavGroup[] = [
  {
    label: "Introduction",
    items: [
      { slug: "introduction", title: "Welcome" },
      { slug: "authors", title: "Authors" },
    ],
  },
  {
    label: "Development",
    items: [
      { slug: "getting-started", title: "Getting started" },
      { slug: "run-locally", title: "Run locally" },
      { slug: "system-map", title: "System map" },
      { slug: "contributing", title: "Contributing" },
    ],
  },
  {
    label: "Metrics & engine",
    items: [{ slug: "metrics", title: "Metrics & calculation" }],
  },
  {
    label: "Reference",
    items: [
      { slug: "architecture", title: "Architecture" },
      { slug: "git-metrics", title: "Git metrics & ingestion" },
      { slug: "metrics-categories", title: "Dashboard metric mapping" },
      { slug: "documentation-review", title: "Documentation review" },
      { slug: "reproducibility", title: "Reproducibility" },
      { slug: "limitations", title: "Limitations" },
      { slug: "roadmap", title: "Roadmap" },
    ],
  },
];

export const DEFAULT_DOC_SLUG = "introduction";

export const ALL_DOC_SLUGS: string[] = DOC_GROUPS.flatMap((g) =>
  g.items.map((i) => i.slug),
);

export function titleForSlug(slug: string): string | undefined {
  for (const g of DOC_GROUPS) {
    const item = g.items.find((i) => i.slug === slug);
    if (item) return item.title;
  }
  return undefined;
}
