import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormWizard } from "@/components/forms/FormWizard";
import { PhotoDropzone } from "@/components/forms/PhotoDropzone";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useProject } from "@/lib/ProjectContext";
import { useSupplierStats } from "@/lib/priceListRegistry";
import {
  addVariation,
  newChange,
  OP_OPTIONS,
  RAISED_BY_OPTIONS,
  sumChanges,
  type VariationChange,
  type VariationRaisedBy,
  type VariationSource,
} from "@/lib/variations";

const search = z.object({
  source: z.enum(["manual", "daily-report", "rfi"]).optional(),
  sourceDate: z.string().optional(),
  sourceTaskId: z.string().optional(),
  title: z.string().optional(),
});

export const Route = createFileRoute("/forms/variation")({
  validateSearch: search,
  component: Guarded,
});

function Guarded() {
  const allowed = useCan("edit.variations");
  if (!allowed) return <NoAccess cap="edit.variations" title="Only QS / Admin can raise variations" />;
  return <VariationForm />;
}

function VariationForm() {
  const nav = useNavigate();
  const { current } = useProject();
  const params = useSearch({ from: "/forms/variation" });

  const [title, setTitle] = useState(params.title ?? "");
  const [reason, setReason] = useState("");
  const [raisedBy, setRaisedBy] = useState<VariationRaisedBy>("client");
  const [raisedDate, setRaisedDate] = useState(new Date().toISOString().slice(0, 10));
  const [zones, setZones] = useState("");
  const [timeImpact, setTimeImpact] = useState("0");
  const [changes, setChanges] = useState<VariationChange[]>([newChange()]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const updateChange = (id: string, patch: Partial<VariationChange>) =>
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

  const total = sumChanges(changes);
  const canSubmit = title.trim().length > 0 && changes.some((c) => c.description.trim().length > 0);

  const submit = () => {
    if (!canSubmit) return;
    const cleaned = changes.filter((c) => c.description.trim().length > 0);
    const v = addVariation(current.id, {
      title: title.trim(),
      reason: [reason.trim(), zones ? `Zones: ${zones}` : "", note ? `Notes: ${note}` : ""]
        .filter(Boolean)
        .join("\n"),
      raisedBy,
      raisedDate,
      status: "submitted",
      changes: cleaned,
      timeImpactDays: Number(timeImpact) || 0,
      attachments: photos.map((_, i) => ({ name: `photo-${i + 1}.jpg` })),
      source: (params.source as VariationSource | undefined) ?? "manual",
      sourceDate: params.sourceDate,
      sourceTaskId: params.sourceTaskId,
    });
    toast.success("Variation submitted", { description: `${v.id} · ${title.trim()}` });
    nav({ to: "/variations" });
  };

  return (
    <div className="space-y-4">
      <Button asChild size="sm" variant="ghost">
        <Link to="/variations"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to variations</Link>
      </Button>

      <FormWizard
        title="Raise variation"
        subtitle={`4-step form · saved against ${current.name}`}
        submitLabel="Submit variation"
        canSubmit={canSubmit}
        onSubmit={submit}
        onCancel={() => nav({ to: "/variations" })}
        steps={[
          {
            id: "trigger",
            label: "Trigger",
            render: () => (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[12px] font-semibold">Raised by</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {RAISED_BY_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setRaisedBy(o.value)}
                        className={`rounded-md border px-2 py-1.5 text-[12px] transition-colors ${
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
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Raised date</Label>
                  <Input type="date" value={raisedDate} onChange={(e) => setRaisedDate(e.target.value)} className="h-9 text-[12.5px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Source</Label>
                  <Input
                    value={params.source ?? "manual"}
                    disabled
                    className="h-9 text-[12.5px]"
                  />
                  <p className="text-[10.5px] text-[var(--ink-500)]">Provenance defaults to manual; daily-report deep links pre-fill this field.</p>
                </div>
              </div>
            ),
          },
          {
            id: "scope",
            label: "Scope",
            canAdvance: () => title.trim().length > 0,
            render: () => (
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Upgrade acoustic spec — bedrooms L3-L5"
                    className="h-9 text-[12.5px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Description / instruction</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Reference RFI / AI / written instruction. Why is this change needed?"
                    className="text-[12.5px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Affected zones</Label>
                  <Input
                    value={zones}
                    onChange={(e) => setZones(e.target.value)}
                    placeholder="e.g. L3-L5 bedrooms, Apt 12-24"
                    className="h-9 text-[12.5px]"
                  />
                </div>
              </div>
            ),
          },
          {
            id: "impact",
            label: "Cost & time",
            canAdvance: () => changes.some((c) => c.description.trim().length > 0),
            render: () => (
              <div className="space-y-3">
                <div className="rounded-md border border-[var(--ink-200)]">
                  <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                      Cost lines ({changes.length})
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChanges((cs) => [...cs, newChange()])}
                      className="h-7 gap-1 text-[11.5px]"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--ink-200)]">
                    {changes.map((c, idx) => (
                      <div key={c.id} className="grid grid-cols-12 gap-2 px-3 py-2">
                        <select
                          value={c.op}
                          onChange={(e) => updateChange(c.id, { op: e.target.value as VariationChange["op"] })}
                          className="col-span-2 h-8 rounded border border-[var(--ink-200)] bg-transparent px-1.5 text-[12px]"
                        >
                          {OP_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        <Input
                          value={c.description}
                          onChange={(e) => updateChange(c.id, { description: e.target.value })}
                          placeholder={idx === 0 ? "Describe the change…" : ""}
                          className="col-span-5 h-8 text-[12px]"
                        />
                        <Input
                          type="number"
                          value={c.qty ?? 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateChange(c.id, { qty: Number(e.target.value) })}
                          className="col-span-1 h-8 text-[12px]"
                          placeholder="Qty"
                        />
                        <Input
                          value={c.unit ?? ""}
                          onChange={(e) => updateChange(c.id, { unit: e.target.value })}
                          className="col-span-1 h-8 text-[12px]"
                          placeholder="unit"
                        />
                        <Input
                          type="number"
                          value={c.ratePerUnit ?? 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateChange(c.id, { ratePerUnit: Number(e.target.value) })}
                          className="col-span-2 h-8 text-[12px]"
                          placeholder="Rate £"
                        />
                        <div className="col-span-1 flex items-center justify-end gap-1 text-[12px] font-semibold tabular-nums">
                          <span className={c.lineTotal < 0 ? "text-[var(--red-500)]" : ""}>
                            {c.lineTotal < 0 ? "-" : ""}£{Math.abs(c.lineTotal).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setChanges((cs) => cs.filter((x) => x.id !== c.id))}
                            className="ml-1 text-[var(--ink-500)] hover:text-[var(--red-500)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--ink-200)] bg-[var(--ink-50)]/40 px-3 py-2">
                    <p className="text-[11.5px] text-[var(--ink-500)]">Negative qty / rate for credits & omissions</p>
                    <p className="text-[13px] font-semibold tabular-nums">
                      Cost impact:{" "}
                      <span className={total < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]"}>
                        {total < 0 ? "-" : ""}£{Math.abs(total).toLocaleString("en-GB", { maximumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold">Time impact (days)</Label>
                    <Input
                      type="number"
                      value={timeImpact}
                      onChange={(e) => setTimeImpact(e.target.value)}
                      className="h-9 text-[12.5px]"
                    />
                    <p className="text-[10.5px] text-[var(--ink-500)]">Negative for time savings.</p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "attach",
            label: "Attach & submit",
            render: () => (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-[12px] font-semibold">Photos / sketches</Label>
                  <PhotoDropzone value={photos} onChange={setPhotos} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Additional notes</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="text-[12.5px]"
                    placeholder="Anything QS or PM should know."
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}