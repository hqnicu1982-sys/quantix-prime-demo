import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, X } from "lucide-react";
import { invoices, invoiceLines, type InvoiceStatus } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoice Reconciliation — Quantix Prime" }] }),
  component: InvoicesWrapper,
});

const statusStyle = (s: InvoiceStatus) => {
  if (s === "matched") return "border-success/30 bg-success/10 text-success";
  if (s === "flagged") return "border-warning/30 bg-warning/10 text-warning-foreground";
  return "border-danger/30 bg-danger/10 text-danger";
};
const statusIcon = (s: InvoiceStatus) => s === "matched" ? Check : s === "flagged" ? AlertTriangle : X;

function InvoicesWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="invoice reconciliation" />;
  return <Invoices />;
}

function Invoices() {
  const [selected, setSelected] = useState<string>("INV-1045");
  const [filter, setFilter] = useState<string>("all");
  const detail = invoiceLines[selected] ?? invoiceLines["INV-1045"];

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const matched = invoices.filter((i) => i.status === "matched").length;
  const flagged = invoices.filter((i) => i.status === "flagged").length;
  const disputed = invoices.filter((i) => i.status === "disputed").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Reconciliation</h1>
        <p className="text-sm text-muted-foreground">3-way matching · Invoice / PO / BoQ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-3.5"><p className="text-[10px] uppercase text-muted-foreground">Total invoices</p><p className="mt-1 text-2xl font-bold">{invoices.length}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase text-muted-foreground">Auto-matched</p><p className="mt-1 text-2xl font-bold text-success">{matched}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase text-muted-foreground">Flagged</p><p className="mt-1 text-2xl font-bold text-warning-foreground">{flagged}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase text-muted-foreground">Disputed</p><p className="mt-1 text-2xl font-bold text-danger">{disputed}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Invoice list */}
        <Card className="overflow-hidden">
          <div className="flex gap-1 border-b bg-secondary/40 p-2 text-xs">
            {["all", "matched", "flagged", "disputed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "rounded px-2 py-1 font-medium capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              )}>
                {f}
              </button>
            ))}
          </div>
          <ul className="max-h-[600px] divide-y overflow-y-auto">
            {filtered.map((inv) => {
              const Icon = statusIcon(inv.status);
              const active = selected === inv.id;
              return (
                <li key={inv.id}>
                  <button
                    onClick={() => setSelected(inv.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/30",
                      active && "bg-accent/10 border-l-2 border-l-accent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">
                        {inv.supplier.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{inv.id}</p>
                        <p className="text-[11px] text-muted-foreground">{inv.supplier} · {inv.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">£{inv.total.toLocaleString()}</p>
                      <span className={cn("mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase", statusStyle(inv.status))}>
                        <Icon className="h-2.5 w-2.5" />
                        {inv.status}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Detail */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
              <h2 className="text-xl font-bold">{selected}</h2>
              <p className="text-xs text-muted-foreground">{detail.supplier} · received {detail.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total (incl. VAT)</p>
              <p className="text-xl font-bold tabular-nums">£{detail.total.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">VAT £{(detail.total * 0.2 / 1.2).toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md bg-secondary/40 px-3 py-2 text-[11px]">
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">XERO</span>
            <span className="text-muted-foreground">Will sync to Xero on approval</span>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">3-way match</p>
            <div className="hidden grid-cols-[40px_1fr_1fr_1fr] gap-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span></span><span>Invoice line</span><span>PO line</span><span>BoQ line</span>
            </div>
            <div className="space-y-2">
              {detail.lines.map((l, i) => (
                <div key={i} className={cn(
                  "grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-[40px_1fr_1fr_1fr]",
                  l.match ? "border-success/20 bg-success/5" : "border-warning/30 bg-warning/10",
                )}>
                  <div className="flex items-center">
                    {l.match ? <Check className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-warning-foreground" />}
                  </div>
                  <span>{l.invoice}</span>
                  <span>{l.po}</span>
                  <span>{l.boq}</span>
                </div>
              ))}
            </div>
          </div>

          {detail.variance > 0 && (
            <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
              <p className="font-semibold">Variance: £{detail.variance} over PO</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail.note}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => toast.info("Dayworks log opened")}>View dayworks log</Button>
            <Button variant="outline" onClick={() => toast.error("Invoice rejected", { description: `${selected} sent back to supplier` })}>
              Reject
            </Button>
            <Button variant="outline" onClick={() => toast.warning("Query sent", { description: `${detail.supplier} notified` })}>
              Query supplier
            </Button>
            <Button onClick={() => toast.success("Approved & posted to Xero", { description: `${selected} · £${detail.total.toLocaleString()}` })}>
              Approve & post to Xero
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
