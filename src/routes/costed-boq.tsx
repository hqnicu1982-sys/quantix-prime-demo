import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, FileDown, Lock } from "lucide-react";
import { costedBoq, type BoqRow } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/costed-boq")({
  head: () => ({ meta: [{ title: "Costed BoQ — Quantix Prime" }] }),
  component: CostedWrapper,
});

function CostedWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="costed BoQ" />;
  return <Costed />;
}

function Costed() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "L3 Partitions": true, "L2 Partitions": true, "L3 Ceilings": true, "Firestopping": false, "Miscellaneous": false,
  });
  const [selected, setSelected] = useState<BoqRow | null>(null);

  const totalValue = costedBoq.reduce((s, r) => s + r.value, 0);
  const totalCheapest = costedBoq.reduce((s, r) => s + r.cheapest * r.qty, 0);
  const margin = totalValue - totalCheapest;
  const marginPct = (margin / totalValue) * 100;

  const groups = Array.from(new Set(costedBoq.map((r) => r.system)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Costed BoQ</h1>
          <p className="text-sm text-muted-foreground">Bill of Quantities with live cost intelligence</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline"><FileDown className="mr-1 h-3.5 w-3.5" />Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.success("Client quote PDF generating...")}>Client quote — PDF (branded)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Excel exported")}>Client quote — Excel raw</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Internal BoQ PDF generating...")}>Internal costed BoQ — PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Internal BoQ Excel exported")}>Internal costed BoQ — Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total BoQ value</p><p className="mt-1 text-xl font-bold tabular-nums">£{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Costed</p><p className="mt-1 text-xl font-bold">{costedBoq.length}/{costedBoq.length}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Matched suppliers</p><p className="mt-1 text-xl font-bold">22/{costedBoq.length}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Forecast cost</p><p className="mt-1 text-xl font-bold tabular-nums">£{totalCheapest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Forecast margin</p><p className="mt-1 text-xl font-bold text-success tabular-nums">{marginPct.toFixed(1)}%</p><p className="text-[10px] text-muted-foreground">£{margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Code</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-2 py-2.5 text-right">Qty</th>
                <th className="px-2 py-2.5 text-right">Rate</th>
                <th className="px-2 py-2.5 text-right">Value</th>
                <th className="px-2 py-2.5 text-right">Cheapest</th>
                <th className="px-2 py-2.5 text-right">Cost var</th>
                <th className="px-2 py-2.5 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {groups.flatMap((sys) => {
                const groupRows = costedBoq.filter((r) => r.system === sys);
                const value = groupRows.reduce((s, r) => s + r.value, 0);
                const open = openGroups[sys];
                const all = [
                  <tr key={sys} className="bg-secondary/40">
                    <td colSpan={8} className="px-3 py-2">
                      <button onClick={() => setOpenGroups((g) => ({ ...g, [sys]: !g[sys] }))} className="flex w-full items-center justify-between text-left">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
                          {sys} <span className="font-normal text-muted-foreground">({groupRows.length} items)</span>
                        </span>
                        <span className="text-xs font-bold tabular-nums">£{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </button>
                    </td>
                  </tr>,
                ];
                if (open) {
                  groupRows.forEach((r) => {
                    all.push(
                      <tr key={r.code} className="cursor-pointer hover:bg-accent/5" onClick={() => setSelected(r)}>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{r.code}</td>
                        <td className="px-3 py-2.5">{r.description}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{r.qty} {r.unit}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">£{r.rate.toFixed(2)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums font-medium">£{r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-accent">£{r.cheapest.toFixed(2)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-success">£{Math.abs(r.costVar).toFixed(0)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-success">+£{r.marginImpact.toLocaleString()}</td>
                      </tr>
                    );
                  });
                }
                return all;
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side panel */}
      <Sheet open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle><span className="font-mono text-sm">{selected.code}</span></SheetTitle>
                <p className="text-sm">{selected.description}</p>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <Card className="p-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Qty</span><span className="font-medium">{selected.qty} {selected.unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tender rate</span><span className="font-medium tabular-nums">£{selected.rate.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tender value</span><span className="font-semibold tabular-nums">£{selected.value.toLocaleString()}</span></div>
                </Card>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplier comparison</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between rounded-md border border-success/30 bg-success/5 p-2"><span>CCF</span><span className="font-bold text-success tabular-nums">£{selected.cheapest.toFixed(2)}</span></div>
                    <div className="flex justify-between rounded-md border p-2"><span>SIG</span><span className="tabular-nums">£{(selected.cheapest * 1.05).toFixed(2)}</span></div>
                    <div className="flex justify-between rounded-md border p-2"><span>Jewson</span><span className="tabular-nums">£{(selected.cheapest * 1.08).toFixed(2)}</span></div>
                  </div>
                </div>
                <Card className="bg-success/5 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Margin impact if locked at cheapest</p>
                  <p className="mt-1 text-2xl font-bold text-success">+£{selected.marginImpact.toLocaleString()}</p>
                </Card>
                <Button className="w-full" onClick={() => { toast.success("Supplier locked", { description: `${selected.code} → CCF` }); setSelected(null); }}>
                  <Lock className="mr-1.5 h-4 w-4" />Lock supplier choice
                </Button>
                <Button variant="outline" className="w-full">View historical pricing <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
