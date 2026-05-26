import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "License — Repo Metrics",
  description: "MIT License and third-party notices for Repo Metrics.",
};

export default function LicensePage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 pb-16">
      <header className="space-y-2 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">License</h1>
        <p className="text-sm text-muted-foreground">Repo Metrics — open source software</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">MIT License</h2>
        <p className="text-sm text-muted-foreground">Copyright © 2026 scottyUX</p>
        <div className="rounded-lg border border-border bg-muted/30 p-5">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
{`Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
          </pre>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          The full source code is available at{" "}
          <a
            href="https://github.com/scottyUX/ts-repo-metrics"
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scottyUX/ts-repo-metrics
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Third-party notices</h2>
        <p className="leading-relaxed text-muted-foreground">
          Repo Metrics is built on open source software. Key dependencies and their licenses
          are listed below.
        </p>

        <div className="divide-y divide-border rounded-lg border border-border">
          {[
            { name: "Next.js", license: "MIT", author: "Vercel, Inc.", url: "https://github.com/vercel/next.js/blob/canary/license.md" },
            { name: "React", license: "MIT", author: "Meta Platforms, Inc.", url: "https://github.com/facebook/react/blob/main/LICENSE" },
            { name: "Tailwind CSS", license: "MIT", author: "Tailwind Labs, Inc.", url: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE" },
            { name: "shadcn/ui", license: "MIT", author: "shadcn", url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md" },
            { name: "Supabase JS", license: "MIT", author: "Supabase, Inc.", url: "https://github.com/supabase/supabase-js/blob/master/LICENSE" },
            { name: "OpenAI Node SDK", license: "Apache 2.0", author: "OpenAI", url: "https://github.com/openai/openai-node/blob/master/LICENSE" },
            { name: "Lucide React", license: "ISC", author: "Lucide Contributors", url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE" },
            { name: "Vitest", license: "MIT", author: "Vitest Contributors", url: "https://github.com/vitest-dev/vitest/blob/main/LICENSE" },
            { name: "TypeScript", license: "Apache 2.0", author: "Microsoft Corporation", url: "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt" },
          ].map(({ name, license, author, url }) => (
            <div key={name} className="flex items-center justify-between px-4 py-3">
              <div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {name}
                </a>
                <p className="text-xs text-muted-foreground">{author}</p>
              </div>
              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                {license}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          For a complete list of dependencies and their licenses, see{" "}
          <code className="rounded bg-muted px-1 text-xs">package.json</code> in the source
          repository.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Third-party services</h2>
        <p className="leading-relaxed text-muted-foreground">
          Repo Metrics uses the following external services. Your use of those services is
          subject to their respective terms and privacy policies.
        </p>
        <ul className="list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
          <li>
            <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
              className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub Terms of Service
            </a>{" "}— authentication and repository access.
          </li>
          <li>
            <a href="https://openai.com/policies/terms-of-use"
              className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              OpenAI Terms of Use
            </a>{" "}— documentation review via the OpenAI API.
          </li>
          <li>
            <a href="https://supabase.com/terms"
              className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              Supabase Terms of Service
            </a>{" "}— database and authentication infrastructure.
          </li>
          <li>
            <a href="https://railway.com/legal/privacy"
              className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              Railway Privacy Policy
            </a>{" "}— application hosting.
          </li>
        </ul>
      </section>
    </article>
  );
}
