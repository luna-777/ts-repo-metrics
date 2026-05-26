import type { Metadata } from "next";
import { Github } from "lucide-react";

export const metadata: Metadata = {
  title: "Report an Issue — Repo Metrics",
  description: "Repo Metrics is open source. Report a bug, request a feature, or start a discussion on GitHub.",
};

export default function SupportPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 pb-16">
      <header className="space-y-2 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
        <p className="text-sm text-muted-foreground">
          Repo Metrics is open source — everyone is welcome.
        </p>
      </header>

      <section className="space-y-4">
        <p className="leading-relaxed text-muted-foreground">
          Repo Metrics is an open source project. If you encounter a bug, have a question,
          or want to suggest a new feature, GitHub Issues is the right place to start. There
          is no separate support channel — everything happens in the open so the whole
          community can benefit from the discussion.
        </p>

        <a
          href="https://github.com/scottyUX/ts-repo-metrics/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
        >
          <Github className="size-4" aria-hidden />
          Open an issue on GitHub
        </a>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What you can do</h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {[
            {
              title: "Report a bug",
              description: "Something is broken or producing unexpected results. Include the repository URL you analysed, what you expected to see, and what actually happened.",
            },
            {
              title: "Request a feature",
              description: "Have an idea for a new metric, tab, or workflow improvement? Open an issue describing the use case and what problem it solves.",
            },
            {
              title: "Ask a question",
              description: "Not sure how a metric is calculated or why a score looks the way it does? Questions are welcome — they often turn into documentation improvements.",
            },
            {
              title: "Contribute code",
              description: "Fork the repository, make your changes, and open a pull request. Check existing issues for anything labelled \"good first issue\" if you're looking for a place to start.",
            },
          ].map(({ title, description }) => (
            <div key={title} className="px-5 py-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Useful links</h2>
        <ul className="space-y-2 text-sm">
          {[
            { label: "GitHub repository",  href: "https://github.com/scottyUX/ts-repo-metrics" },
            { label: "Open issues",        href: "https://github.com/scottyUX/ts-repo-metrics/issues" },
            { label: "Pull requests",      href: "https://github.com/scottyUX/ts-repo-metrics/pulls" },
            { label: "Discussions",        href: "https://github.com/scottyUX/ts-repo-metrics/discussions" },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
              >
                <Github className="size-3.5 shrink-0" aria-hidden />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
