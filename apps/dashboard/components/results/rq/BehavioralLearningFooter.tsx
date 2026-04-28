"use client";

import Link from "next/link";

export function BehavioralLearningFooter() {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-4 text-sm">
      <p className="leading-relaxed text-foreground">
        Strong teams treat metrics as shared context: align on integration habits, reviews, and where
        the code moves most—not as individual judgment. For definitions of each value, see the{" "}
        <Link href="/docs" className="font-medium text-primary underline-offset-4 hover:underline">
          documentation
        </Link>
        .
      </p>
    </div>
  );
}
