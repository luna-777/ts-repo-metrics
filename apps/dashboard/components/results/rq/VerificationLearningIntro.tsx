"use client";

import type { RepoReport } from "@/lib/reportTypes";
import { BEHAVIORAL_LEARNING_FRAMING, VERIFICATION_LEARNING_FRAMING } from "@/lib/rqConfig";

function resolveGitTrustNote(report: RepoReport): string {
  const mode = report.git?.mode;
  if (mode === "api") return BEHAVIORAL_LEARNING_FRAMING.trustApi;
  return BEHAVIORAL_LEARNING_FRAMING.trustGeneric;
}

export function VerificationLearningIntro({ report }: { report: RepoReport }) {
  const trustNote = resolveGitTrustNote(report);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <h2 className="text-lg font-semibold">{VERIFICATION_LEARNING_FRAMING.title}</h2>
      <p className="text-sm leading-relaxed text-foreground">{VERIFICATION_LEARNING_FRAMING.lead}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {VERIFICATION_LEARNING_FRAMING.discussion}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {VERIFICATION_LEARNING_FRAMING.scopeNote}
      </p>
      <p className="text-xs text-muted-foreground border-t pt-3">{trustNote}</p>
    </div>
  );
}
