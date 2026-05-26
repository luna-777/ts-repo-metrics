import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Repo Metrics",
  description: "Terms governing use of the Repo Metrics tool.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 pb-16">
      <header className="space-y-2 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">Effective date: May 2026</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Acceptance of terms</h2>
        <p className="leading-relaxed text-muted-foreground">
          By accessing or using Repo Metrics ("the tool"), you agree to be bound by these
          Terms of Use. If you do not agree, do not use the tool. These terms apply to all
          users, including students accessing the tool through a course-specific link and
          instructors or researchers using it directly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Description of the service</h2>
        <p className="leading-relaxed text-muted-foreground">
          Repo Metrics is a static analysis tool that examines public and private GitHub
          repositories and returns repository-level metrics covering code complexity, commit
          habits, testing signals, React component structure, AI usage patterns, and
          documentation quality. It is operated as part of research on AI-assisted software
          engineering education.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Analysis results are <strong className="text-foreground">not used to grade
          individual students</strong>. Aggregate, anonymized data may be used in research
          publications.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">GitHub OAuth and permissions</h2>
        <p className="leading-relaxed text-muted-foreground">
          To analyze a repository, you must authenticate with GitHub. The tool requests the
          following OAuth scopes:
        </p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li><code className="rounded bg-muted px-1 text-xs">read:user</code> — read your GitHub username and profile.</li>
          <li><code className="rounded bg-muted px-1 text-xs">user:email</code> — read your primary email address.</li>
          <li><code className="rounded bg-muted px-1 text-xs">repo</code> — read repository contents and metadata for repositories you own or have access to.</li>
        </ul>
        <p className="leading-relaxed text-muted-foreground">
          You are responsible for ensuring you have the right to analyze any repository you
          submit. Do not submit repositories you do not own or do not have permission to share
          with third-party analysis tools.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Research participation</h2>
        <p className="leading-relaxed text-muted-foreground">
          By using this tool — especially through a course-specific URL — you consent to your
          repository metrics being included in anonymized, aggregate research data. This
          research aims to understand how software engineering education can be supported by
          AI-assisted tooling. No personally identifiable information is published in research
          outputs.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Participation is voluntary. You may opt out by not using the tool or by requesting
          deletion of your data as described in the{" "}
          <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
            Privacy Statement
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Acceptable use</h2>
        <p className="leading-relaxed text-muted-foreground">You agree not to:</p>
        <ul className="list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
          <li>Submit repositories containing illegal content or content that violates GitHub&apos;s Terms of Service.</li>
          <li>Attempt to reverse-engineer, scrape, or extract data from the tool beyond its intended interface.</li>
          <li>Submit repositories belonging to others without their knowledge or consent.</li>
          <li>Use the tool to circumvent academic integrity policies at your institution.</li>
          <li>Attempt to disrupt or overload the service.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Intellectual property</h2>
        <p className="leading-relaxed text-muted-foreground">
          The Repo Metrics source code is released under the{" "}
          <a href="/license" className="text-primary underline-offset-4 hover:underline">
            MIT License
          </a>. Analysis results and metrics computed from your repository belong to you.
          Aggregate, anonymized research data derived from those results may be used by the
          research team as described above.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Disclaimer of warranties</h2>
        <p className="leading-relaxed text-muted-foreground">
          The tool is provided <strong className="text-foreground">"as is"</strong> without
          warranty of any kind. Metric scores are heuristic estimates intended to support
          reflection, not definitive judgments of code quality. Results may be incomplete,
          inaccurate, or unavailable due to service interruptions, API limits, or
          repository characteristics. We make no guarantees about the availability or
          accuracy of analysis results.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Limitation of liability</h2>
        <p className="leading-relaxed text-muted-foreground">
          To the maximum extent permitted by applicable law, the operators of Repo Metrics
          shall not be liable for any indirect, incidental, special, or consequential damages
          arising from your use of or inability to use the tool, even if advised of the
          possibility of such damages.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Changes to these terms</h2>
        <p className="leading-relaxed text-muted-foreground">
          We may update these terms from time to time. Continued use of the tool after
          changes are posted constitutes acceptance of the updated terms. Material changes
          will be noted by updating the effective date at the top of this page.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="leading-relaxed text-muted-foreground">
          Questions about these terms can be directed to the project repository:{" "}
          <a href="https://github.com/scottyUX/ts-repo-metrics"
            className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
            github.com/scottyUX/ts-repo-metrics
          </a>.
        </p>
      </section>
    </article>
  );
}
