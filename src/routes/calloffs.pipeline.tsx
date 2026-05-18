import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { callOffs, fmtMoney, type CallOffState } from "@/lib/mockData";
import { CALL_OFF_STEPS, STATE_LABEL, STATE_TONE } from "@/lib/callOffWorkflow";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/calloffs/pipeline")({ component: Pipeline });

/**
 * Kanban-style "by state" view. One column per workflow step; each call-off
 * lives in the column matching its current state. Review-needed sits in the
 * QS reviewed column flagged amber.
 */
function Pipeline() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHead title="Pipeline overview" subtitle="Every call-off mapped to its current workflow stage" />
        <div className="p-5">
          <WorkflowStrip currentState="po-sent" compact />
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {CALL_OFF_STEPS.map((step) => {
          const items = callOffs.filter((c) => {
            if (step.id === "reviewed") return c.state === "reviewed" || c.state === "review-needed" || c.state === "submitted";
            return c.state === step.id;
          });
          return (
            <Card key={step.id} className="flex flex-col">
              <div className="border-b border-[var(--ink-200)] px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">{step.label}</p>
                <p className="font-display text-[20px] font-semibold leading-none text-[var(--ink-900)]">{items.length}</p>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {items.length === 0 && (
                  <p className="px-1 py-3 text-center text-[11px] text-[var(--ink-500)]">No items</p>
                )}
                {items.map((c) => (
                  <Link
                    key={c.ref}
                    to="/calloffs/$ref"
                    params={{ ref: c.ref }}
                    className="block rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-2 text-[11.5px] transition-colors hover:border-[var(--accent-500)]/40 hover:bg-[var(--accent-500)]/5"
                  >
                    <p className="font-mono-num font-semibold">{c.ref}</p>
                    <p className="truncate text-[var(--ink-700)]">{c.item}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono-num text-[10.5px] text-[var(--ink-500)]">{fmtMoney(c.value)}</span>
                      <StatusBadge tone={STATE_TONE[c.state as CallOffState]}>{STATE_LABEL[c.state as CallOffState]}</StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}