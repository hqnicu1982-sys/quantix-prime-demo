import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { Gated } from "@/components/auth/Gated";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useProjectData } from "@/lib/projectData";

export const Route = createFileRoute("/projects/$projectId/calloffs")({ component: GuardedCallOffsPage });

function GuardedCallOffsPage() {
  const allowed = useCan("view.calloffs");
  if (!allowed) return <NoAccess cap="view.calloffs" title="Call-offs restricted" />;
  return <CallOffsPage />;
}

const statusTone = {
  draft: "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  sent: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
  delivered: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
} as const;

function CallOffsPage() {
  const { projectId } = Route.useParams();
  const data = useProjectData(projectId);
  const lineById = new Map(data.boqLines.map((l) => [l.id, l]));
  const callOffs = data.callOffs;
  const open = callOffs.filter((c) => c.status !== "delivered").length;
  const drafts = callOffs.filter((c) => c.status === "draft").length;
  const sent = callOffs.filter((c) => c.status === "sent").length;
  const suppliers = new Set(callOffs.map((c) => c.supplier)).size;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Open call-offs" value={String(open)} delta={`${drafts} draft · ${sent} sent`} tone={drafts > 0 ? "warning" : "neutral"} />
        <Kpi label="Delivered" value={String(callOffs.filter((c) => c.status === "delivered").length)} />
        <Kpi label="Suppliers active" value={String(suppliers)} />
        <Kpi label="Total raised" value={String(callOffs.length)} delta="lifetime" />
      </div>

      <Card>
        <CardHead
          title="Project call-offs"
          subtitle="Drafts raised by the Planner auto-propose flow plus anything sent to suppliers"
          right={
            <div className="flex gap-2">
              <Gated cap="create.calloffs">
                <Button size="sm" asChild><Link to="/calloffs/new"><Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off</Link></Button>
              </Gated>
              <Button size="sm" variant="outline" asChild><Link to="/calloffs">Full inbox <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
            </div>
          }
        />
        {callOffs.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12.5px] text-[var(--ink-500)]">
            No call-offs yet. Open the <Link to="/projects/$projectId/planner" params={{ projectId }} className="text-[var(--accent-500)] underline">Planner</Link> to generate drafts from upcoming tasks, or raise one manually.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Materials</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Lines</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Created</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-200)]">
                {callOffs.map((c) => {
                  const mats = c.lineIds
                    .map((id) => lineById.get(id))
                    .filter(Boolean)
                    .map((l) => `${l!.material} × ${l!.qty} ${l!.unit}`)
                    .join(", ");
                  return (
                    <tr key={c.id} className="hover:bg-[var(--ink-50)]">
                      <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-700)]">
                        <Link to="/calloffs/$ref" params={{ ref: c.id }} className="hover:underline">{c.id}</Link>
                      </td>
                      <td className="px-4 py-3 font-semibold">{c.supplier}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{mats || `${c.lineIds.length} line(s)`}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{c.lineIds.length}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold capitalize ${statusTone[c.status]}`}>{c.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
