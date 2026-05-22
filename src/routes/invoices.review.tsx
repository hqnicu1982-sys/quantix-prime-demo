import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { invoices } from "@/lib/mockData";
import { deriveStage, VARIANCE_TOLERANCE } from "@/lib/invoiceWorkflow";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { ShieldCheck, X, Mail } from "lucide-react";

export const Route = createFileRoute("/invoices/review")({ component: Guarded });

function Guarded() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <Review />;
}

function Review() {
  const canSign = useCan("sign.invoices");
  const queue = invoices.filter((i) => deriveStage(i) === "review");
  const totalVariance = queue.reduce((s, i) => s + i.variance, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="In review queue" value={String(queue.length)} delta="awaiting QS decision" tone="warning" />
        <Kpi label="Total variance" value={`£${totalVariance.toLocaleString()}`} delta={`tolerance ±${VARIANCE_TOLERANCE.ratePct}% / £${VARIANCE_TOLERANCE.absoluteGbp}`} tone="warning" />
        <Kpi label="Oldest" value="0d" delta="all logged today" />
      </div>

      <Card>
        <CardHead title="QS review queue" subtitle="Variance > tolerance — accept, dispute, or request a credit note" />
        {queue.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--ink-500)]">No invoices awaiting QS review. 🎉</div>
        ) : (
          <ul className="divide-y divide-[var(--ink-200)]">
            {queue.map((inv) => (
              <li key={inv.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to="/invoices/$ref" params={{ ref: inv.id }} className="font-mono-num text-[13px] font-semibold hover:underline">{inv.id}</Link>
                      <StatusBadge tone="warning" dot>{inv.supplier}</StatusBadge>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--ink-500)]">{inv.poRef} · {inv.callOffRef} · received {inv.received}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num text-[14px] font-semibold">£{inv.invoiced.toLocaleString()}</p>
                    <p className="font-mono-num text-[12px] text-[var(--amber-500)]">+£{inv.variance.toLocaleString()} (+{inv.variancePct}%)</p>
                  </div>
                </div>
                <p className="rounded-md bg-[var(--ink-50)] px-3 py-2 text-[12px] text-[var(--ink-700)]">{inv.lineDetail}</p>
                {inv.alert && <p className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 px-3 py-2 text-[12px] text-[var(--ink-700)]">{inv.alert}</p>}
                {canSign ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => toast.success(`${inv.id} accepted`, { description: `£${inv.invoiced.toLocaleString()} cleared for payment run` })}>
                      <ShieldCheck className="mr-1 h-3 w-3" /> Accept variance
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.error(`${inv.id} disputed`, { description: `${inv.supplier} notified` })}>
                      <X className="mr-1 h-3 w-3" /> Dispute
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Credit note requested`, { description: `Asking ${inv.supplier} for £${inv.variance.toLocaleString()} credit` })}>
                      <Mail className="mr-1 h-3 w-3" /> Request credit note
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] italic text-[var(--ink-500)]">QS / Admin must action this invoice.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}