import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/projects/$projectId/invoices")({ component: InvoicesPage });

const invoices = [
  { id: "CCF-10824", supplier: "CCF", date: "18 Apr", po: 7093, invoiced: 8340, variance: 1247, status: "variance" as const },
  { id: "MIN-44218", supplier: "Minster", date: "17 Apr", po: 4820, invoiced: 4820, variance: 0, status: "matched" as const },
  { id: "CCF-10818", supplier: "CCF", date: "15 Apr", po: 3776, invoiced: 3776, variance: 0, status: "matched" as const },
  { id: "MIN-44201", supplier: "Minster", date: "12 Apr", po: 2410, invoiced: 2492, variance: 82, status: "matched" as const },
  { id: "KNF-9981", supplier: "Knauf Direct", date: "08 Apr", po: 18420, invoiced: 18420, variance: 0, status: "paid" as const },
];

function InvoicesPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Invoices MTD" value="14" delta="£68.4k total" />
        <Kpi label="Auto-matched" value="79%" delta="11 of 14" tone="success" />
        <Kpi label="Variances" value="2" delta={`£${(1247 + 82).toLocaleString()} pending`} tone="warning" />
        <Kpi label="Paid" value="£42.8k" delta="62% of MTD" tone="success" />
      </div>

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
