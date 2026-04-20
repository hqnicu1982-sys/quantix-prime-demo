import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle } from "lucide-react";
import { invoices, invoiceLines } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoice Reconciliation — Quantix Prime" }] }),
  component: Invoices,
});

function Invoices() {
  const [selected, setSelected] = useState<string>("INV-1045");
  const detail = invoiceLines[selected as keyof typeof invoiceLines] ?? invoiceLines["INV-1045"];

  const matched = invoices.filter((i) => i.status === "matched").length;
  const flagged = invoices.length - matched;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Reconciliation</h1>
        <p className="text-sm text-muted-foreground">3-way matching · Invoice / PO / BoQ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Total invoices</p><p className="mt-1 text-2xl font-bold">{invoices.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Auto-matched</p><p className="mt-1 text-2xl font-bold text-success">{matched}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Flagged</p><p className="mt-1 text-2xl font-bold text-warning-foreground">{flagged}</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Invoice list */}
        <Card className="overflow-hidden">
          <div className="border-b bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Invoices
          </div>
          <ul className="max-h-[560px] divide-y overflow-y-auto">
            {invoices.map((inv) => {
              const active = selected === inv.id;
              return (
                <li key={inv.id}>
                  <button
                    onClick={() => setSelected(inv.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/30",
                      active && "bg-accent/10",
                    )}
                  >
                    <div>
                      <p className="font-medium">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.supplier} · {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">£{inv.total.toLocaleString()}</p>
                      <span className={cn(
                        "mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase",
                        inv.status === "matched" ? "text-success" : "text-warning-foreground",
                      )}>
                        {inv.status === "matched" ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {inv.status}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Detail panel */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
              <h2 className="text-xl font-bold">{selected} — {detail.supplier}</h2>
              <p className="text-xs text-muted-foreground">Received {detail.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-xl font-bold tabular-nums">£{detail.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="hidden grid-cols-3 gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Invoice line</span><span>PO line</span><span>BoQ line</span>
            </div>
            {detail.lines.map((l, i) => (
              <div key={i} className={cn(
                "grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-3",
                l.match ? "border-success/20 bg-success/5" : "border-warning/30 bg-warning/10",
              )}>
                <span>{l.invoice}</span>
                <span>{l.po}</span>
                <span className="flex items-center justify-between gap-2">
                  {l.boq}
                  {l.match
                    ? <Check className="h-4 w-4 shrink-0 text-success" />
                    : <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-warning/10 p-3 text-sm">
            <p className="font-semibold">Variance: £{detail.variance} over</p>
            <p className="text-xs text-muted-foreground">{detail.note}</p>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline">Reject</Button>
            <Button variant="outline">Query supplier</Button>
            <Button>Approve</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
