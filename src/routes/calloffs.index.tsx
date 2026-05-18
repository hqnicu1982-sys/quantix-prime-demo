import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { callOffs, fmtMoney } from "@/lib/mockData";
import { STATE_LABEL, STATE_TONE } from "@/lib/callOffWorkflow";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";

export const Route = createFileRoute("/calloffs/")({ component: Inbox });

function Inbox() {
  const { current } = useProject();
  const data = useProjectData(current.id);
  const supplierPicks = Object.entries(data.supplierChoices);
  const open = callOffs.filter((c) => c.state !== "closed").length;
  const reviewNeeded = callOffs.filter((c) => c.state === "review-needed").length;
  const mtdValue = callOffs.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Open call-offs" value={String(open)} delta={`${reviewNeeded} need QS review`} tone={reviewNeeded ? "warning" : "neutral"} />
        <Kpi label="MTD committed" value={fmtMoney(mtdValue)} delta="vs £42k forecast" tone="success" />
        <Kpi label="In delivery" value={String(callOffs.filter((c) => c.state === "in-delivery").length)} delta="3 deliveries this week" />
        <Kpi label="Suppliers" value={String(new Set(callOffs.map((c) => c.supplier)).size)} delta="CCF · Minster" />
      </div>

      {supplierPicks.length > 0 && (
        <Card>
          <CardHead title={`Agreed suppliers · ${current.name}`} subtitle="Defaults applied when raising new call-offs" />
          <div className="divide-y divide-[var(--ink-200)] text-[12.5px]">
            {supplierPicks.map(([material, supplier]) => (
              <div key={material} className="flex items-center justify-between px-5 py-2.5">
                <span className="font-medium">{material}</span>
                <span className="rounded bg-[var(--accent-500)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-500)]">{supplier}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHead title="All call-offs" subtitle="Click a row to open the workflow detail" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                <th className="px-4 py-2.5 text-left font-semibold">Item</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                <th className="px-4 py-2.5 text-left font-semibold">State</th>
                <th className="px-4 py-2.5 text-left font-semibold">Need by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {callOffs.map((c) => (
                <tr key={c.ref} className="cursor-pointer hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num font-semibold">
                    <Link to="/calloffs/$ref" params={{ ref: c.ref }} className="hover:underline">{c.ref}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.item}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{c.subtitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={c.supplier === "CCF" ? "success" : "info"} dot>{c.supplier}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.qty}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(c.value)}</td>
                  <td className="px-4 py-3"><StatusBadge tone={STATE_TONE[c.state]} dot>{STATE_LABEL[c.state]}</StatusBadge></td>
                  <td className={`px-4 py-3 text-[12px] ${c.needByOverdue ? "font-semibold text-[var(--red-500)]" : "text-[var(--ink-700)]"}`}>{c.needBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}