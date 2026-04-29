import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Truck } from "lucide-react";
import { Gated } from "@/components/auth/Gated";

export const Route = createFileRoute("/projects/$projectId/calloffs")({ component: CallOffsPage });

const callOffs = [
  { id: "CO-247", supplier: "Minster", items: "Gyproc WallBoard 15mm × 220, Rockwool RW3 × 48", value: 4820, eta: "24 Apr", status: "approved" as const },
  { id: "CO-246", supplier: "CCF", items: "Gypframe C48/70 × 320 lengths", value: 3776, eta: "23 Apr", status: "delivered" as const },
  { id: "CO-245", supplier: "Minster", items: "Joint kit × 12, Screws × 6 packs", value: 213, eta: "22 Apr", status: "delivered" as const },
  { id: "CO-248", supplier: "Knauf Direct", items: "ShaftWall S-CW system × 410 m²", value: 32226, eta: "06 May", status: "draft" as const },
  { id: "CO-249", supplier: "CCF", items: "FireLine 15mm × 340 m²", value: 2577, eta: "29 Apr", status: "pending" as const },
];

const status = {
  approved: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  delivered: "bg-[var(--ink-50)] text-[var(--ink-500)]",
  draft: "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  pending: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

function CallOffsPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Open call-offs" value="3" delta="2 awaiting approval" tone="warning" />
        <Kpi label="MTD ordered" value="£42.8k" delta="vs £40k forecast" tone="success" />
        <Kpi label="Inbound this week" value="5" delta="3 deliveries Mon–Wed" />
        <Kpi label="Suppliers active" value="3" delta="CCF · Minster · Knauf" />
      </div>

      <Card>
        <CardHead
          title="Call-offs"
          subtitle="Material orders against project BoQ"
          right={
            <div className="flex gap-2">
              <Gated cap="create.calloffs">
                <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off</Button>
              </Gated>
              <Button size="sm" variant="outline" asChild><Link to="/calloffs">Full inbox <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">Items</th>
                <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                <th className="px-4 py-2.5 text-left font-semibold">ETA</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {callOffs.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-700)]">{c.id}</td>
                  <td className="px-4 py-3 font-semibold">{c.supplier}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{c.items}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">£{c.value.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px]"><Truck className="mr-1 inline h-3 w-3 text-[var(--ink-500)]" />{c.eta}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold capitalize ${status[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
