"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FileDetailSheet } from "./FileDetailSheet";
import type { RepoReport, PerFileEntry } from "@/lib/reportTypes";
import { fileStats } from "@/lib/perFileStats";

type SortKey = "file" | "functions" | "maxComplexity" | "avgComplexity" | "longestFn" | "maxNesting";
type SortDir = "asc" | "desc";

/** Initial visible rows; expands via “Show more” (matches Code Quality table UX). */
const INITIAL_VISIBLE_FILES = 15;
const VISIBLE_FILES_STEP = 15;

interface FileTableProps {
  report: RepoReport;
}

export function FileTable({ report }: FileTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("file");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedFile, setSelectedFile] = useState<PerFileEntry | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_FILES);

  const rows = useMemo(() => {
    let list = report.perFile
      .filter((pf) => pf.file.toLowerCase().includes(search.toLowerCase()))
      .map((pf) => ({ ...pf, ...fileStats(pf) }));

    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = a[sortKey as keyof typeof a];
      const bv = b[sortKey as keyof typeof b];
      if (typeof av === "number" && typeof bv === "number")
        return mult * (av - bv);
      return mult * String(av).localeCompare(String(bv));
    });
    return list;
  }, [report.perFile, search, sortKey, sortDir]);

  const visibleRows = rows.slice(0, visibleLimit);
  const remaining = Math.max(0, rows.length - visibleLimit);

  useEffect(() => {
    setVisibleLimit(INITIAL_VISIBLE_FILES);
  }, [report.analysis_timestamp, report.source?.commit]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
    setVisibleLimit(INITIAL_VISIBLE_FILES);
  };

  const Th = ({
    k,
    children,
  }: {
    k: SortKey;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <button
        type="button"
        onClick={() => handleSort(k)}
        className="hover:underline text-left w-full"
      >
        {children} {sortKey === k && (sortDir === "asc" ? "↑" : "↓")}
      </button>
    </TableHead>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>
            Search and sort by file metrics. Click a row for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by file path..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleLimit(INITIAL_VISIBLE_FILES);
            }}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <Th k="file">File</Th>
                <Th k="functions">Functions</Th>
                <Th k="maxComplexity">Max Complexity</Th>
                <Th k="avgComplexity">Avg Complexity</Th>
                <Th k="longestFn">Longest Fn</Th>
                <Th k="maxNesting">Max Nesting</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow
                  key={row.file}
                  className="cursor-pointer"
                  onClick={() => setSelectedFile(row)}
                >
                  <TableCell className="font-mono text-sm truncate max-w-[200px]">
                    {row.file}
                  </TableCell>
                  <TableCell>{row.functions}</TableCell>
                  <TableCell>{row.maxComplexity}</TableCell>
                  <TableCell>{row.avgComplexity.toFixed(1)}</TableCell>
                  <TableCell>{row.longestFn}</TableCell>
                  <TableCell>{row.maxNesting}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {rows.length > 0 ? (
              <span>
                Showing {Math.min(visibleLimit, rows.length)} of {rows.length} files
              </span>
            ) : null}
            {remaining > 0 || visibleLimit > INITIAL_VISIBLE_FILES ? (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {remaining > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleLimit((v) => Math.min(v + VISIBLE_FILES_STEP, rows.length))
                    }
                    className="font-medium text-primary hover:underline"
                  >
                    Show {Math.min(VISIBLE_FILES_STEP, remaining)} more files →
                  </button>
                ) : null}
                {visibleLimit > INITIAL_VISIBLE_FILES ? (
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(INITIAL_VISIBLE_FILES)}
                    className="font-medium text-primary hover:underline"
                  >
                    ← Show less
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <FileDetailSheet
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </>
  );
}
