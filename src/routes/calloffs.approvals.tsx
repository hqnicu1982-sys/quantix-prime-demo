import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { callOffs, fmtMoney } from "@/lib/mockData";
import { STATE_LABEL, STATE_TONE } from "@/lib/callOffWorkflow";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { useCan } from "@/lib/permissions";
import { Gated } from "@/components/auth/Gated";
import { ShieldCheck, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calloffs/approvals")({ component: Approvals });

function Approvals() {
  const canApprove = useCan("approve.calloffs");
  // Items sitting at the QS step (submitted, reviewed, review-needed).
  const queue = callOffs.filter((c) =>
    c.state === "submitted" || c.state === "reviewed" || c.state === "review-needed" || c.state === "draft",
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Approval workflow" subtitle="QS reviews, signs off, and the system fires the PO" />
        <div className="p-5">
          <WorkflowStrip currentState="reviewed" compact />
        </div>
      </Card>

      {!canApprove && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 p-3 text-[12.5px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--amber-500)]" />
          <p>You can view the queue but only <strong>Pro Control</strong> or <strong>Admin</strong> can approve / reject.</p>
        </div>
      )}

      <Card>
        <CardHead title={`Awaiting QS review · ${queue.length}`} subtitle="Highest-value items shown first" />
        <div className="divide-y divide-[var(--ink-200)]">
          {queue.map((c) => (
            <div key={c.ref} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[12.5px]">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  <Link to="/calloffs/$ref" params={{ ref: c.ref }} className="hover:underline">{c.ref}</Link>
                  <span className="ml-2 text-[var(--ink-700)]">{c.item}</span>
                </p>
                <p className="text-[11px] text-[var(--ink-500)]">{c.subtitle} · {c.supplier} · need by {c.needBy}</p>
              </div>
              <span className="font-mono-num font-semibold">{fmtMoney(c.value)}</span>
              <StatusBadge tone={STATE_TONE[c.state]} dot>{STATE_LABEL[c.state]}</StatusBadge>
              <Gated cap="approve.calloffs">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast.error("Rejected", { description: `${c.ref} returned to Site Manager` })}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => toast.success("Approved", { description: `${c.ref} approved · PO queued` })}>
                    <ShieldCheck className="mr-1 h-3 w-3" /> Approve
                  </Button>
                </div>
              </Gated>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}