import { STAGE_CORR_TABLE_ROWS, STAGE_DESCRIPTIVES } from "@/lib/research/paperChartData";

function formatR(r: number): string {
  return r.toFixed(3).replace(/^0/, "");
}

export function SampleSizesTable() {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[280px] text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Stage</th>
            <th className="px-3 py-2 text-right font-medium">N (AU)</th>
            <th className="px-3 py-2 text-right font-medium">N (AUM)</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {STAGE_DESCRIPTIVES.map((row) => (
            <tr key={row.stage} className="border-b last:border-0">
              <td className="px-3 py-2">{row.stage}</td>
              <td className="px-3 py-2 text-right">{row.auN}</td>
              <td className="px-3 py-2 text-right">{row.aumN}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">Table 1 — Effective sample sizes by SDLC stage.</p>
    </div>
  );
}

export function DescriptivesTable() {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium" rowSpan={2}>
              Stage
            </th>
            <th className="border-l px-3 py-2 text-center font-medium" colSpan={3}>
              AU
            </th>
            <th className="border-l px-3 py-2 text-center font-medium" colSpan={3}>
              AUM
            </th>
          </tr>
          <tr className="border-b">
            <th className="border-l px-3 py-2 text-right font-normal text-muted-foreground">M</th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">SD</th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">N</th>
            <th className="border-l px-3 py-2 text-right font-normal text-muted-foreground">M</th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">SD</th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">N</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {STAGE_DESCRIPTIVES.map((row) => (
            <tr key={row.stage} className="border-b last:border-0">
              <td className="px-3 py-2">{row.stage}</td>
              <td className="border-l px-3 py-2 text-right">{row.auMean}</td>
              <td className="px-3 py-2 text-right">{row.auSd}</td>
              <td className="px-3 py-2 text-right">{row.auN}</td>
              <td className="border-l px-3 py-2 text-right">{row.aumMean}</td>
              <td className="px-3 py-2 text-right">{row.aumSd}</td>
              <td className="px-3 py-2 text-right">{row.aumN}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Table 2 — Descriptive statistics for AU and AUM by SDLC stage.
      </p>
    </div>
  );
}

export function PosthocTable() {
  const rows = [
    ["Planning", "Design", ".026", "*"],
    ["Planning", "Implementation", "1.00", "n.s."],
    ["Planning", "Testing", ".001", "**"],
    ["Planning", "Deployment", "<.001", "**"],
    ["Planning", "Maintenance", "<.001", "**"],
    ["Design", "Implementation", ".090", "n.s."],
    ["Design", "Testing", ".143", "n.s."],
    ["Design", "Deployment", ".004", "**"],
    ["Design", "Maintenance", ".005", "**"],
    ["Implementation", "Testing", ".002", "**"],
    ["Implementation", "Deployment", "<.001", "**"],
    ["Implementation", "Maintenance", "<.001", "**"],
    ["Testing", "Deployment", "1.00", "n.s."],
    ["Testing", "Maintenance", "1.00", "n.s."],
    ["Deployment", "Maintenance", "1.00", "n.s."],
  ] as const;

  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[360px] text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Stage A</th>
            <th className="px-3 py-2 text-left font-medium">Stage B</th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="font-serif italic">p</span>
              <sub>Bonf</sub>
            </th>
            <th className="px-3 py-2 text-right font-medium">Sig.</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {rows.map(([a, b, p, sig]) => (
            <tr key={`${a}-${b}`} className="border-b last:border-0">
              <td className="px-3 py-1.5">{a}</td>
              <td className="px-3 py-1.5">{b}</td>
              <td className="px-3 py-1.5 text-right font-mono text-xs" dangerouslySetInnerHTML={{ __html: p }} />
              <td className="px-3 py-1.5 text-right">{sig}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Table 3 — Pairwise Wilcoxon signed-rank post-hoc tests for AUM across SDLC stages (
        <span className="font-serif italic">N</span> = 48). **{" "}
        <span className="font-serif italic">p</span> {"<"} .01; *{" "}
        <span className="font-serif italic">p</span> {"<"} .05; n.s. not significant.
      </p>
    </div>
  );
}

export function StageCorrTable() {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium" rowSpan={2}>
              Stage
            </th>
            <th className="border-l px-3 py-2 text-center font-medium" colSpan={3}>
              AU–AUM
            </th>
            <th className="border-l px-3 py-2 text-center font-medium" colSpan={3}>
              PU–AU
            </th>
          </tr>
          <tr className="border-b">
            <th className="border-l px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">r</span>
            </th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">p</span>
            </th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">N</span>
            </th>
            <th className="border-l px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">r</span>
            </th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">p</span>
            </th>
            <th className="px-3 py-2 text-right font-normal text-muted-foreground">
              <span className="font-serif italic">N</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {STAGE_CORR_TABLE_ROWS.map((row) => (
            <tr key={row.stage} className="border-b last:border-0">
              <td className="px-3 py-2">{row.stage}</td>
              <td className="border-l px-3 py-2 text-right">{formatR(row.rAuAum)}</td>
              <td className="px-3 py-2 text-right">{row.auAumP === "<.001" ? "<.001" : row.auAumP}</td>
              <td className="px-3 py-2 text-right">{row.nAuAum}</td>
              <td className="border-l px-3 py-2 text-right">{formatR(row.rPuAu)}</td>
              <td className="px-3 py-2 text-right">{row.pPuAu === "<.001" ? "<.001" : row.pPuAu}</td>
              <td className="px-3 py-2 text-right">{row.nPuAu}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Table 4 — Stage-level correlations: AU–AUM and PU–AU. All PU–AU correlations significant at{" "}
        <span className="font-serif italic">p</span> {"<"} .01. Note: correlation{" "}
        <span className="font-serif italic">N</span> reflects pairwise deletion.
      </p>
    </div>
  );
}
