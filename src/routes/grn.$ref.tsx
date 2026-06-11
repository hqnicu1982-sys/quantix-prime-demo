import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGrn } from "@/lib/grnRegistry";
import { invoices } from "@/lib/mockData";

const STATUS_TONE = {
  scheduled:    "neutral" as const,
  "in-transit": "info" as const,
  partial:      "warning" as const,
  received:     "success" as const,
};
const STATUS_LABEL = {
  scheduled:    "Scheduled",
  "in-transit": "In transit",
  partial:      "Partial GRN",
  received:     "GRN signed",
};

export const Route = createFileRoute("/grn/$ref")({
  component: GrnDetail,
  notFoundComponent: () => (
    <Card><div className="p-6 text-center text-[13px]">
      <p className="font-semibold">GRN not found</p>
      <Button asChild className="mt-3" size="sm"><Link to="/calloffs/deliveries">Back to deliveries</Link></Button>
    </div></Card>
  ),
});

function GrnDetail() {
  const { ref } = Route.useParams();
  const grn = useGrn(ref);
  if (!grn) throw notFound();

  // Find the linked invoice if this GRN came from one (preserves the
  // PO ↔ GRN ↔ Invoice chain on legacy detail pages).
  const linkedInvoice = grn.sourceInvoiceId
    ? invoices.find((i) => i.id === grn.sourceInvoiceId)
    : invoices.find((i) => i.callOffRef === grn.callOffRef);

  const signedAtDisplay = grn.signedAt
    ? (grn.signedAt.includes("T") ? new Date(grn.signedAt).toLocaleString() : grn.signedAt)
    : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/calloffs/$ref" params={{ ref: grn.callOffRef }}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to call-off {grn.callOffRef}
          </Link>
        </Button>
        <StatusBadge tone={STATUS_TONE[grn.status]} dot>{STATUS_LABEL[grn.status]}</StatusBadge>
      </div>

      <Card>
        <CardHead
          title={`${grn.id} · ${grn.supplier}`}
          subtitle={`Delivery against ${grn.callOffRef}${linkedInvoice ? ` · invoice ${linkedInvoice.id}` : ""}`}
          right={<span className="text-[10.5px] text-[var(--ink-500)]"><Truck className="inline h-3 w-3" /> proof of delivery</span>}
        />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Kpi label="Signed at" value={signedAtDisplay} tone={grn.signedAt ? "info" : "neutral"} />
          <Kpi label="Signed by" value={grn.signedBy ?? "Awaiting delivery"} />
          <Kpi label="Quantity" value={grn.qty} />
        </div>
        {grn.note && (
          <div className="border-t border-[var(--ink-200)] px-5 py-3 text-[12px] text-[var(--ink-500)]">
            <span className="font-semibold text-[var(--ink-700)]">Note:</span> {grn.note}
          </div>
        )}
      </Card>

      {grn.lines && grn.lines.length > 0 && (
        <Card>
          <CardHead title="Goods received" subtitle="Per-line delivery quantities against the PO" />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Ordered</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Received</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Δ qty</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-200)]">
                {grn.lines.map((l, i) => {
                  const delta = l.receivedQty - l.orderedQty;
                  return (
                    <tr key={i} className={cn(delta !== 0 && "bg-[var(--amber-500)]/5")}>
                      <td className="px-4 py-3 font-medium">{l.material}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{l.orderedQty.toLocaleString()} {l.unit}</td>
                      <td className={cn("px-4 py-3 text-right font-mono-num", delta !== 0 && "font-semibold text-[var(--amber-500)]")}>{l.receivedQty.toLocaleString()}</td>
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
      )}

      <Card>
        <CardHead title="Linked documents" subtitle="Trace the commit ↔ delivery ↔ invoice chain" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {linkedInvoice ? (
            <Link to="/po/$poRef" params={{ poRef: linkedInvoice.poRef }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Purchase order</div>
              <div className="mt-1 text-[13px] font-semibold">{linkedInvoice.poRef}</div>
              <div className="text-[11.5px] text-[var(--ink-500)]">£{linkedInvoice.expected.toLocaleString()} committed</div>
            </Link>
          ) : (
            <div className="rounded-md border border-[var(--ink-200)] p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Purchase order</div>
              <div className="mt-1 text-[13px] font-semibold">Pending</div>
              <div className="text-[11.5px] text-[var(--ink-500)]">PO not yet issued</div>
            </div>
          )}
          {linkedInvoice ? (
            <Link to="/invoices/$ref" params={{ ref: linkedInvoice.id }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Invoice</div>
              <div className="mt-1 text-[13px] font-semibold">{linkedInvoice.id}</div>
              <div className="text-[11.5px] text-[var(--ink-500)]">£{linkedInvoice.invoiced.toLocaleString()}</div>
            </Link>
          ) : (
            <div className="rounded-md border border-[var(--ink-200)] p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Invoice</div>
              <div className="mt-1 text-[13px] font-semibold">Awaiting</div>
              <div className="text-[11.5px] text-[var(--ink-500)]">No invoice received yet</div>
            </div>
          )}
          <Link to="/calloffs/$ref" params={{ ref: grn.callOffRef }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Call-off</div>
            <div className="mt-1 text-[13px] font-semibold">{grn.callOffRef}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">Framework draw-down</div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
