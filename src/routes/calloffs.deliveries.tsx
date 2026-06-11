import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { Gated } from "@/components/auth/Gated";
import { Truck, PackageCheck } from "lucide-react";
import { useState } from "react";
import { LogGrnDialog } from "@/components/calloffs/CallOffActionDialogs";
import { useGrns } from "@/lib/grnRegistry";

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
  const grns = useGrns();
  const [grnFor, setGrnFor] = useState<{ ref: string; qty: string; supplier: string } | null>(null);
  const inboundThisWeek = grns.filter((g) => g.status === "scheduled" || g.status === "in-transit").length;
  const partialOpen = grns.filter((g) => g.status === "partial").length;
  const receivedMtd = grns.filter((g) => g.status === "received").length;
  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Where deliveries sit" subtitle="GRN locks the delivered qty and unblocks invoice reconciliation" />
        <div className="p-5">
          <WorkflowStrip currentState="in-delivery" compact />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Inbound this week" value={String(inboundThisWeek)} tone="info" />
        <Kpi label="Partial GRN open" value={String(partialOpen)} tone={partialOpen ? "warning" : "neutral"} />
        <Kpi label="Received MTD" value={String(receivedMtd)} tone="success" />
        <Kpi label="Disputes" value="0" tone="neutral" />
      </div>

      <Card>
        <CardHead title="Deliveries" subtitle="Live from the GRN registry — every logged delivery, persistent across pages." />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">GRN</th>
                <th className="px-4 py-2.5 text-left font-semibold">Call-off</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-left font-semibold">ETA / GRN</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {grns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No deliveries logged yet.</td></tr>
              )}
              {grns.map((g) => {
                const signedDisplay = g.signedAt
                  ? (g.signedAt.includes("T") ? new Date(g.signedAt).toLocaleString() : g.signedAt)
                  : (g.eta ?? "—");
                return (
                <tr key={g.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num text-[12px]">
                    <Link to="/grn/$ref" params={{ ref: g.id }} className="hover:underline">{g.id}</Link>
                  </td>
                  <td className="px-4 py-3 font-mono-num text-[12px]">
                    <Link to="/calloffs/$ref" params={{ ref: g.callOffRef }} className="hover:underline">{g.callOffRef}</Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">{g.supplier}</td>
                  <td className="px-4 py-3 text-[12px]">{g.qty}</td>
                  <td className="px-4 py-3 text-[12px]">
                    <Truck className="mr-1 inline h-3 w-3 text-[var(--ink-500)]" />
                    {g.signedBy ? `${g.signedBy} · ${signedDisplay}` : signedDisplay}
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={TONE[g.status]} dot>{LABEL[g.status]}</StatusBadge></td>
                  <td className="px-4 py-3 text-right">
                    {g.status !== "received" && (
                      <Gated cap="create.calloffs">
                        <Button size="sm" variant="outline" onClick={() => setGrnFor({ ref: g.callOffRef, qty: g.qty, supplier: g.supplier })}>
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
        <LogGrnDialog ref={grnFor.ref} defaultQty={grnFor.qty} supplier={grnFor.supplier} open={!!grnFor} onOpenChange={(v) => !v && setGrnFor(null)} />
      )}
    </div>
  );
}