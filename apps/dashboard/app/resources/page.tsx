import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources — Repo Metrics",
  description: "Documentation templates for CSE 115 courses. Download example files for Sprint Plans, Sprint Reports, Release Plans, Test Plans, Definition of Done, and Code Standards.",
};

const TEMPLATES = [
  {
    title: "Sprint Plan",
    filename: "sprint-1-plan.md",
    description:
      "The sprint plan documents your team's goal, user stories, task breakdown, time estimates, capacity buffer, team roles, and Scrum schedule for a single sprint.",
    href: "/templates/sprint-plan-template.md",
    downloadAs: "sprint-1-plan.md",
    highlights: [
      "Sprint goal (1–2 sentences)",
      "User stories in As a / I want / so that format",
      "Acceptance criteria (2+ per story)",
      "Tasks with action verbs and hour estimates ≤ 6h",
      "15% capacity buffer",
      "Scrum schedule with TA visit",
    ],
  },
  {
    title: "Sprint Report",
    filename: "sprint-1-report.md",
    description:
      "The sprint report captures your retrospective (Start / Stop / Continue), completed and incomplete stories, velocity metrics, and a burnup chart with day-by-day data.",
    href: "/templates/sprint-report-template.md",
    downloadAs: "sprint-1-report.md",
    highlights: [
      "Start / Stop / Continue with reasons",
      "Completed and incomplete stories",
      "Velocity: stories/day and hours/day",
      "Burnup chart image reference",
      "Day-by-day progress data table",
    ],
  },
  {
    title: "Release Plan",
    filename: "release-plan.md",
    description:
      "The release plan lists all user stories in scope for the release, with story point estimates, priorities, sprint assignments, and a capacity check.",
    href: "/templates/release-plan-template.md",
    downloadAs: "release-plan.md",
    highlights: [
      "High-level release goals",
      "User stories with unique IDs",
      "Fibonacci story point estimates",
      "Sprint assignments",
      "Capacity feasibility check",
      "Product backlog (out-of-scope stories)",
    ],
  },
  {
    title: "Test Plan",
    filename: "test-plan.md",
    description:
      "The test plan documents system test scenarios using Given / When / Then format, links each scenario to a user story, and summarizes unit test results.",
    href: "/templates/test-plan-template.md",
    downloadAs: "test-plan.md",
    highlights: [
      "Given / When / Then scenarios",
      "Specific inputs and expected outputs",
      "Honest Pass / Fail recording",
      "Links to user story IDs",
      "Unit test framework and results table",
    ],
  },
  {
    title: "Definition of Done",
    filename: "definition-of-done.md",
    description:
      "The Definition of Done sets team-wide standards for when a task and a user story are truly complete. It separates engineering quality (task level) from user value delivery (story level).",
    href: "/templates/definition-of-done-template.md",
    downloadAs: "definition-of-done.md",
    highlights: [
      "Task-level DoD (engineering perspective)",
      "Story-level DoD (user perspective)",
      "Specific, verifiable criteria",
      "Code review requirement",
      "Product Owner acceptance",
    ],
  },
  {
    title: "Code Standards",
    filename: "code-standards.md",
    description:
      "The code standards document defines your team's naming conventions, formatting rules, and best practices, referencing an established style guide for your tech stack.",
    href: "/templates/code-standards-template.md",
    downloadAs: "code-standards.md",
    highlights: [
      "Style guide reference (e.g. Google, Airbnb)",
      "Naming conventions by type",
      "Formatting rules (indentation, quotes, etc.)",
      "DRY and single responsibility principles",
      "Language-specific rules",
    ],
  },
] as const;

export default function ResourcesPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 pb-16">
      <header className="space-y-2 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Example documentation templates for CSE 115 courses. Each template
          demonstrates the structure and level of detail that earns full marks
          from the doc review analyzer.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How to use these templates</h2>
        <ol className="list-decimal list-inside space-y-2 leading-relaxed text-muted-foreground">
          <li>
            Download the template for the document type you are writing.
          </li>
          <li>
            Rename it to the exact filename shown — the analyzer matches by
            filename (e.g.{" "}
            <code className="rounded bg-muted px-1 text-xs">
              sprint-1-plan.md
            </code>
            ).
          </li>
          <li>
            Place it inside your repository&apos;s{" "}
            <code className="rounded bg-muted px-1 text-xs">
              documentation/
            </code>{" "}
            folder.
          </li>
          <li>
            Replace the sample content with your team&apos;s actual data —
            product name, team members, stories, etc.
          </li>
        </ol>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Templates</h2>

        <div className="divide-y divide-border rounded-lg border border-border">
          {TEMPLATES.map((t) => (
            <div key={t.title} className="p-5 space-y-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <h3 className="font-semibold">{t.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t.filename}
                  </p>
                </div>
                <a
                  href={t.href}
                  download={t.downloadAs}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Download className="size-3.5" aria-hidden />
                  Download
                </a>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.description}
              </p>

              {/* Highlights */}
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {t.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="mt-px text-primary shrink-0">✓</span>
                    {h}
                  </li>
                ))}
              </ul>

              {/* View link */}
              <a
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                View example →
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Required folder structure</h2>
        <p className="leading-relaxed text-muted-foreground">
          Place all documentation files inside a{" "}
          <code className="rounded bg-muted px-1 text-xs">documentation/</code>{" "}
          folder at the root of your repository. The analyzer only looks in this
          folder.
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <pre className="font-mono text-xs leading-relaxed text-muted-foreground">
{`your-repo/
└── documentation/
    ├── release-plan.md
    ├── sprint-1-plan.md
    ├── sprint-1-report.md
    ├── sprint-2-plan.md
    ├── sprint-2-report.md
    ├── test-plan.md
    ├── definition-of-done.md
    └── code-standards.md`}
          </pre>
        </div>
      </section>
    </article>
  );
}
