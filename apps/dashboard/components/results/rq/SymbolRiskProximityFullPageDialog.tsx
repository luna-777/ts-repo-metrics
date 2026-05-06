"use client";

import { useState } from "react";
import { Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SymbolVerificationRisk } from "@/lib/reportTypes";
import { cn } from "@/lib/utils";
import { SymbolRiskTable } from "./SymbolRiskTable";

const MODAL_PAGE_SIZE = 40;

interface SymbolRiskProximityFullPageDialogProps {
  rows: SymbolVerificationRisk[];
  /** Remounts the paginated table when analysis scope or dataset changes. */
  instanceKey: string;
}

export function SymbolRiskProximityFullPageDialog({
  rows,
  instanceKey,
}: SymbolRiskProximityFullPageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Table2 className="size-4 shrink-0" aria-hidden />
        Open full table
        <span className="tabular-nums text-muted-foreground">({rows.length})</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            "top-0 left-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-xl",
            "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:max-w-none",
          )}
        >
          <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
            <DialogTitle>Complexity versus test proximity</DialogTitle>
            <DialogDescription className="text-left">
              Sort columns, filter by risk tier, and step through pages. This is not line coverage—see the
              chart on the main tab for how dots map to bands.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <SymbolRiskTable key={instanceKey} rows={rows} pageSize={MODAL_PAGE_SIZE} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
