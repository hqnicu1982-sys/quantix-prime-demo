import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { priceComparison } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prices")({
  head: () => ({ meta: [{ title: "Price Comparison — Quantix Prime" }] }),
  component: PricesWrapper,
});

const suppliers = ["sig", "ccf", "jewson", "bg"] as const;
type SupplierKey = typeof suppliers[number];
const supplierLabels: Record<SupplierKey, string> = { sig: "SIG", ccf: "CCF", jewson: "Jewson", bg: "British Gypsum" };

function PricesWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="price comparison" />;
  return <Prices />;
}

function Prices() {
  const [active, setActive] = useState<Record<SupplierKey, boolean>>({ sig: true, ccf: true, jewson: true, bg: false });
  const [category, setCategory] = useState<string>("all");
  const [fullCoverageOnly, setFullCoverageOnly] = useState(false);

  const activeKeys = suppliers.filter((s) => active[s]);
  const categories = useMemo(() => Array.from(new Set(priceComparison.map((p) => p.category))), []);

  const rows = useMemo(() => priceComparison.map((r) => {
    const prices = activeKeys.map((s) => r[s]).filter((v) => v > 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const cheapestSupplier = activeKeys.find((s) => r[s] === min) ?? null;
    const savingPerUnit = max - min;
    const totalSaving = savingPerUnit * r.qty;
    return { ...r, min, max, cheapestSupplier, savingPerUnit, totalSaving, coverage: prices.length };
  }), [activeKeys]);

  const filtered = rows.filter((r) => {
    if (category !== "all" && r.category !== category) return false;
    if (fullCoverageOnly && r.coverage < activeKeys.length) return false;
    return true;
  });

  const totalSavings = filtered.reduce((sum, r) => sum + r.totalSaving, 0);
  const fullCoverage = rows.filter((r) => r.coverage === activeKeys.length).length;
  const cheapestCount: Record<string, number> = {};
  rows.forEach((r) => { if (r.cheapestSupplier) cheapestCount[r.cheapestSupplier] = (cheapestCount[r.cheapestSupplier] || 0) + 1; });
  const topSupplier = Object.entries(cheapestCount).sort(([,a], [,b]) => b - a)[0];

  // Recommended split
  const split: Record<SupplierKey, { count: number; value: number }> = { sig: { count: 0, value: 0 }, ccf: { count: 0, value: 0 }, jewson: { count: 0, value: 0 }, bg: { count: 0, value: 0 } };
  rows.forEach((r) => {
    if (r.cheapestSupplier) {
      split[r.cheapestSupplier].count += 1;
      split[r.cheapestSupplier].value += r.min * r.qty;
    }
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Price Comparison</h1>
        <p className="text-sm text-muted-foreground">Multi-supplier rates for live BoQ items</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total potential savings</p>
          <p className="mt-1 text-2xl font-bold text-success">£{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-[11px] text-muted-foreground">If all cheapest selections taken</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Full coverage items</p>
          <p className="mt-1 text-2xl font-bold">{fullCoverage} of {rows.length}</p>
          <p className="text-[11px] text-muted-foreground">Quoted by all selected suppliers</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cheapest overall</p>
          <p className="mt-1 text-2xl font-bold">{topSupplier ? supplierLabels[topSupplier[0] as SupplierKey] : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{topSupplier?.[1]} of {rows.length} items</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suppliers:</span>
            {suppliers.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input type="checkbox" checked={active[s]} onChange={() => setActive((a) => ({ ...a, [s]: !a[s] }))} className="h-4 w-4" />
                {supplierLabels[s]}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category:</span>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cov" checked={fullCoverageOnly} onCheckedChange={setFullCoverageOnly} />
            <Label htmlFor="cov" className="cursor-pointer text-xs">Full coverage only</Label>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">BoQ item</th>
                  <th className="px-2 py-2.5 text-right">Qty</th>
                  {activeKeys.map((s) => <th key={s} className="px-2 py-2.5 text-right">{supplierLabels[s]}</th>)}
                  <th className="px-3 py-2.5 text-right">Saving</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.item}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{r.item}</p>
                      <p className="text-[10px] text-muted-foreground">{r.category}</p>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{r.qty}{r.unit}</td>
                    {activeKeys.map((s) => {
                      const v = r[s];
                      return (
                        <td key={s} className={cn(
                          "px-2 py-2.5 text-right tabular-nums text-xs",
                          v > 0 && v === r.min && "bg-success/10 font-bold text-success",
                          v > 0 && v === r.max && r.coverage > 1 && "bg-danger/5 text-danger",
                        )}>
                          {v > 0 ? `£${v.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-success">£{r.totalSaving.toFixed(0)}</td>
                    <td className="px-3 py-2.5"><Button size="sm" variant="ghost" onClick={() => toast.success("Added to PO draft", { description: r.item })}>Add</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit p-4 lg:sticky lg:top-20">
          <h3 className="font-semibold">Recommended order split</h3>
          <p className="text-xs text-muted-foreground">Based on cheapest coverage</p>
          <div className="mt-4 space-y-2">
            {(suppliers as readonly SupplierKey[]).filter((s) => active[s] && split[s].count > 0).map((s) => (
              <div key={s} className="flex justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{supplierLabels[s]}</p>
                  <p className="text-[11px] text-muted-foreground">{split[s].count} items</p>
                </div>
                <p className="font-semibold tabular-nums">£{split[s].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
            <div className="flex justify-between pt-1 text-sm font-bold">
              <span>Total</span>
              <span className="tabular-nums">£{Object.values(split).reduce((s, x) => s + x.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <p className="pt-1 text-[11px] text-success">Saving vs single supplier: £{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <Button className="mt-4 w-full" onClick={() => toast.success("Split POs generated", { description: "3 draft POs ready for approval" })}>
            Generate split POs
          </Button>
        </Card>
      </div>
    </div>
  );
}
