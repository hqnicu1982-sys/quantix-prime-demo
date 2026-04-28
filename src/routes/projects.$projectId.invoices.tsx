import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, CheckCircle2, CircleDollarSign } from "lucide-react";
import { useInvoices, useInvoiceTotals, markInvoicePaid } from "@/lib/invoiceRegistry";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId/invoices")({ component: InvoicesPage });

const invoices = [
  { id: "CCF-10824", supplier: "CCF", date: "18 Apr", po: 7093, invoiced: 8340, variance: 1247, status: "variance" as const },
  { id: "MIN-44218", supplier: "Minster", date: "17 Apr", po: 4820, invoiced: 4820, variance: 0, status: "matched" as const },
  { id: "CCF-10818", supplier: "CCF", date: "15 Apr", po: 3776, invoiced: 3776, variance: 0, status: "matched" as const },
  { id: "MIN-44201", supplier: "Minster", date: "12 Apr", po: 2410, invoiced: 2492, variance: 82, status: "matched" as const },
  { id: "KNF-9981", supplier: "Knauf Direct", date: "08 Apr", po: 18420, invoiced: 18420, variance: 0, status: "paid" as const },
];

function InvoicesPage() {
  const { projectId } = Route.useParams();
  const registry = useInvoices(projectId);
  const totals = useInvoiceTotals(projectId);
  const today = new Date().toISOString().slice(0, 10);
  const sortedRegistry = [...registry].sort((a, b) => {
    const aOverdue = a.status === "outstanding" && a.due < today;
    const bOverdue = b.status === "outstanding" && b.due < today;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aOverdue && bOverdue) return a.due.localeCompare(b.due); // most overdue first
    return a.due.localeCompare(b.due);
  });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receivables" value={`£${(totals.receivables / 1000).toFixed(0)}k`} delta={totals.overdueReceivable > 0 ? `£${(totals.overdueReceivable / 1000).toFixed(0)}k overdue` : "all current"} tone={totals.overdueReceivable > 0 ? "warning" : "success"} />
        <Kpi label="Payables" value={`£${(totals.payables / 1000).toFixed(0)}k`} delta={totals.overduePayable > 0 ? `£${(totals.overduePayable / 1000).toFixed(0)}k overdue` : "all current"} tone={totals.overduePayable > 0 ? "danger" : "neutral"} />
        <Kpi label="Net position" value={`£${(totals.net / 1000).toFixed(0)}k`} delta={totals.net >= 0 ? "positive" : "negative"} tone={totals.net >= 0 ? "success" : "danger"} />
        <Kpi label="Paid out MTD" value={`£${(totals.paidOut / 1000).toFixed(0)}k`} delta={`£${(totals.paidIn / 1000).toFixed(0)}k received`} />
      </div>

      <Card>
        <CardHead
          title="Invoice ledger"
          subtitle="Live receivables & payables · feeds the financial dashboard"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Direction</th>
                <th className="px-4 py-2.5 text-left font-semibold">Counterparty</th>
                <th className="px-4 py-2.5 text-left font-semibold">Reference</th>
                <th className="px-4 py-2.5 text-left font-semibold">Issued</th>
                <th className="px-4 py-2.5 text-left font-semibold">Due</th>
                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {registry.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No invoices in the ledger yet.</td></tr>
              )}
              {sortedRegistry.map((inv) => {
                const overdue = (inv.status === "outstanding") && inv.due < today;
                const daysOverdue = overdue
                  ? Math.floor((Date.parse(today) - Date.parse(inv.due)) / 86400000)
                  : 0;
                return (
                  <tr key={inv.id} className={`hover:bg-[var(--ink-50)] ${overdue ? "bg-[var(--red-500)]/5" : ""}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${inv.direction === "receivable" ? "bg-[var(--green-600)]/10 text-[var(--green-600)]" : "bg-[var(--accent-500)]/10 text-[var(--accent-500)]"}`}>
                        <CircleDollarSign className="h-3 w-3" />
                        {inv.direction === "receivable" ? "In" : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{inv.counterparty}</td>
                    <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-700)]">{inv.reference}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{inv.issued}</td>
                    <td className={`px-4 py-3 text-[12px] ${overdue ? "font-semibold text-[var(--red-500)]" : "text-[var(--ink-500)]"}`}>{inv.due}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">£{inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {inv.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 rounded border border-[var(--red-500)]/30 bg-[var(--red-500)]/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--red-500)]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--red-500)] opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--red-500)]" />
                          </span>
                          <AlertTriangle className="h-3 w-3" /> Overdue {daysOverdue}d
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ink-500)]">Outstanding</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status !== "paid" && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { markInvoicePaid(inv.id); toast.success(`${inv.reference} marked paid`); }}>
                          Mark paid
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Invoice reconciliation"
          subtitle="Three-way match: PO ↔ Delivery ↔ Invoice"
          right={<Button size="sm" variant="outline" asChild><Link to="/invoices">Full inbox <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Invoice</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                <th className="px-4 py-2.5 text-right font-semibold">PO £</th>
                <th className="px-4 py-2.5 text-right font-semibold">Invoiced £</th>
                <th className="px-4 py-2.5 text-right font-semibold">Variance</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-700)]">{i.id}</td>
                  <td className="px-4 py-3 font-semibold">{i.supplier}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{i.date}</td>
                  <td className="px-4 py-3 text-right font-mono-num">£{i.po.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono-num">£{i.invoiced.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-mono-num font-semibold ${i.variance > 100 ? "text-[var(--red-500)]" : i.variance > 0 ? "text-[var(--amber-500)]" : "text-[var(--ink-500)]"}`}>
                    {i.variance > 0 ? `+£${i.variance.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {i.status === "variance" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--red-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--red-500)]"><AlertTriangle className="h-3 w-3" /> Variance</span>
                    ) : i.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ink-500)]"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]"><CheckCircle2 className="h-3 w-3" /> Matched</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
