"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !code.trim()) return;

    const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

    const render = async () => {
      try {
        setError(null);
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: "loose",
          fontFamily: "inherit",
          flowchart: {
            // Safari/WebKit often paints blank diagrams when labels use SVG foreignObject + HTML.
            htmlLabels: false,
          },
        });

        const { svg, bindFunctions } = await mermaid.render(`mermaid-${id}`, code.trim());
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          bindFunctions?.(containerRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    void render();
  }, [code, id, mounted, resolvedTheme]);

  if (error) {
    return (
      <div
        className={cn(
          "rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive",
          className,
        )}
      >
        Diagram failed to render: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-[120px] w-full min-w-0 items-center justify-center rounded-md border bg-muted/30 p-4",
        "[&_svg]:h-auto [&_svg]:max-h-[400px] [&_svg]:min-h-0 [&_svg]:w-full [&_svg]:max-w-full",
        className,
      )}
      aria-busy={!mounted}
      suppressHydrationWarning
    />
  );
}
