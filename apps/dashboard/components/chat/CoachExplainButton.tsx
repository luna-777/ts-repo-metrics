"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CoachExplainButtonProps {
  prompt: string;
  /** Sends `prompt` to the repo coach chat */
  send: ((message: string) => void) | null;
}

/**
 * Opens the Repo Coach chat (via parent-provided bridge) with a templated explanation request.
 */
export function CoachExplainButton({ prompt, send }: CoachExplainButtonProps) {
  const disabled = !send;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => send?.(prompt)}
          className={`shrink-0 text-muted-foreground hover:text-foreground ${disabled ? "opacity-40" : ""}`}
          aria-label="Ask the repo coach what this section means"
        >
          <Sparkles className="size-4" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        What does this mean? Ask AI (opens Repo Coach).
      </TooltipContent>
    </Tooltip>
  );
}
