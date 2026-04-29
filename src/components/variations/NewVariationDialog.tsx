import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, FileText } from "lucide-react";
import {
  addVariation,
  newChange,
  OP_OPTIONS,
  RAISED_BY_OPTIONS,
  sumChanges,
  type VariationAttachment,
  type VariationChange,
  type VariationRaisedBy,
} from "@/lib/variations";
import { toast } from "sonner";
import { useProject } from "@/lib/ProjectContext";
import { useCan } from "@/lib/permissions";

export function NewVariationDialog({
  trigger,
  projectId,
}: {
  trigger?: React.ReactNode;
  projectId?: string;
}) {
  const { current } = useProject();
  const pid = projectId ?? current.id;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [raisedBy, setRaisedBy] = useState<VariationRaisedBy>("client");
  const [raisedDate, setRaisedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [timeImpactDays, setTimeImpactDays] = useState<string>("0");
  const [changes, setChanges] = useState<VariationChange[]>([newChange()]);
  const [attachments, setAttachments] = useState<VariationAttachment[]>([]);

  const reset = () => {
    setTitle("");
    setReason("");
    setRaisedBy("client");
    setRaisedDate(new Date().toISOString().slice(0, 10));
    setTimeImpactDays("0");
    setChanges([newChange()]);
    setAttachments([]);
  };

  const updateChange = (id: string, patch: Partial<VariationChange>) => {
    setChanges((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...patch };
        if (patch.qty !== undefined || patch.ratePerUnit !== undefined) {
          const q = Number(merged.qty) || 0;
          const r = Number(merged.ratePerUnit) || 0;
          merged.lineTotal = +(q * r).toFixed(2);
        }
        return merged;
      }),
    );
  };

  const total = sumChanges(changes);
  const canSave = title.trim().length > 0 && changes.some((c) => c.description.trim().length > 0);

  const save = (submit: boolean) => {
    if (!canSave) return;
    const cleaned = changes.filter((c) => c.description.trim().length > 0);
    addVariation(pid, {
      title: title.trim(),
      reason: reason.trim(),
      raisedBy,
      raisedDate,
      status: submit ? "submitted" : "draft",
      changes: cleaned,
      timeImpactDays: Number(timeImpactDays) || 0,
      attachments,
    });
    toast.success(submit ? "Variation submitted" : "Variation saved as draft", {
      description: title.trim(),
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New variation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New variation</DialogTitle>
          <DialogDescription>
            Track a client/contractor change against the baseline scope. Cost & time impact will be saved against the current project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="vo-title">Title *</Label>
            <Input
              id="vo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Upgrade acoustic spec — bedrooms L3-L5"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vo-reason">Reason / instruction</Label>
            <Textarea
              id="vo-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reference RFI / AI / written instruction. Why is this change needed?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5 col-span-2">
              <Label>Raised by</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {RAISED_BY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setRaisedBy(o.value)}
                    className={`rounded border px-2 py-1.5 text-[12px] transition-colors ${
                      raisedBy === o.value
                        ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 font-semibold text-[var(--accent-500)]"
                        : "border-[var(--ink-200)] hover:bg-[var(--ink-50)]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vo-date">Raised date</Label>
              <Input id="vo-date" type="date" value={raisedDate} onChange={(e) => setRaisedDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border border-[var(--ink-200)]">
            <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                Changes ({changes.length})
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setChanges((cs) => [...cs, newChange()])}
                className="h-7 gap-1 text-[11.5px]"
              >
                <Plus className="h-3 w-3" /> Add change
              </Button>
            </div>
            <div className="divide-y divide-[var(--ink-200)]">
              {changes.map((c, idx) => (
                <div key={c.id} className="grid grid-cols-12 gap-2 px-3 py-2.5">
                  <div className="col-span-2">
                    <select
                      value={c.op}
                      onChange={(e) => updateChange(c.id, { op: e.target.value as VariationChange["op"] })}
                      className="h-8 w-full rounded border border-[var(--ink-200)] bg-transparent px-1.5 text-[12px]"
                    >
                      {OP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={c.description}
                      onChange={(e) => updateChange(c.id, { description: e.target.value })}
                      placeholder={idx === 0 ? "Describe the change…" : ""}
                      className="h-8 text-[12px]"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={c.qty ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateChange(c.id, { qty: Number(e.target.value) })}
                      className="h-8 text-[12px]"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={c.unit ?? ""}
                      onChange={(e) => updateChange(c.id, { unit: e.target.value })}
                      className="h-8 text-[12px]"
                      placeholder="unit"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={c.ratePerUnit ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateChange(c.id, { ratePerUnit: Number(e.target.value) })}
                      className="h-8 text-[12px]"
                      placeholder="Rate £"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1 text-[12px] font-semibold tabular-nums">
                    <span className={c.lineTotal < 0 ? "text-[var(--red-500)]" : ""}>
                      {c.lineTotal < 0 ? "-" : ""}£{Math.abs(c.lineTotal).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChanges((cs) => cs.filter((x) => x.id !== c.id))}
                      className="ml-1 text-[var(--ink-500)] hover:text-[var(--red-500)]"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--ink-200)] bg-[var(--ink-50)]/40 px-3 py-2">
              <p className="text-[11.5px] text-[var(--ink-500)]">Use negative qty or rate for credits / omissions</p>
              <p className="text-[13px] font-semibold tabular-nums">
                Cost impact:{" "}
                <span className={total < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]"}>
                  {total < 0 ? "-" : ""}£{Math.abs(total).toLocaleString("en-GB", { maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vo-time">Time impact (days)</Label>
              <Input
                id="vo-time"
                type="number"
                value={timeImpactDays}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTimeImpactDays(e.target.value)}
              />
              <p className="text-[10.5px] text-[var(--ink-500)]">Use negative for time savings</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Attachments</Label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-dashed border-[var(--ink-200)] px-3 py-1.5 text-[12px] hover:bg-[var(--ink-50)]">
                <Upload className="h-3.5 w-3.5" />
                <span>Add file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setAttachments((a) => [...a, { name: f.name }]);
                  }}
                />
              </label>
              {attachments.length > 0 && (
                <ul className="space-y-0.5">
                  {attachments.map((a, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-700)]">
                      <FileText className="h-3 w-3" /> {a.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))}
                        className="ml-auto text-[var(--ink-500)] hover:text-[var(--red-500)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={!canSave}>Save as draft</Button>
          <Button onClick={() => save(true)} disabled={!canSave}>Save & submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}