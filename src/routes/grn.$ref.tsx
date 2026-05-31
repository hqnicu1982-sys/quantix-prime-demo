import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { invoices } from "@/lib/mockData";
import { matchLines } from "@/lib/invoiceWorkflow";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/grn/$ref")({
  component: GrnDetail,
  notFoundComponent: () => (
    <Card><div className="p-6 text-center text-[13px]">
      <p className="font-semibold">GRN not found</p>
      <Button asChild className="mt-3" size="sm"><Link to="/invoices">Back to invoices</Link></Button>
    </div></Card>
  ),
});

function GrnDetail() {
  const { ref } = Route.useParams();
  const inv = invoices.find((i) => i.id === ref);
  if (!inv) throw notFound();
  const lines = matchLines[ref] ?? [];
  const grnId = `GRN-${ref}`;
  const signedBy = inv.supplier === "Minster" ? "Tom B (foreman)" : "Sarah M (site QS)";
  const signedAt = inv.received;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/invoices/$ref" params={{ ref }}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to invoice {ref}
          </Link>
        </Button>
        <StatusBadge tone={lines.some((l) => l.grnQty !== l.poQty) ? "warning" : "success"} dot>
          {lines.some((l) => l.grnQty !== l.poQty) ? "Quantity discrepancy" : "GRN signed"}
        </StatusBadge>
      </div>

      <Card>
        <CardHead
          title={`${grnId} · ${inv.supplier}`}
          subtitle={`Delivery against ${inv.poRef} · received ${signedAt}`}
          right={<span className="text-[10.5px] text-[var(--ink-500)]"><Truck className="inline h-3 w-3" /> proof of delivery</span>}
        />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Kpi label="Received" value={signedAt} tone="info" />
          <Kpi label="Signed by" value={signedBy} />
          <Kpi label="Linked PO" value={inv.poRef} tone="info" />
        </div>
      </Card>

      <Card>
        <CardHead title="Goods received" subtitle="Per-line delivery quantities against the PO" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                <th className="px-4 py-2.5 text-right font-semibold">PO qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">GRN qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Δ qty</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {lines.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No line detail captured.</td></tr>
              )}
              {lines.map((l, i) => {
                const delta = l.grnQty - l.poQty;
                return (
                  <tr key={i} className={cn(delta !== 0 && "bg-[var(--amber-500)]/5")}>
                    <td className="px-4 py-3 font-medium">{l.material}</td>
                    <td className="px-4 py-3 text-right font-mono-num">{l.poQty.toLocaleString()} {l.unit}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num", delta !== 0 && "font-semibold text-[var(--amber-500)]")}>{l.grnQty.toLocaleString()}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num", delta > 0 ? "text-[var(--green-600)]" : delta < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-500)]")}>
                      {delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${delta}`}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]">
                      {delta === 0 ? "Matches PO" : delta > 0 ? "Over-delivery flagged" : "Short delivery"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Linked documents" subtitle="Trace the commit ↔ delivery ↔ invoice chain" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <Link to="/po/$poRef" params={{ poRef: inv.poRef }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Purchase order</div>
            <div className="mt-1 text-[13px] font-semibold">{inv.poRef}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">£{inv.expected.toLocaleString()} committed</div>
          </Link>
          <Link to="/invoices/$ref" params={{ ref }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Invoice</div>
            <div className="mt-1 text-[13px] font-semibold">{ref}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">£{inv.invoiced.toLocaleString()}</div>
          </Link>
          <div className="rounded-md border border-[var(--ink-200)] p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Call-off</div>
            <div className="mt-1 text-[13px] font-semibold">{inv.callOffRef}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">Framework draw-down</div>
          </div>
        </div>
      </Card>
    </div>
  );
}