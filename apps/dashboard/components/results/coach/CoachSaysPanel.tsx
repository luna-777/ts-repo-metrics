import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CoachInsightTone } from "./CoachInsightTone";
import { CoachPointerStrip } from "./CoachPointerStrip";
import { CoachSaysEyebrow } from "./CoachSaysEyebrow";
import { CoachSaysSurface } from "./CoachSaysSurface";

export interface CoachSaysPanelProps {
  className?: string;
  eyebrow?: string;
  positive: {
    title?: string;
    body: React.ReactNode;
  };
  concern: {
    title?: string;
    body: React.ReactNode;
    /** critical = red accent; needs_work (or steady weakest) = amber accent. */
    variant?: "critical" | "moderate";
  };
  pointer?: React.ReactNode;
  footerLink?: {
    href: string;
    label: React.ReactNode;
    /** Prefer this for SPA tab switching (e.g. results dashboard). */
    onNavigate?: () => void;
  };
}

export function CoachSaysPanel({
  className,
  eyebrow = "YOUR COACH SAYS",
  positive,
  concern,
  pointer,
  footerLink,
}: CoachSaysPanelProps) {
  return (
    <CoachSaysSurface className={cn("flex flex-col gap-4 sm:gap-5", className)} showAccent>
      {eyebrow ? <CoachSaysEyebrow>{eyebrow}</CoachSaysEyebrow> : null}
      <CoachInsightTone tone="positive" title={positive.title}>
        {positive.body}
      </CoachInsightTone>
      <CoachInsightTone
        tone={concern.variant === "critical" ? "concern" : "opportunityModerate"}
        title={concern.title}
      >
        {concern.body}
      </CoachInsightTone>
      {pointer ? <CoachPointerStrip>{pointer}</CoachPointerStrip> : null}
      {footerLink ? (
        <div>
          {footerLink.onNavigate ? (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm font-normal text-primary"
              onClick={footerLink.onNavigate}
            >
              {footerLink.label}
            </Button>
          ) : (
            <Button variant="link" className="h-auto p-0 text-sm font-normal text-primary" asChild>
              <Link href={footerLink.href}>{footerLink.label}</Link>
            </Button>
          )}
        </div>
      ) : null}
    </CoachSaysSurface>
  );
}
