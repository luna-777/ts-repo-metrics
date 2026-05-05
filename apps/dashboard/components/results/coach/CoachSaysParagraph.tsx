import * as React from "react";

import { CoachSaysSurface } from "./CoachSaysSurface";

export interface CoachSaysParagraphProps {
  className?: string;
  children: React.ReactNode;
}

/** Tab-context blurb: same surface as the global coach card, without section eyebrow or tone blocks. */
export function CoachSaysParagraph({ className, children }: CoachSaysParagraphProps) {
  return (
    <CoachSaysSurface showAccent={false} className={className}>
      <div className="text-pretty break-words text-sm leading-relaxed text-foreground sm:text-[15px] sm:leading-7">
        {children}
      </div>
    </CoachSaysSurface>
  );
}
