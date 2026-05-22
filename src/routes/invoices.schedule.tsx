import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { scheduledPayments } from "@/lib/invoiceWorkflow";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { Banknote, CalendarPlus } from "lucide-react";

export const Route = createFileRoute("/invoices/schedule")({ component: Guarded });

function Guarded() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <Schedule />;
}

function Schedule() {
  const canSign = useCan("sign.invoices");
  const ready = scheduledPayments.filter((p) => p.status === "ready");
  const scheduled = scheduledPayments.filter((p) => p.status === "scheduled");
  const paid = scheduledPayments.filter((p) => p.status === "paid");
  const sumReady = ready.reduce((s, p) => s + p.amount, 0);
  const sumScheduled = scheduled.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Ready to schedule" value={`£${sumReady.toLocaleString()}`} delta={`${ready.length} invoices`} tone="warning" />
        <Kpi label="Scheduled" value={`£${sumScheduled.toLocaleString()}`} delta={`${scheduled.length} in next batch`} tone="info" />
        <Kpi label="Paid MTD" value={`£${paid.reduce((s, p) => s + p.amount, 0).toLocaleString()}`} tone="success" />
      </div>

      <Card>
        <CardHead
          title="Payment runs"
          subtitle="Approved invoices grouped into batches · move to next batch or pay now"
          right={canSign && (
            <Button size="sm" onClick={() => toast.success("New batch created", { description: "PAY-2026-09 · drop ready invoices into it" })}>
              <CalendarPlus className="mr-1 h-3 w-3" /> New batch
            </Button>
          )}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Invoice</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-4 py-2.5 text-left font-semibold">Pay date</th>
                <th className="px-4 py-2.5 text-left font-semibold">Batch</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {scheduledPayments.map((p) => (
                <tr key={p.ref} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num font-semibold">
                    <Link to="/invoices/$ref" params={{ ref: p.ref }} className="hover:underline">{p.ref}</Link>
                  </td>
                  <td className="px-4 py-3">{p.supplier}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">£{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">{p.due}</td>
                  <td className="px-4 py-3 font-mono-num text-[11.5px] text-[var(--ink-500)]">{p.batch}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={p.status === "paid" ? "success" : p.status === "scheduled" ? "info" : "warning"} dot>
                      {p.status === "ready" ? "Ready" : p.status === "scheduled" ? "Scheduled" : "Paid"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canSign && p.status === "ready" && (
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.success(`${p.ref} added to PAY-2026-09`)}>
                        Add to batch
                      </Button>
                    )}
                    {canSign && p.status === "scheduled" && (
                      <Button size="sm" className="h-7 text-[11px]" onClick={() => toast.success(`${p.ref} marked paid`, { description: `£${p.amount.toLocaleString()} faster payment` })}>
                        <Banknote className="mr-1 h-3 w-3" /> Mark paid
                      </Button>
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