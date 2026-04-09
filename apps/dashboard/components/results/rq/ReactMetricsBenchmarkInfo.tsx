"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

const FERREIRA_DOI = "https://doi.org/10.1016/j.infsof.2022.107111";
const FERREIRA_PDF = "https://homepages.dcc.ufmg.br/~mtov/pub/2023-ist-react.pdf";
const REACT_SNIFFER_REPO = "https://github.com/fabiosferreira/reactsniffer";

function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-foreground underline underline-offset-2 hover:text-foreground/90"
    >
      {children}
      <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

export function ReactMetricsBenchmarkInfo() {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm space-y-3">
      <div>
        <h3 className="font-semibold text-foreground mb-1">References</h3>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Ferreira &amp; Valente (2023).</strong>{" "}
          <cite className="not-italic">
            Detecting Code Smells in React-based Web Apps.
          </cite>{" "}
          <em>Information and Software Technology</em>, 155, 107111.{" "}
          <OutLink href={FERREIRA_DOI}>DOI</OutLink>
          {" · "}
          <OutLink href={FERREIRA_PDF}>Author PDF (UFMG)</OutLink>
          {" · "}
          Reference implementation and datasets:{" "}
          <OutLink href={REACT_SNIFFER_REPO}>fabiosferreira/reactsniffer</OutLink>{" "}
          (ReactSniffer).
        </p>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          This dashboard runs <strong className="text-foreground">lightweight Tree-sitter heuristics</strong> in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">@repo-metrics/engine</code> for research-scale mining.
          It is <strong className="text-foreground">not</strong> a port of ReactSniffer; thresholds and detectors are
          aligned at a high level with themes from that work (e.g. large, hook-heavy components as cohesion risk).
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-1">Datapoints (summary)</h3>
        <ul className="text-muted-foreground list-disc pl-5 space-y-1 leading-relaxed">
          <li>
            <strong className="text-foreground">TSX files analyzed</strong> — count of{" "}
            <code className="rounded bg-muted px-1 text-xs">.tsx</code> files parsed.
          </li>
          <li>
            <strong className="text-foreground">Components (heuristic)</strong> — function-like nodes whose body
            contains JSX.
          </li>
          <li>
            <strong className="text-foreground">Ferreira: lack of cohesion</strong> — count of components where{" "}
            <strong className="text-foreground">hook count &gt; 5</strong> and{" "}
            <strong className="text-foreground">SLOC &gt; 50</strong> (Ferreira-style lack-of-cohesion signal).
          </li>
          <li>
            <strong className="text-foreground">Tampere: JSX depth &gt; 5</strong> — count of components whose maximum
            nested JSX tree depth exceeds <strong className="text-foreground">5</strong> (structural complexity
            benchmark label used in RQ3; not the ReactSniffer catalog verbatim).
          </li>
          <li>
            <strong className="text-foreground">Prop pass-through / Drill</strong> — same-file heuristic: parameter
            names forwarded as JSX attributes (MVP; not cross-file).
          </li>
          <li>
            <strong className="text-foreground">Hook safety</strong> — aggregated heuristics (conditional{" "}
            <code className="rounded bg-muted px-1 text-xs">use*</code>, async{" "}
            <code className="rounded bg-muted px-1 text-xs">useEffect</code>, dependency-array shape).
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-1">Per-component table</h3>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Max JSX Δ</strong> — maximum nested JSX depth in that component.{" "}
          <strong className="text-foreground">Ferreira</strong> / <strong className="text-foreground">Tampere</strong> —{" "}
          yes when the same thresholds as above apply. <strong className="text-foreground">Drill</strong> — pass-through
          edges detected for that component.
        </p>
      </div>
    </div>
  );
}
