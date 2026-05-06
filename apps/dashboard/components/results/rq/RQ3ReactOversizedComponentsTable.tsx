"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ReactComponentMetrics } from "@/lib/reportTypes";
import { SeverityTableCell } from "@/components/results/SeverityTableCell";
import {
  bandForJsxDepth,
  bandForSloc,
  severityNumericCellClass,
} from "@/lib/severityTableCell";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE = 10;
const VISIBLE_STEP = 5;

function sheetValueClass(lines: number): string {
  return cn(
    "inline-block rounded px-1.5 py-0.5 text-sm",
    severityNumericCellClass(bandForSloc(lines), "left"),
  );
}

function sheetJsxClass(depth: number): string {
  return cn(
    "inline-block rounded px-1.5 py-0.5 text-sm",
    severityNumericCellClass(bandForJsxDepth(depth), "left"),
  );
}

interface RQ3ReactOversizedComponentsTableProps {
  components: ReactComponentMetrics[];
  className?: string;
}

export function RQ3ReactOversizedComponentsTable({
  components,
  className,
}: RQ3ReactOversizedComponentsTableProps) {
  const sorted = useMemo(
    () => [...components].sort((a, b) => b.lines - a.lines),
    [components],
  );
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [selected, setSelected] = useState<ReactComponentMetrics | null>(null);

  useEffect(() => {
    setVisible(INITIAL_VISIBLE);
  }, [components]);

  const rows = sorted.slice(0, visible);
  const remaining = sorted.length - visible;

  return (
    <>
      <section
        id="rq3-react-oversized"
        aria-labelledby="rq3-react-oversized-heading"
        className={className}
      >
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle id="rq3-react-oversized-heading" className="text-lg">
                  Top Oversized Components
                </CardTitle>
                <p className="max-w-2xl text-sm leading-snug text-muted-foreground">
                  Largest TSX components by line span—start splitting here before layering new behavior.
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground sm:max-w-[200px] sm:pt-1 sm:text-right">
                Sorted by SLOC (descending)
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No component rows in this report.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead className="text-right">SLOC</TableHead>
                      <TableHead className="text-right">JSX depth</TableHead>
                      <TableHead className="text-right">Hooks</TableHead>
                      <TableHead className="text-right">Drill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={`${row.file}:${row.startLine}:${row.name}`}
                        className="cursor-pointer"
                        onClick={() => setSelected(row)}
                      >
                        <TableCell className="max-w-[180px] font-medium">{row.name}</TableCell>
                        <TableCell
                          className="max-w-[200px] truncate font-mono text-xs text-muted-foreground"
                          title={row.file}
                        >
                          {row.file}
                        </TableCell>
                        <SeverityTableCell variant="sloc" value={row.lines} />
                        <SeverityTableCell variant="jsxDepth" value={row.maxJsxDepth} />
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.hookCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.propDrillingEdges > 0 ? (
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs tabular-nums"
                            >
                              {row.propDrillingEdges}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {remaining > 0 || visible > INITIAL_VISIBLE ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1">
                    {remaining > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVisible((v) => Math.min(v + VISIBLE_STEP, sorted.length))
                        }
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Show {Math.min(VISIBLE_STEP, remaining)} more components →
                      </button>
                    ) : null}
                    {visible > INITIAL_VISIBLE ? (
                      <button
                        type="button"
                        onClick={() => setVisible(INITIAL_VISIBLE)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        ← Show less
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {remaining === 0 && sorted.length > 0 ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Showing all {sorted.length} components.
                  </p>
                ) : null}
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Tip: Components over <strong className="font-medium text-foreground">100 SLOC</strong>{" "}
                  deserve a review for splitting; over <strong className="font-medium text-foreground">200</strong>{" "}
                  is a strong refactor signal.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.file} · Line {selected.startLine}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>SLOC:</strong> <span className={sheetValueClass(selected.lines)}>{selected.lines}</span>
                </p>
                <p>
                  <strong>Max JSX depth:</strong>{" "}
                  <span className={sheetJsxClass(selected.maxJsxDepth)}>{selected.maxJsxDepth}</span>
                </p>
                <p>
                  <strong>Hooks:</strong> {selected.hookCount}
                </p>
                <p>
                  <strong>Prop drilling edges:</strong> {selected.propDrillingEdges}
                </p>
                <p>
                  <strong>Ferreira lack-of-cohesion:</strong>{" "}
                  {selected.ferreiraLackOfCohesion ? "yes" : "no"}
                </p>
                <p>
                  <strong>Tampere JSX depth &gt; 5:</strong>{" "}
                  {selected.tampereJsxDepthExceeded ? "yes" : "no"}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
