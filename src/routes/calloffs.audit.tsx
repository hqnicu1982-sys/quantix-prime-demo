import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { auditLog } from "@/lib/callOffWorkflow";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/calloffs/audit")({ component: Audit });

function Audit() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Why the audit log matters" subtitle="Every state transition is captured for governance + dispute defence" />
        <div className="m-5 flex items-start gap-3 rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 p-4 text-[12.5px]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-600)]" />
          <p><strong>Governance:</strong> every call-off carries a full chain of custody — Site → QS → PO → GRN → Invoice — traceable to BoQ rev. Over-delivery is blocked at GRN. Approvals require named tier.</p>
        </div>
      </Card>

      <Card>
        <CardHead title="Audit timeline" subtitle="Most recent first · last 7 days" />
        <ol className="divide-y divide-[var(--ink-200)]">
          {auditLog.map((e, i) => (
            <li key={i} className="grid grid-cols-[100px_90px_120px_1fr] gap-3 px-5 py-3 text-[12.5px]">
              <span className="text-[var(--ink-500)]">{e.ts}</span>
              <Link to="/calloffs/$ref" params={{ ref: e.ref }} className="font-mono-num font-semibold hover:underline">{e.ref}</Link>
              <span className="font-semibold">{e.action}</span>
              <span className="text-[var(--ink-700)]"><span className="text-[var(--ink-500)]">{e.actor} · </span>{e.detail}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}