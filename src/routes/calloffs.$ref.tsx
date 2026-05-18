import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { callOffs, fmtMoney } from "@/lib/mockData";
import { STATE_LABEL, STATE_TONE, auditLog } from "@/lib/callOffWorkflow";
import { Gated } from "@/components/auth/Gated";
import { ArrowLeft, ShieldCheck, Send, PackageCheck, X, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calloffs/$ref")({
  component: Detail,
  notFoundComponent: () => (
    <Card><div className="p-6 text-center text-[13px]">
      <p className="font-semibold">Call-off not found</p>
      <p className="mt-1 text-[var(--ink-500)]">Check the inbox.</p>
      <Button asChild className="mt-3" size="sm"><Link to="/calloffs">Back to inbox</Link></Button>
    </div></Card>
  ),
});

function Detail() {
  const { ref } = Route.useParams();
  const co = callOffs.find((c) => c.ref === ref);
  if (!co) throw notFound();
  const events = auditLog.filter((e) => e.ref === ref);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/calloffs"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to inbox</Link>
        </Button>
        <StatusBadge tone={STATE_TONE[co.state]} dot>{STATE_LABEL[co.state]}</StatusBadge>
      </div>

      <Card>
        <CardHead
          title={`${co.ref} · ${co.item}`}
          subtitle={`${co.subtitle} · ${co.supplier} · need by ${co.needBy}`}
        />
        <div className="p-5">
          <WorkflowStrip currentState={co.state} needsReview={co.state === "review-needed"} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Value" value={fmtMoney(co.value)} delta="committed against BoQ rev 3.2" />
        <Kpi label="Quantity" value={co.qty} />
        <Kpi label="Supplier" value={co.supplier} delta="framework" tone="info" />
        <Kpi label="Need by" value={co.needBy} tone={co.needByOverdue ? "danger" : "neutral"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead
            title="Available actions"
            subtitle="Buttons reflect the current workflow stage + your role"
            right={<span className="text-[10.5px] text-[var(--ink-500)]">All actions are audit-logged</span>}
          />
          <div className="flex flex-wrap gap-2 p-5">
            {(co.state === "draft" || co.state === "submitted") && (
              <Gated cap="create.calloffs">
                <Button size="sm" onClick={() => toast.success("Submitted", { description: `${co.ref} sent for QS review` })}>
                  <Send className="mr-1 h-3 w-3" /> Submit for QS
                </Button>
              </Gated>
            )}
            {(co.state === "submitted" || co.state === "reviewed" || co.state === "review-needed") && (
              <Gated cap="approve.calloffs">
                <>
                  <Button size="sm" onClick={() => toast.success("Approved", { description: `${co.ref} approved · PO queued` })}>
                    <ShieldCheck className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.error("Rejected", { description: `${co.ref} returned to Site` })}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </>
              </Gated>
            )}
            {co.state === "approved" && (
              <Gated cap="approve.calloffs">
                <Button size="sm" onClick={() => toast.success("PO sent", { description: `PO fired to ${co.supplier}` })}>
                  <Send className="mr-1 h-3 w-3" /> Send PO
                </Button>
              </Gated>
            )}
            {(co.state === "po-sent" || co.state === "in-delivery") && (
              <Gated cap="create.calloffs">
                <Button size="sm" onClick={() => toast.success("GRN logged", { description: "Delivery accepted on site" })}>
                  <PackageCheck className="mr-1 h-3 w-3" /> Log GRN
                </Button>
              </Gated>
            )}
            <Button size="sm" variant="ghost"><FileText className="mr-1 h-3 w-3" /> Open BoQ line</Button>
          </div>
        </Card>

        <Card>
          <CardHead title="Timeline" subtitle="Audit events for this call-off" />
          <ol className="divide-y divide-[var(--ink-200)] text-[12px]">
            {events.length === 0 && (
              <li className="px-5 py-4 text-[var(--ink-500)]">No events yet — actions taken here will appear in the audit log.</li>
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