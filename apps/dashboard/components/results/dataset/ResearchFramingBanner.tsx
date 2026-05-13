"use client";

import Link from "next/link";

export function ResearchFramingBanner() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 text-sm">
      <p className="font-medium text-blue-900 dark:text-blue-100">
        Research framing
      </p>
      <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-200">
        <li>• Each repository = one observation in the mined dataset.</li>
        <li>
          • Repo-derived features operationalize dashboard constructs (commit habits, testing proxies, code quality).
          Survey constructs such as AU/AUM are documented in the{" "}
          <Link href="/research#abstract" className="font-medium underline underline-offset-2">
            Research
          </Link>{" "}
          manuscript—keep constructs distinct when joining datasets.
        </li>
        <li>
          • Cognitive engagement and maturity Likert scales are collected outside this tool; AI Maturity session traces are exploratory and do not replace survey AUM.
        </li>
      </ul>
    </div>
  );
}
