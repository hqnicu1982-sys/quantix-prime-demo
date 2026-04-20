import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { callOffs, callOffStateMachine, callOffTabs, fmtMoney } from "@/lib/mockData";
import { ChevronRight, ShieldCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/calloffs")({ component: CallOffs });

const stateBadge = {
  approved: { tone: "success" as const, label: "Approved" },
  draft: { tone: "neutral" as const, label: "Draft" },
  "in-delivery": { tone: "info" as const, label: "In delivery" },
  "po-sent": { tone: "info" as const, label: "PO sent" },
  "review-needed": { tone: "warning" as const, label: "Needs QS review" },
  submitted: { tone: "neutral" as const, label: "Submitted" },
  reviewed: { tone: "neutral" as const, label: "Reviewed" },
  closed: { tone: "neutral" as const, label: "Closed" },
};

function CallOffs() {
  return (
    <Section
      title="Call-offs"
      subtitle="7-state workflow · full audit trail · Site manager requests, QS approves, PO fires on green light."
      right={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off</Button>}
    >
      <Card>
        <CardHead title="Call-off #247 (Gyproc WallBoard, 1,850m²)" subtitle="State machine · live audit trail" />
        <div className="overflow-x-auto p-5">
          <div className="flex min-w-[720px] items-center gap-2">
            {callOffStateMachine.map((s, i) => {
              const isCurrent = s.status === "current";
              const isDone = s.status === "done";
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className={`flex-1 rounded-lg border p-3 text-center text-[11.5px] ${
                    isCurrent ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 ring-2 ring-[var(--accent-500)]/30"
                    : isDone ? "border-[var(--green-600)]/30 bg-[var(--green-600)]/5"
                    : "border-[var(--ink-200)] bg-[var(--ink-50)] text-[var(--ink-500)]"
                  }`}>
                    <p className="font-semibold">{s.label}</p>
                    <p className="mt-0.5 text-[10px]">{s.who} · {s.when}</p>
                  </div>
                  {i < callOffStateMachine.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="m-5 flex items-start gap-3 rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 p-4 text-[12.5px]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-600)]" />
          <p><strong>Governance:</strong> this call-off went through 3 approvals, triggered 4 audit events, and is traceable to BoQ rev 3.2 line 14. Over-delivery will be blocked at GRN step.</p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1 border-b border-[var(--ink-200)] pb-1">
        {callOffTabs.map((t, i) => (
          <button key={t.id} className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${i === 0 ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-500)] hover:bg-[var(--ink-50)]"}`}>
            {t.label} <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      <Card>
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
              <tr key={c.ref} className="hover:bg-[var(--ink-50)]">
                <td className="px-4 py-3 font-mono-num font-semibold">{c.ref}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.item}</p>
                  <p className="text-[11px] text-[var(--ink-500)]">{c.subtitle}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={c.supplier === "CCF" ? "success" : "info"} dot>{c.supplier}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-right font-mono-num">{c.qty}</td>
                <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(c.value)}</td>
                <td className="px-4 py-3"><StatusBadge tone={stateBadge[c.state].tone} dot>{stateBadge[c.state].label}</StatusBadge></td>
                <td className={`px-4 py-3 text-[12px] ${c.needByOverdue ? "font-semibold text-[var(--red-500)]" : "text-[var(--ink-700)]"}`}>{c.needBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}
