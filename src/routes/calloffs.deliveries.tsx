import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { deliveries } from "@/lib/callOffWorkflow";
import { Gated } from "@/components/auth/Gated";
import { Truck, PackageCheck } from "lucide-react";
import { useState } from "react";
import { LogGrnDialog } from "@/components/calloffs/CallOffActionDialogs";
import { useCallOffActions, latestCallOffAction } from "@/lib/callOffActions";

export const Route = createFileRoute("/calloffs/deliveries")({ component: Deliveries });

const TONE = {
  scheduled:    "neutral" as const,
  "in-transit": "info" as const,
  partial:      "warning" as const,
  received:     "success" as const,
};
const LABEL = {
  scheduled:    "Scheduled",
  "in-transit": "In transit",
  partial:      "Partial GRN",
  received:     "Received",
};

function Deliveries() {
  const all = useCallOffActions();
  const [grnFor, setGrnFor] = useState<{ ref: string; qty: string } | null>(null);
  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Where deliveries sit" subtitle="GRN locks the delivered qty and unblocks invoice reconciliation" />
        <div className="p-5">
          <WorkflowStrip currentState="in-delivery" compact />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Inbound this week" value="3" tone="info" />
        <Kpi label="Partial GRN open" value="1" tone="warning" delta="CO-245 · 380 m short" />
        <Kpi label="Received MTD" value="14" tone="success" />
        <Kpi label="Disputes" value="0" tone="neutral" />
      </div>

      <Card>
        <CardHead title="Deliveries" subtitle="Logged from Daily Site Report or via GRN scan" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Delivery</th>
                <th className="px-4 py-2.5 text-left font-semibold">Call-off</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-left font-semibold">ETA / GRN</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {deliveries.map((d) => {
                const logged = latestCallOffAction(d.callOff, all.filter((a) => a.kind === "log-grn"));
                const status = logged ? (logged.grnPartial ? "partial" : "received") : d.status;
                return (
                <tr key={d.ref} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num text-[12px]">{d.ref}</td>
                  <td className="px-4 py-3 font-mono-num text-[12px]">
                    <Link to="/calloffs/$ref" params={{ ref: d.callOff }} className="hover:underline">{d.callOff}</Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">{d.supplier}</td>
                  <td className="px-4 py-3 text-[12px]">{logged?.grnQty ?? d.qty}</td>
                  <td className="px-4 py-3 text-[12px]">
                    <Truck className="mr-1 inline h-3 w-3 text-[var(--ink-500)]" />
                    {logged ? `GRN ${new Date(logged.ts).toLocaleString()}` : (d.grnBy ?? d.eta)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={TONE[status]} dot>{LABEL[status]}</StatusBadge></td>
                  <td className="px-4 py-3 text-right">
                    {status !== "received" && (
                      <Gated cap="create.calloffs">
                        <Button size="sm" variant="outline" onClick={() => setGrnFor({ ref: d.callOff, qty: d.qty })}>
                          <PackageCheck className="mr-1 h-3 w-3" /> Log GRN
                        </Button>
                      </Gated>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {grnFor && (
        <LogGrnDialog ref={grnFor.ref} defaultQty={grnFor.qty} open={!!grnFor} onOpenChange={(v) => !v && setGrnFor(null)} />
      )}
    </div>
  );
}