import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkflowStrip } from "@/components/calloffs/WorkflowStrip";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/ProjectContext";
import { useBoqAllocation, reserve } from "@/lib/boqAllocation";
import { addCallOff } from "@/lib/projectData";
import { recordCallOffAction } from "@/lib/callOffActions";
import { FormWizard } from "@/components/forms/FormWizard";
import { useDrawings } from "@/lib/drawingRegistry";
import { GitCompare } from "lucide-react";

export const Route = createFileRoute("/calloffs/new")({ component: Guarded });

function Guarded() {
  const allowed = useCan("create.calloffs");
  if (!allowed) return <NoAccess cap="create.calloffs" title="Only Site users and above can raise call-offs" />;
  return <NewCallOff />;
}

function NewCallOff() {
  const nav = useNavigate();
  const { current } = useProject();
  const alloc = useBoqAllocation(current.id);
  const drawings = useDrawings(current.id);
  const pendingLineIds = new Set<string>();
  for (const r of drawings.revisions) {
    if (r.status !== "pending") continue;
    (r.affectedBoqLineIds ?? []).forEach((id) => pendingLineIds.add(id));
  }
  const lineHasPendingRev = (id: string) => pendingLineIds.has(id);

  const lineOptions = useMemo(() => {
    return alloc.systems.flatMap((s) =>
      s.lines.map((l) => ({
        id: l.line.id,
        label: `${s.system.systemCode} · ${l.line.material} — ${l.remaining.toLocaleString()} ${l.line.unit} remaining`,
        disabled: l.remaining === 0,
        remaining: l.remaining,
        approved: l.approved,
        unit: l.line.unit,
        material: l.line.material,
      })),
    );
  }, [alloc.systems]);

  const firstAvailable = lineOptions.find((o) => !o.disabled);
  const [selectedLineId, setSelectedLineId] = useState<string>(firstAvailable?.id ?? "");
  const selected = lineOptions.find((o) => o.id === selectedLineId) ?? firstAvailable;
  const [qty, setQty] = useState<number>(selected?.remaining ?? 0);
  const SUPPLIERS = [
    "Minster",
    "CCF",
    "Knauf Direct",
  ];
  const [supplier, setSupplier] = useState<string>(SUPPLIERS[0]);

  const remaining = selected?.remaining ?? 0;
  const exceed = qty > remaining;
  const selectedHasPending = !!selected && lineHasPendingRev(selected.id);
  const canSubmit = !!selected && qty > 0 && !exceed;

  const handleSubmit = () => {
    if (!selected) return;
    const co = addCallOff(current.id, {
      supplier,
      lineIds: [selected.id],
      status: "draft",
    });
    reserve(current.id, co.id, selected.id, qty);
    recordCallOffAction({
      ref: co.id,
      kind: "submit",
      stateAfter: "submitted",
      note: `${qty.toLocaleString()} ${selected.unit} of ${selected.material}`,
    });
    toast.success("Call-off submitted", {
      description: `${qty.toLocaleString()} ${selected.unit} of ${selected.material} reserved · ${co.id}`,
    });
    nav({ to: "/calloffs/$ref", params: { ref: co.id } });
  };

  return (
    <FormWizard
      title="New call-off"
      subtitle="4-step wizard · all fields are validated against the BoQ"
      workflowStrip={<WorkflowStrip currentState="draft" compact />}
      submitLabel="Submit for QS review"
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      onCancel={() => nav({ to: "/calloffs" })}
      steps={[
        {
          id: "pick",
          label: "Pick BoQ line",
          canAdvance: () => !!selected,
          render: () => (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>BoQ line</Label>
                {lineOptions.length === 0 ? (
                  <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-3 text-[12px] text-[var(--ink-700)]">
                    No estimator-approved BoQ lines on <strong>{current.name}</strong>. Ask the estimator to add a system from the Calculator first.
                  </div>
                ) : (
                  <select
                    className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]"
                    value={selectedLineId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedLineId(id);
                      const opt = lineOptions.find((o) => o.id === id);
                      setQty(opt?.remaining ?? 0);
                    }}
                  >
                    {lineOptions.map((o) => (
                      <option key={o.id} value={o.id} disabled={o.disabled}>
                        {o.label}{o.disabled ? " · fully ordered" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10.5px] text-[var(--ink-500)]">Sourced from estimator's BoQ on {current.name}.</p>
                {selectedHasPending && (
                  <div className="mt-1 flex items-center gap-1.5 rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 px-2 py-1 text-[10.5px] text-[var(--amber-500)]">
                    <GitCompare className="h-3 w-3" />
                    Pending drawing revision affects this BoQ line — confirm before sending PO.
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Project zone</Label>
                <Input placeholder="e.g. Level 5 — apartment walls" />
              </div>
            </div>
          ),
        },
        {
          id: "supplier",
          label: "Supplier & qty",
          canAdvance: () => qty > 0 && !exceed,
          render: () => (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <select
                  className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                >
                  {SUPPLIERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity {selected ? `(${selected.unit})` : ""}</Label>
                <Input
                  type="number"
                  min={0}
                  max={remaining}
                  value={qty || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > remaining) {
                      toast.warning("Capped at remaining BoQ", { description: `Estimator approved ${selected?.approved.toLocaleString()} ${selected?.unit}. Max you can order now: ${remaining.toLocaleString()}.` });
                      setQty(remaining);
                    } else {
                      setQty(v);
                    }
                  }}
                />
                <p className={cn(
                  "text-[10.5px]",
                  exceed ? "text-[var(--red-500)]" : "text-[var(--ink-500)]",
                )}>
                  {exceed && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                  {selected ? `Capped at remaining (${remaining.toLocaleString()} of ${selected.approved.toLocaleString()} approved).` : "Pick a BoQ line first."}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "delivery",
          label: "Delivery + notes",
          render: () => (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Need by</Label>
                <Input type="date" defaultValue="2026-04-24" />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery zone</Label>
                <Input placeholder="Loading bay B · Level 5 hoist" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Notes for QS</Label>
                <textarea className="min-h-[72px] w-full rounded-md border border-[var(--ink-200)] bg-background px-3 py-2 text-[13px]" placeholder="Anything QS needs to know before approving?" />
              </div>
            </div>
          ),
        },
        {
          id: "review",
          label: "Submit for QS review",
          render: () => (
            <div className="space-y-3">
              <div className="rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 p-4 text-[12.5px]">
                <p className="font-semibold text-[var(--green-600)]">Ready to submit</p>
                <p className="mt-1 text-[var(--ink-700)]">
                  On submit: <strong>{qty.toLocaleString()} {selected?.unit}</strong> of {selected?.material} reserve against the estimator's BoQ.
                  Remaining for this line will drop from <strong>{remaining.toLocaleString()}</strong> to <strong>{Math.max(0, remaining - qty).toLocaleString()}</strong> {selected?.unit}.
                </p>
              </div>
              {exceed && (
                <div className="rounded-md border border-[var(--red-500)]/30 bg-[var(--red-500)]/5 p-3 text-[12px] text-[var(--red-500)]">
                  <AlertTriangle className="mr-1 inline h-3 w-3" /> Quantity exceeds estimator's approved budget — adjust before submitting.
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}