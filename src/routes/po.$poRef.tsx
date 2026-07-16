import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { invoices } from "@/lib/mockData";
import { matchLines } from "@/lib/invoiceWorkflow";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/po/$poRef")({
  component: GuardedPoDetail,
  notFoundComponent: () => (
    <Card><div className="p-6 text-center text-[13px]">
      <p className="font-semibold">Purchase order not found</p>
      <Button asChild className="mt-3" size="sm"><Link to="/invoices">Back to invoices</Link></Button>
    </div></Card>
  ),
});

function GuardedPoDetail() {
  const allowed = useCan("view.calloffs");
  if (!allowed) return <NoAccess cap="view.calloffs" title="Call-offs restricted" />;
  return <PoDetail />;
}

function PoDetail() {
  const { poRef } = Route.useParams();
  const inv = invoices.find((i) => i.poRef === poRef);
  if (!inv) throw notFound();
  const lines = matchLines[inv.id] ?? [];
  const poTotal = lines.reduce((s, l) => s + l.poValue, 0) || inv.expected;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/invoices/$ref" params={{ ref: inv.id }}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to invoice {inv.id}
          </Link>
        </Button>
        <StatusBadge tone="info" dot>Approved PO</StatusBadge>
      </div>

      <Card>
        <CardHead
          title={`${poRef} · ${inv.supplier}`}
          subtitle={`Call-off ${inv.callOffRef} · raised against framework agreement`}
          right={<span className="text-[10.5px] text-[var(--ink-500)]"><FileText className="inline h-3 w-3" /> commit-only document</span>}
        />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Kpi label="PO value (net)" value={`£${poTotal.toLocaleString()}`} />
          <Kpi label="Call-off" value={inv.callOffRef} tone="info" />
          <Kpi label="Supplier" value={inv.supplier} tone="info" />
        </div>
      </Card>

      <Card>
        <CardHead title="PO lines" subtitle="Approved quantities, rates and values" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                <th className="px-4 py-2.5 text-right font-semibold">PO qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rate</th>
                <th className="px-4 py-2.5 text-right font-semibold">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {lines.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No line detail captured.</td></tr>
              )}
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium">{l.material}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{l.poQty.toLocaleString()} {l.unit}</td>
                  <td className="px-4 py-3 text-right font-mono-num">£{l.poRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">£{l.poValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[var(--ink-50)] text-[12px] font-semibold">
              <tr>
                <td className="px-4 py-2.5" colSpan={3}>PO total</td>
                <td className="px-4 py-2.5 text-right font-mono-num">£{poTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Linked documents" subtitle="Trace the commit ↔ delivery ↔ invoice chain" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <Link to="/invoices/$ref" params={{ ref: inv.id }} className={cn("rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]")}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><FileText className="h-3 w-3" /> Invoice</div>
            <div className="mt-1 text-[13px] font-semibold">{inv.id}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">£{inv.invoiced.toLocaleString()}</div>
          </Link>
          <Link to="/grn/$ref" params={{ ref: inv.id }} className="rounded-md border border-[var(--ink-200)] p-3 hover:border-[var(--accent-500)]/40 hover:bg-[var(--ink-50)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-500)]"><Truck className="h-3 w-3" /> Goods received note</div>
            <div className="mt-1 text-[13px] font-semibold">GRN-{inv.id}</div>
            <div className="text-[11.5px] text-[var(--ink-500)]">Signed on site</div>
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