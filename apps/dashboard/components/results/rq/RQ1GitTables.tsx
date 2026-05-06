"use client";

import {
  Card,
  CardContent,
  CardDescription,
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
import type { ContributorActivity } from "@/lib/reportTypes";

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

export function RQ1ContributorsTableCard({
  contributors,
}: {
  contributors: ContributorActivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributors (git activity)</CardTitle>
        <CardDescription className="space-y-2">
          <p>Commit activity broken down by team member.</p>
          <p>
            One row per commit author in parsed history. Line deltas come from git numstat where the
            analyzer had full history (local clone). Zipball / GitHub API modes may leave churn columns
            at zero while commit counts still reflect metadata.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead className="text-right">Commits</TableHead>
              <TableHead className="text-right">+Lines</TableHead>
              <TableHead className="text-right">−Lines</TableHead>
              <TableHead className="text-right">Median Δ / commit</TableHead>
              <TableHead className="text-right">Burst %</TableHead>
              <TableHead className="text-right">Test-touch %</TableHead>
              <TableHead className="text-right">Refactor %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributors.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.displayName || c.authorEmail || c.id}</div>
                  <div className="text-muted-foreground text-xs font-mono truncate max-w-[220px]">
                    {c.authorEmail || "—"}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.commitCount}</TableCell>
                <TableCell className="text-right tabular-nums">{c.linesAdded}</TableCell>
                <TableCell className="text-right tabular-nums">{c.linesDeleted}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(c.commitStats.medianCommitSize)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(c.burstStats.burstRatio)}%
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(c.testCoupling.pctCommitsTouchingTests)}%
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(c.refactorBehavior.refactorCommitRatio)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type ChurnRow = {
  file: string;
  modifications: number;
  linesChanged: number;
};

export function RQ1ChurnHotspotCards({
  churnMods,
  churnLines,
}: {
  churnMods: ChurnRow[];
  churnLines: ChurnRow[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top by modifications</CardTitle>
          <CardDescription>
            Files that appear most often in commit file lists during the analysis window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Modifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {churnMods.slice(0, 10).map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs truncate max-w-[200px]">{c.file}</TableCell>
                  <TableCell className="text-right">{c.modifications}</TableCell>
                </TableRow>
              ))}
              {churnMods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    No git history
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top by lines changed</CardTitle>
          <CardDescription>Add + delete summed across commits in the analysis window.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Lines changed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {churnLines.slice(0, 10).map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs truncate max-w-[200px]">{c.file}</TableCell>
                  <TableCell className="text-right">{c.linesChanged}</TableCell>
                </TableRow>
              ))}
              {churnLines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    No git history
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
