import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useBoqAllocation, reserve, type LineAllocation } from "@/lib/boqAllocation";
import { useState } from "react";
import { toast } from "sonner";
import { Layers, PackagePlus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/allocation")({ component: Guarded });

function Guarded() {
  const allowed = useCan("view.boq");
  if (!allowed) return <NoAccess cap="view.boq" title="Materials allocation restricted" />;
  return <AllocationPage />;
}

function AllocationPage() {
  const { projectId } = Route.useParams();
  const { systems, totals, linesFullyConsumed } = useBoqAllocation(projectId);
  const [picked, setPicked] = useState<LineAllocation | null>(null);

  const orderedPct = totals.approved === 0 ? 0 : Math.round((totals.ordered / totals.approved) * 100);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Approved by estimator" value={`${totals.approved.toLocaleString()} units`} delta={`${systems.length} systems`} />
        <Kpi label="Ordered / committed"   value={`${totals.ordered.toLocaleString()}`} delta={`${orderedPct}% of approved`} tone={orderedPct > 90 ? "warning" : "success"} />
        <Kpi label="Remaining to order"    value={`${totals.remaining.toLocaleString()}`} tone={totals.remaining === 0 ? "danger" : "neutral"} />
        <Kpi label="Lines fully consumed"  value={`${linesFullyConsumed}`} delta="cap reached" tone="info" />
      </div>

      {systems.length === 0 && (
        <Card>
          <div className="p-6 text-center">
            <Layers className="mx-auto mb-2 h-6 w-6 text-[var(--ink-500)]" />
            <p className="text-[13px] font-semibold">No systems on this project yet</p>
            <p className="mt-1 text-[12px] text-[var(--ink-500)]">
              Estimator adds systems from the Calculator → they land here with an approved quantity and the Site Manager can call-off against each line.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {systems.map((s) => (
          <Card key={s.system.id}>
            <CardHead
              title={s.system.systemCode}
              subtitle={`${s.system.systemName} · ${s.system.areaM2.toLocaleString()} m² · ${s.lines.length} BoQ lines`}
              right={
                <div className="flex items-center gap-3">
                  <div className="text-right text-[11px] text-[var(--ink-500)]">
                    <div className="font-semibold text-[var(--ink-900)]">{s.pctOrdered}% ordered</div>
                    <div>{s.remainingTotal.toLocaleString()} remaining</div>
                  </div>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--ink-100)]">
                    <div
                      className={cn(
                        "h-full transition-all",
                        s.pctOrdered >= 100 && "bg-[var(--red-500)]",
                        s.pctOrdered >= 75 && s.pctOrdered < 100 && "bg-[var(--amber-500)]",
                        s.pctOrdered < 75 && "bg-[var(--green-600)]",
                      )}
                      style={{ width: `${Math.min(100, s.pctOrdered)}%` }}
                    />
                  </div>
                </div>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Approved</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Pending</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ordered</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Remaining</th>
                    <th className="px-4 py-2.5 text-left font-semibold w-[140px]">Consumed</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-200)]">
                  {s.lines.map((l) => {
                    const consumed = l.approved === 0 ? 0 : Math.round(((l.ordered + l.pending) / l.approved) * 100);
                    return (
                      <tr key={l.line.id} className="hover:bg-[var(--ink-50)]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--ink-900)]">{l.line.material}</p>
                          <p className="text-[11px] text-[var(--ink-500)]">Line {l.line.id.slice(-4)} · {l.line.unit}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num">{l.approved.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono-num text-[var(--amber-500)]">{l.pending > 0 ? l.pending.toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-right font-mono-num">{l.ordered > 0 ? l.ordered.toLocaleString() : "—"}</td>
                        <td className={cn(
                          "px-4 py-3 text-right font-mono-num font-semibold",
                          l.remaining === 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]",
                        )}>
                          {l.remaining.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ink-100)]">
                              <div
                                className={cn(
                                  "h-full",
                                  consumed >= 100 ? "bg-[var(--red-500)]" :
                                  consumed >= 75  ? "bg-[var(--amber-500)]" :
                                                    "bg-[var(--green-600)]",
                                )}
                                style={{ width: `${Math.min(100, consumed)}%` }}
                              />
                            </div>
                            <span className="font-mono-num text-[10.5px] text-[var(--ink-500)]">{consumed}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {l.remaining === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ink-500)]">
                              <CheckCircle2 className="h-3 w-3" /> Fully ordered
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setPicked(l)}>
                              <PackagePlus className="mr-1.5 h-3 w-3" /> Call-off
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>

      <CallOffDialog
        projectId={projectId}
        line={picked}
        onClose={() => setPicked(null)}
      />
    </div>
  );
}

function CallOffDialog({
  projectId, line, onClose,
}: { projectId: string; line: LineAllocation | null; onClose: () => void }) {
  const nav = useNavigate();
  const canCreate = useCan("create.calloffs");
  const [qty, setQty] = useState<number>(0);
  const open = !!line;

  if (!line) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }

  const remaining = line.remaining;
  const exceed = qty > remaining;
  const invalid = qty <= 0 || exceed;

  const handleSubmit = () => {
    const coId = `CO-${Math.floor(Math.random() * 900 + 100)}`;
    reserve(projectId, coId, line.line.id, qty);
    toast.success("Call-off reserved", {
      description: `${qty.toLocaleString()} ${line.line.unit} of ${line.line.material} → ${coId} (pending QS)`,
    });
    onClose();
    nav({ to: "/calloffs" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Raise call-off</DialogTitle>
          <DialogDescription>{line.line.material}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[12.5px]">
          <div className="grid grid-cols-3 gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] p-3 text-center">
            <div>
              <div className="text-[10.5px] uppercase text-[var(--ink-500)]">Approved</div>
              <div className="font-mono-num text-[14px] font-semibold">{line.approved.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase text-[var(--ink-500)]">Already used</div>
              <div className="font-mono-num text-[14px] font-semibold">{(line.ordered + line.pending).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase text-[var(--ink-500)]">Remaining</div>
              <div className={cn(
                "font-mono-num text-[14px] font-semibold",
                remaining === 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]",
              )}>{remaining.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Quantity ({line.line.unit})</Label>
            <Input
              type="number"
              autoFocus
              min={0}
              max={remaining}
              value={qty || ""}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > remaining) {
                  toast.warning("Capped at remaining BoQ", { description: `Max ${remaining.toLocaleString()} ${line.line.unit}` });
                  setQty(remaining);
                } else {
                  setQty(v);
                }
              }}
              placeholder={`Up to ${remaining.toLocaleString()}`}
            />
            {exceed && (
              <p className="inline-flex items-center gap-1 text-[11px] text-[var(--red-500)]">
                <AlertTriangle className="h-3 w-3" /> Exceeds estimator's approved quantity.
              </p>
            )}
            {!exceed && qty > 0 && qty < remaining && (
              <p className="text-[11px] text-[var(--ink-500)]">
                Partial order — {(remaining - qty).toLocaleString()} {line.line.unit} will stay on the budget.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={invalid || !canCreate} onClick={handleSubmit}>
            Submit for QS review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}