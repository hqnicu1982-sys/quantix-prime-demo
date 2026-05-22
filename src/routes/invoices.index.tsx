import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { invoices, invoiceKpi, reconFlow, fmtMoney } from "@/lib/mockData";
import { deriveStage, STAGE_LABEL, STAGE_TONE } from "@/lib/invoiceWorkflow";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/invoices/")({ component: Inbox });

function Inbox() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "review" | "approved" | "paid" | "disputed">("all");

  const rows = invoices.filter((inv) => {
    const stage = deriveStage(inv);
    if (filter === "review" && stage !== "review") return false;
    if (filter === "approved" && stage !== "approved") return false;
    if (filter === "paid" && stage !== "paid") return false;
    if (filter === "disputed" && inv.state !== "disputed") return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return inv.id.toLowerCase().includes(needle) || inv.supplier.toLowerCase().includes(needle) || inv.poRef.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Invoices this month" value={`${invoiceKpi.total}`} />
        <Kpi label="Auto-matched" value={`${invoiceKpi.autoMatched}`} delta={`${Math.round((invoiceKpi.autoMatched / invoiceKpi.total) * 100)}% rate`} tone="success" />
        <Kpi label="Flagged" value={`${invoiceKpi.flagged}`} delta={`£${invoiceKpi.flaggedVariance.toLocaleString()} variance`} tone="warning" />
        <Kpi label="Disputed" value={`${invoiceKpi.disputed}`} delta="£1,807 total" tone="danger" />
      </div>

      <Card>
        <CardHead title="Reconciliation flow" subtitle="From estimate to paid — every invoice traceable" />
        <div className="flex flex-wrap items-center gap-3 p-5">
          {reconFlow.map((step, i) => (
            <div key={step.id} className="flex flex-1 items-center gap-3">
              <div className={cn(
                "flex-1 rounded-lg border-2 p-4 text-center",
                step.tone === "neutral" && "border-[var(--ink-200)] bg-[var(--ink-50)]",
                step.tone === "info" && "border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5",
                step.tone === "warning" && "border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5",
                step.tone === "success" && "border-[var(--green-600)]/30 bg-[var(--green-600)]/5",
              )}>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{step.label}</p>
                <p className="font-display mt-1.5 text-[20px] font-semibold tabular-nums">{fmtMoney(step.value, { compact: true })}</p>
                {step.suffix && <p className="mt-0.5 text-[10.5px] text-[var(--ink-500)]">{step.suffix}</p>}
              </div>
              {i < reconFlow.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title="All invoices"
          subtitle="Click a row to open the 3-way match detail"
          right={
            <div className="flex items-center gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref / supplier / PO" className="h-8 w-[220px] text-[12px]" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-8 rounded-md border border-[var(--ink-200)] bg-background px-2 text-[12px]">
                <option value="all">All stages</option>
                <option value="review">QS review</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">PO / Call-off</th>
                <th className="px-4 py-2.5 text-left font-semibold">Received</th>
                <th className="px-4 py-2.5 text-right font-semibold">Invoiced</th>
                <th className="px-4 py-2.5 text-right font-semibold">Variance</th>
                <th className="px-4 py-2.5 text-left font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[var(--ink-500)]">No invoices match the filter.</td></tr>
              )}
              {rows.map((inv) => {
                const stage = deriveStage(inv);
                return (
                  <tr key={inv.id} className="cursor-pointer hover:bg-[var(--ink-50)]">
                    <td className="px-4 py-3 font-mono-num font-semibold">
                      <Link to="/invoices/$ref" params={{ ref: inv.id }} className="hover:underline">{inv.id}</Link>
                    </td>
                    <td className="px-4 py-3">{inv.supplier}</td>
                    <td className="px-4 py-3 font-mono-num text-[11.5px] text-[var(--ink-500)]">{inv.poRef} · {inv.callOffRef}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{inv.received}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">£{inv.invoiced.toLocaleString()}</td>
                    <td className={cn(
                      "px-4 py-3 text-right font-mono-num font-semibold",
                      inv.variance === 0 ? "text-[var(--green-600)]" : inv.state === "disputed" ? "text-[var(--red-500)]" : "text-[var(--amber-500)]",
                    )}>
                      {inv.variance === 0 ? "£0" : `+£${inv.variance.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={STAGE_TONE[stage]} dot>{STAGE_LABEL[stage]}</StatusBadge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}