"use client";

import Link from "next/link";

export function VerificationLearningFooter() {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-4 text-sm">
      <p className="leading-relaxed text-foreground">
        Verification is about shared safety nets: decide as a team how you test risky areas and how you
        review complexity—not about calling out individuals. Definitions for each metric are in the{" "}
        <Link href="/docs" className="font-medium text-primary underline-offset-4 hover:underline">
          documentation
        </Link>
        .
      </p>
    </div>
  );
}
