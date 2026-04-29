import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { invoices, invoiceKpi, reconFlow, fmtMoney, type Invoice } from "@/lib/mockData";
import { Upload, Plus, ArrowRight, CheckCircle2, AlertTriangle, XCircle, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { exportProjectPack } from "@/lib/exportProjectPack";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { Gated } from "@/components/auth/Gated";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoice Reconciliation — Quantix Prime" }] }),
  component: GuardedInvoices,
});

function GuardedInvoices() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <Invoices />;
}

function Invoices() {
  const { current } = useProject();
  const projectData = useProjectData(current.id);
  const canSign = useCan("sign.invoices");
  const handleExportPack = () => {
    try {
      exportProjectPack(current, projectData);
      toast.success("Project pack exported", { description: `${current.name} · PDF downloaded` });
    } catch (e) {
      toast.error("Export failed", { description: String((e as Error).message ?? e) });
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display inline-flex items-center gap-2 text-[28px] font-semibold leading-tight text-[var(--ink-900)] md:text-[32px]">
            Invoice Reconciliation
            <span className="rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-500)]">BETA</span>
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">
            Match supplier invoices against POs and BoQ. Catch uplifts, double-charges, and over-delivery before you pay.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPack}><FileDown className="mr-1.5 h-3.5 w-3.5" />Export project pack</Button>
          <Gated cap="sign.invoices">
            <Button variant="outline" size="sm" onClick={() => toast("Upload invoice", { description: "Drop a PDF/XLSX — we'll match it to a PO automatically" })}><Upload className="mr-1.5 h-3.5 w-3.5" />Upload invoice</Button>
          </Gated>
          <Gated cap="sign.invoices">
            <Button size="sm" onClick={() => toast.success("New reconciliation started", { description: "Select supplier and invoice to begin matching" })}><Plus className="mr-1.5 h-3.5 w-3.5" />New reconciliation</Button>
          </Gated>
        </div>
      </div>

      <ProjectBanner scope="Invoice Reconciliation" />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Invoices this month" value={`${invoiceKpi.total}`} />
        <Kpi label="Auto-matched" value={`${invoiceKpi.autoMatched}`} delta={`${Math.round((invoiceKpi.autoMatched / invoiceKpi.total) * 100)}% rate`} tone="success" />
        <Kpi label="Flagged" value={`${invoiceKpi.flagged}`} delta={`£${invoiceKpi.flaggedVariance.toLocaleString()} variance`} tone="warning" />
        <Kpi label="Disputed" value={`${invoiceKpi.disputed}`} delta="£1,807 total" tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {invoices.map((inv) => <InvoiceCard key={inv.id} inv={inv} canSign={canSign} />)}
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
    </div>
  );
}

function InvoiceCard({ inv, canSign }: { inv: Invoice; canSign: boolean }) {
  const headerStyle = inv.state === "matched"
    ? { bg: "bg-[var(--green-600)]/10", text: "text-[var(--green-600)]", border: "border-[var(--green-600)]/30", Icon: CheckCircle2, label: "Matched" }
    : inv.state === "needs-review"
    ? { bg: "bg-[var(--amber-500)]/10", text: "text-[var(--amber-500)]", border: "border-[var(--amber-500)]/30", Icon: AlertTriangle, label: "Needs review" }
    : { bg: "bg-[var(--red-500)]/10", text: "text-[var(--red-500)]", border: "border-[var(--red-500)]/30", Icon: XCircle, label: "Disputed" };
  const Icon = headerStyle.Icon;

  return (
    <Card className={cn("overflow-hidden border-2", headerStyle.border)}>
      <div className={cn("flex items-center gap-2 px-4 py-2.5", headerStyle.bg)}>
        <Icon className={cn("h-3.5 w-3.5", headerStyle.text)} />
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", headerStyle.text)}>{headerStyle.label}</p>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-mono text-[13px] font-semibold">{inv.supplier} #{inv.id}</p>
          <p className="text-[11px] text-[var(--ink-500)]">Received {inv.received}{inv.matchedAt && ` · ${inv.matchedAt}`}</p>
        </div>
        <div className="flex gap-3 text-[11px] text-[var(--ink-500)]">
          <span>PO: <strong className="text-[var(--ink-900)]">{inv.poRef}</strong></span>
          <span>Call-off: <strong className="text-[var(--ink-900)]">{inv.callOffRef}</strong></span>
        </div>
        <div className="space-y-1 rounded-md bg-[var(--ink-50)] p-2.5 text-[12px]">
          <div className="flex justify-between"><span className="text-[var(--ink-500)]">Invoiced</span><span className="font-mono font-semibold tabular-nums">£{inv.invoiced.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--ink-500)]">Expected</span><span className="font-mono tabular-nums">£{inv.expected.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-[var(--ink-200)] pt-1">
            <span className="text-[var(--ink-500)]">Variance</span>
            <span className={cn("font-mono font-semibold tabular-nums",
              inv.variance === 0 ? "text-[var(--green-600)]" : inv.state === "disputed" ? "text-[var(--red-500)]" : "text-[var(--amber-500)]")}>
              {inv.variance === 0 ? "£0.00 ✓" : `+£${inv.variance.toLocaleString()} (+${inv.variancePct}%)`}
            </span>
          </div>
        </div>
        <p className="text-[11.5px] text-[var(--ink-700)]">{inv.lineDetail}</p>
        {inv.alert && (
          <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-2.5 text-[11.5px] text-[var(--ink-700)]">
            {inv.alert}
          </div>
        )}
        {inv.state === "matched" && <StatusBadge tone="success">Ready to pay</StatusBadge>}
        {inv.state === "needs-review" && canSign && (
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.success(`Invoice ${inv.id} accepted`, { description: `£${inv.invoiced.toLocaleString()} approved for payment` })}>Accept</Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.error(`Invoice ${inv.id} disputed`, { description: `Notifying ${inv.supplier} of variance` })}>Dispute</Button>
            <Button size="sm" className="h-7 text-[11px]" onClick={() => toast.success("Credit request sent", { description: `Asking ${inv.supplier} for £${inv.variance.toLocaleString()} credit note` })}>Request credit</Button>
          </div>
        )}
        {inv.state === "needs-review" && !canSign && (
          <p className="text-[11px] italic text-[var(--ink-500)]">Awaiting QS / Admin to action this invoice.</p>
        )}
      </div>
    </Card>
  );
}
