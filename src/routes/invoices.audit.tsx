import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { invoiceAuditLog } from "@/lib/invoiceWorkflow";
import { useInvoiceActions } from "@/lib/invoiceActions";

export const Route = createFileRoute("/invoices/audit")({ component: Audit });

function Audit() {
  const actions = useInvoiceActions();
  const fromActions = actions.map((a) => ({
    ts: new Date(a.ts).toLocaleString(),
    ref: a.ref,
    actor: a.actor,
    action:
      a.kind === "accept-variance" ? "Variance accepted" :
      a.kind === "dispute" ? "Disputed" :
      a.kind === "request-credit" ? "Credit requested" :
      a.kind === "resolve-dispute" ? "Dispute resolved" :
      a.kind === "chase" ? "Supplier chased" :
      a.kind === "schedule" ? "Scheduled" :
      a.kind === "pay" ? "Paid" : "Updated",
    detail: [a.reason, a.creditAmount ? `£${a.creditAmount.toLocaleString()}` : a.amount ? `£${a.amount.toLocaleString()}` : null, a.note].filter(Boolean).join(" · "),
  }));
  const log = [...fromActions, ...invoiceAuditLog];
  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Audit log" subtitle="Every invoice state change — system + human, traceable to file & timestamp" />
        <ol className="divide-y divide-[var(--ink-200)] text-[12.5px]">
          {log.map((e, i) => (
            <li key={i} className="grid grid-cols-[80px_120px_140px_1fr] items-baseline gap-3 px-5 py-2.5">
              <span className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">{e.ts}</span>
              <Link to="/invoices/$ref" params={{ ref: e.ref }} className="font-mono-num text-[12px] font-semibold hover:underline">{e.ref}</Link>
              <span className="font-semibold">{e.action} <span className="font-normal text-[var(--ink-500)]">· {e.actor}</span></span>
              <span className="text-[var(--ink-700)]">{e.detail}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}