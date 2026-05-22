import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceWorkflowStrip } from "@/components/invoices/InvoiceWorkflowStrip";
import { invoices } from "@/lib/mockData";
import { deriveStage, STAGE_LABEL, STAGE_TONE, invoiceAuditLog, matchLines, explainVariance } from "@/lib/invoiceWorkflow";
import { Gated } from "@/components/auth/Gated";
import { ArrowLeft, ShieldCheck, X, Mail, Banknote, FileText, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices/$ref")({
  component: Detail,
  notFoundComponent: () => (
    <Card><div className="p-6 text-center text-[13px]">
      <p className="font-semibold">Invoice not found</p>
      <p className="mt-1 text-[var(--ink-500)]">Check the inbox.</p>
      <Button asChild className="mt-3" size="sm"><Link to="/invoices">Back to inbox</Link></Button>
    </div></Card>
  ),
});

function Detail() {
  const { ref } = Route.useParams();
  const inv = invoices.find((i) => i.id === ref);
  if (!inv) throw notFound();
  const stage = deriveStage(inv);
  const events = invoiceAuditLog.filter((e) => e.ref === ref);
  const lines = matchLines[ref] ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/invoices"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to inbox</Link>
        </Button>
        <StatusBadge tone={STAGE_TONE[stage]} dot>{STAGE_LABEL[stage]}</StatusBadge>
      </div>

      <Card>
        <CardHead
          title={`${inv.id} · ${inv.supplier}`}
          subtitle={`${inv.poRef} · ${inv.callOffRef} · received ${inv.received}`}
        />
        <div className="p-5">
          <InvoiceWorkflowStrip stage={stage} flagged={inv.state !== "matched"} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Invoiced" value={`£${inv.invoiced.toLocaleString()}`} />
        <Kpi label="Expected (PO)" value={`£${inv.expected.toLocaleString()}`} />
        <Kpi
          label="Variance"
          value={inv.variance === 0 ? "£0" : `+£${inv.variance.toLocaleString()}`}
          delta={inv.variance === 0 ? "exact match" : `+${inv.variancePct}%`}
          tone={inv.variance === 0 ? "success" : inv.state === "disputed" ? "danger" : "warning"}
        />
        <Kpi label="Supplier" value={inv.supplier} tone="info" />
      </div>

      <Card>
        <CardHead title="3-way match" subtitle="Invoice ↔ PO ↔ GRN · per-line reconciliation" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                <th className="px-4 py-2.5 text-right font-semibold">PO qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">GRN qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Inv qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">PO rate</th>
                <th className="px-4 py-2.5 text-right font-semibold">Inv rate</th>
                <th className="px-4 py-2.5 text-right font-semibold">Δ Value</th>
                <th className="px-4 py-2.5 text-left font-semibold">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {lines.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No line breakdown captured for this invoice yet.</td></tr>
              )}
              {lines.map((l, i) => {
                const delta = l.invValue - l.poValue;
                return (
                  <tr key={i} className={cn(l.status !== "match" && "bg-[var(--amber-500)]/5")}>
                    <td className="px-4 py-3 font-medium">{l.material}</td>
                    <td className="px-4 py-3 text-right font-mono-num">{l.poQty.toLocaleString()} {l.unit}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num", l.grnQty !== l.poQty && "text-[var(--amber-500)] font-semibold")}>{l.grnQty.toLocaleString()}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num", l.invQty !== l.grnQty && "text-[var(--red-500)] font-semibold")}>{l.invQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono-num">£{l.poRate.toFixed(2)}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num", l.invRate !== l.poRate && "text-[var(--red-500)] font-semibold")}>£{l.invRate.toFixed(2)}</td>
                    <td className={cn("px-4 py-3 text-right font-mono-num font-semibold", delta > 0 ? "text-[var(--red-500)]" : delta < 0 ? "text-[var(--green-600)]" : "text-[var(--ink-500)]")}>
                      {delta === 0 ? "£0" : `${delta > 0 ? "+" : ""}£${delta.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-[var(--ink-700)]">{explainVariance(l)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead
            title="Available actions"
            subtitle="Buttons reflect the current workflow stage + your role"
            right={<span className="text-[10.5px] text-[var(--ink-500)]">All actions are audit-logged</span>}
          />
          <div className="flex flex-wrap gap-2 p-5">
            {stage === "review" && (
              <Gated cap="sign.invoices">
                <Button size="sm" onClick={() => toast.success(`${inv.id} accepted`, { description: `£${inv.invoiced.toLocaleString()} cleared for payment` })}>
                  <ShieldCheck className="mr-1 h-3 w-3" /> Accept variance
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.error(`${inv.id} disputed`, { description: `${inv.supplier} notified` })}>
                  <X className="mr-1 h-3 w-3" /> Dispute
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Credit note requested")}>
                  <Mail className="mr-1 h-3 w-3" /> Request credit
                </Button>
              </Gated>
            )}
            {stage === "approved" && (
              <Gated cap="sign.invoices">
                <Button size="sm" onClick={() => toast.success("Added to PAY-2026-09")}>
                  <CalendarPlus className="mr-1 h-3 w-3" /> Schedule payment
                </Button>
              </Gated>
            )}
            {stage === "scheduled" && (
              <Gated cap="sign.invoices">
                <Button size="sm" onClick={() => toast.success(`${inv.id} marked paid`)}>
                  <Banknote className="mr-1 h-3 w-3" /> Mark paid
                </Button>
              </Gated>
            )}
            <Button size="sm" variant="ghost"><FileText className="mr-1 h-3 w-3" /> Open PO</Button>
            <Button size="sm" variant="ghost"><FileText className="mr-1 h-3 w-3" /> Open GRN</Button>
          </div>
        </Card>

        <Card>
          <CardHead title="Timeline" subtitle="Audit events for this invoice" />
          <ol className="divide-y divide-[var(--ink-200)] text-[12px]">
            {events.length === 0 && (
              <li className="px-5 py-4 text-[var(--ink-500)]">No events yet.</li>
            )}
            {events.map((e, i) => (
              <li key={i} className="px-5 py-2.5">
                <p className="font-semibold">{e.action} <span className="font-normal text-[var(--ink-500)]">· {e.actor}</span></p>
                <p className="text-[var(--ink-700)]">{e.detail}</p>
                <p className="mt-0.5 text-[10.5px] text-[var(--ink-500)]">{e.ts}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}