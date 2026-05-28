import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { disputes, type DisputeRecord } from "@/lib/invoiceWorkflow";
import { invoices } from "@/lib/mockData";
import { useInvoiceActions } from "@/lib/invoiceActions";
import { ChaseDialog, ResolveDisputeDialog } from "@/components/invoices/DisputeFollowUpDialogs";
import { useState } from "react";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/invoices/disputes")({ component: Guarded });

function Guarded() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <Disputes />;
}

function Disputes() {
  const canSign = useCan("sign.invoices");
  const actions = useInvoiceActions();
  const [dlg, setDlg] = useState<null | { kind: "chase" | "resolve"; row: DisputeRecord }>(null);
  const resolvedRefs = new Set(actions.filter((a) => a.kind === "resolve-dispute").map((a) => a.ref));
  // Convert recorded dispute / credit actions into dispute rows.
  const userRows: DisputeRecord[] = actions
    .filter((a) => a.kind === "dispute" || a.kind === "request-credit")
    .map((a) => {
      const inv = invoices.find((i) => i.id === a.ref);
      return {
        ref: a.ref,
        supplier: inv?.supplier ?? "—",
        raised: new Date(a.ts).toLocaleDateString(),
        amount: a.creditAmount ?? a.amount ?? inv?.variance ?? 0,
        reason: a.reason ?? a.note ?? "—",
        status: resolvedRefs.has(a.ref) ? "resolved" : a.kind === "request-credit" ? "credit-pending" : "open",
        owner: a.actor,
      } satisfies DisputeRecord;
    });
  // Suppress mocked rows that the user has already actioned (avoid dupes).
  const userRefs = new Set(userRows.map((r) => r.ref));
  const merged: DisputeRecord[] = [...userRows, ...disputes.filter((d) => !userRefs.has(d.ref))]
    .map((d) => (resolvedRefs.has(d.ref) ? { ...d, status: "resolved" as const } : d));
  const rows = merged;
  const open = rows.filter((d) => d.status !== "resolved");
  const total = open.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Open disputes" value={String(open.length)} tone="danger" />
        <Kpi label="At-risk value" value={`£${total.toLocaleString()}`} delta="awaiting supplier credit" tone="warning" />
        <Kpi label="Resolved 30d" value="4" delta="£3,128 recovered" tone="success" />
      </div>

      <Card>
        <CardHead title="Disputed invoices" subtitle="Track credit notes and supplier replies from one place" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-2.5 text-left font-semibold">Raised</th>
                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-4 py-2.5 text-left font-semibold">Reason</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold">Owner</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No disputes raised. 🎉</td></tr>
              )}
              {rows.map((d) => (
                <tr key={d.ref} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num font-semibold">
                    <Link to="/invoices/$ref" params={{ ref: d.ref }} className="hover:underline">{d.ref}</Link>
                  </td>
                  <td className="px-4 py-3">{d.supplier}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{d.raised}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold text-[var(--red-500)]">£{d.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">{d.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={d.status === "resolved" ? "success" : d.status === "credit-pending" ? "warning" : "danger"} dot>
                      {d.status === "credit-pending" ? "Credit pending" : d.status === "open" ? "Open" : "Resolved"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-[12px]">{d.owner}</td>
                  <td className="px-4 py-3 text-right">
                    {canSign && d.status !== "resolved" && (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setDlg({ kind: "chase", row: d })}>
                          <Mail className="mr-1 h-3 w-3" /> Chase
                        </Button>
                        <Button size="sm" className="h-7 text-[11px]" onClick={() => setDlg({ kind: "resolve", row: d })}>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Resolve
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {dlg?.kind === "chase" && <ChaseDialog row={dlg.row} open onOpenChange={(v) => !v && setDlg(null)} />}
      {dlg?.kind === "resolve" && <ResolveDisputeDialog row={dlg.row} open onOpenChange={(v) => !v && setDlg(null)} />}
    </div>
  );
}