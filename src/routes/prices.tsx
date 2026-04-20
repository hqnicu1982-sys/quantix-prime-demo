import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { priceComparison } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prices")({
  head: () => ({ meta: [{ title: "Price Comparison — Quantix Prime" }] }),
  component: Prices,
});

const suppliers = ["sig", "ccf", "jewson", "bg"] as const;
const supplierLabels: Record<string, string> = { sig: "SIG", ccf: "CCF", jewson: "Jewson", bg: "British Gypsum" };

function Prices() {
  const [filter, setFilter] = useState<string>("all");

  const rows = useMemo(() => priceComparison.map((r) => {
    const prices = suppliers.map((s) => r[s]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { ...r, min, max, savings: +(max - min).toFixed(2) };
  }), []);

  const totalSavings = rows.reduce((sum, r) => sum + r.savings * 100, 0); // assume 100 unit volumes

  const filtered = filter === "all" ? rows : rows.filter((r) => r[filter as typeof suppliers[number]] === r.min);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Price Comparison</h1>
          <p className="text-sm text-muted-foreground">Multi-supplier rates for live BoQ items</p>
        </div>
        <Card className="px-4 py-2.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total savings if switched</p>
          <p className="text-xl font-bold text-success">£{totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers.map((s) => <SelectItem key={s} value={s}>Cheapest from {supplierLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Item</th>
                <th className="px-3 py-2.5">Unit</th>
                {suppliers.map((s) => <th key={s} className="px-3 py-2.5 text-right">{supplierLabels[s]}</th>)}
                <th className="px-4 py-2.5 text-right">Saving / unit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.item}>
                  <td className="px-4 py-3 font-medium">{r.item}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.unit}</td>
                  {suppliers.map((s) => {
                    const v = r[s];
                    return (
                      <td
                        key={s}
                        className={cn(
                          "px-3 py-3 text-right tabular-nums",
                          v === r.min && "bg-success/10 font-semibold text-success",
                          v === r.max && "bg-danger/5 text-danger",
                        )}
                      >
                        £{v.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold text-success">£{r.savings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
