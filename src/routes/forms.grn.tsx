import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormWizard } from "@/components/forms/FormWizard";
import { SignaturePad } from "@/components/forms/SignaturePad";
import { PhotoDropzone } from "@/components/forms/PhotoDropzone";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { callOffs } from "@/lib/mockData";
import { logGrn, type GrnLine } from "@/lib/grnRegistry";
import { recordCallOffAction } from "@/lib/callOffActions";
import { currentUser } from "@/lib/mockData";

const search = z.object({ callOff: z.string().optional() });

export const Route = createFileRoute("/forms/grn")({
  validateSearch: search,
  component: Guarded,
});

function Guarded() {
  const allowed = useCan("create.calloffs");
  if (!allowed) return <NoAccess cap="create.calloffs" title="Only Site users and above can sign GRNs" />;
  return <GrnForm />;
}

function GrnForm() {
  const nav = useNavigate();
  const { callOff: callOffRef } = useSearch({ from: "/forms/grn" });
  const { current } = useProject();
  const projectData = useProjectData(current.id);

  // Resolve the call-off from live project data first, then mock fallback.
  const live = projectData.callOffs.find((c) => c.id === callOffRef);
  const mock = callOffs.find((c) => c.ref === callOffRef);
  const supplier = live?.supplier ?? mock?.supplier ?? "Unknown supplier";
  const ref = callOffRef ?? mock?.ref ?? "(no call-off)";
  const lineById = new Map(projectData.boqLines.map((l) => [l.id, l]));
  const initialLines: GrnLine[] = useMemo(() => {
    if (live) {
      return live.lineIds
        .map((id) => lineById.get(id))
        .filter(Boolean)
        .map((l) => ({
          material: l!.material,
          unit: l!.unit,
          orderedQty: l!.qty,
          receivedQty: l!.qty,
        }));
    }
    if (mock) {
      return [{ material: mock.item, unit: "", orderedQty: 0, receivedQty: 0 }];
    }
    return [{ material: "", unit: "", orderedQty: 0, receivedQty: 0 }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callOffRef]);

  const [lines, setLines] = useState<GrnLine[]>(initialLines);
  const [partial, setPartial] = useState(false);
  const [note, setNote] = useState("");
  const [deliveryNoteRef, setDeliveryNoteRef] = useState("");
  const [driverName, setDriverName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [signedBy, setSignedBy] = useState(currentUser.name);
  const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 16));
  const [signature, setSignature] = useState<string | undefined>();

  const updateLine = (i: number, patch: Partial<GrnLine>) =>
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const hasReceived = lines.some((l) => l.receivedQty > 0 || l.material.trim().length > 0);
  const canSubmit = !!callOffRef && hasReceived && !!signedBy.trim() && !!signature;

  const qtySummary = lines
    .filter((l) => l.receivedQty > 0)
    .map((l) => `${l.receivedQty.toLocaleString()} ${l.unit} ${l.material}`.trim())
    .join(" · ") || "(no quantities)";

  const submit = () => {
    if (!callOffRef) {
      toast.error("No call-off linked");
      return;
    }
    const rec = logGrn({
      callOffRef,
      projectId: live ? current.id : undefined,
      supplier,
      qty: qtySummary,
      partial,
      note,
      signedBy,
      signedAt: new Date(signedAt).toISOString(),
      lines,
      signature,
      photos,
      deliveryNoteRef: deliveryNoteRef || undefined,
      driverName: driverName || undefined,
    });
    recordCallOffAction({
      ref: callOffRef,
      kind: "log-grn",
      stateAfter: partial ? "in-delivery" : "closed",
      grnQty: qtySummary,
      grnPartial: partial,
      note,
    });
    toast.success(partial ? "Partial GRN logged" : "GRN signed · call-off closed", {
      description: `${rec.id} · ${qtySummary}`,
    });
    nav({ to: "/grn/$ref", params: { ref: rec.id } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/calloffs/$ref" params={{ ref }}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to call-off {ref}
          </Link>
        </Button>
        <span className="text-[11.5px] text-[var(--ink-500)]">
          GRN against <strong className="text-[var(--ink-700)]">{ref}</strong> · {supplier}
        </span>
      </div>

      <FormWizard
        title="Sign GRN"
        subtitle="Record what arrived on site · 4-step form with signature and photos"
        submitLabel={partial ? "Log partial GRN" : "Sign & close call-off"}
        canSubmit={canSubmit}
        onSubmit={submit}
        onCancel={() => nav({ to: "/calloffs/$ref", params: { ref } })}
        steps={[
          {
            id: "goods",
            label: "Goods received",
            canAdvance: () => hasReceived,
            render: () => (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-md border border-[var(--ink-200)]">
                  <table className="w-full text-[12.5px]">
                    <thead className="bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                      <tr>
                        <th className="px-3 py-2">Material</th>
                        <th className="px-3 py-2 w-20">Unit</th>
                        <th className="px-3 py-2 w-28 text-right">Ordered</th>
                        <th className="px-3 py-2 w-32 text-right">Received</th>
                        <th className="px-3 py-2 w-24">Δ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ink-200)]">
                      {lines.map((l, i) => {
                        const delta = l.receivedQty - l.orderedQty;
                        return (
                          <tr key={i}>
                            <td className="px-3 py-1.5">
                              <Input
                                value={l.material}
                                onChange={(e) => updateLine(i, { material: e.target.value })}
                                className="h-8 text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                value={l.unit}
                                onChange={(e) => updateLine(i, { unit: e.target.value })}
                                className="h-8 text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <Input
                                type="number"
                                value={l.orderedQty || ""}
                                onChange={(e) => updateLine(i, { orderedQty: Number(e.target.value) })}
                                className="h-8 text-right text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <Input
                                type="number"
                                value={l.receivedQty || ""}
                                onChange={(e) => updateLine(i, { receivedQty: Number(e.target.value) })}
                                className="h-8 text-right text-[12px]"
                              />
                            </td>
                            <td className={`px-3 py-1.5 text-[11.5px] font-mono ${delta === 0 ? "text-[var(--ink-500)]" : delta < 0 ? "text-[var(--amber-500)]" : "text-[var(--green-600)]"}`}>
                              {delta === 0 ? "match" : `${delta > 0 ? "+" : ""}${delta}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setLines((a) => [...a, { material: "", unit: "", orderedQty: 0, receivedQty: 0 }])}
                    className="text-[11.5px] font-semibold text-[var(--accent-500)] hover:underline"
                  >
                    + Add line
                  </button>
                  <p className="text-[11px] text-[var(--ink-500)]">Ordered qty is pre-filled from the call-off; edit received qty to match what arrived.</p>
                </div>
              </div>
            ),
          },
          {
            id: "condition",
            label: "Condition & notes",
            render: () => (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-start gap-2 rounded-md border border-[var(--ink-200)] p-3 md:col-span-2">
                  <Checkbox checked={partial} onCheckedChange={(v) => setPartial(v === true)} className="mt-0.5" />
                  <div>
                    <p className="text-[12.5px] font-semibold">Partial delivery</p>
                    <p className="text-[11px] text-[var(--ink-500)]">Keep the call-off open for the outstanding balance. When unchecked, the call-off closes on submit.</p>
                  </div>
                </label>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[12px] font-semibold">Notes</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Damaged items, missing items, on-hold flags, etc."
                    className="text-[12.5px]"
                  />
                </div>
              </div>
            ),
          },
          {
            id: "proof",
            label: "Proof",
            render: () => (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Delivery note ref</Label>
                  <Input
                    value={deliveryNoteRef}
                    onChange={(e) => setDeliveryNoteRef(e.target.value)}
                    placeholder="e.g. DN-44129"
                    className="h-9 text-[12.5px]"
                  />
                  <p className="text-[10.5px] text-[var(--ink-500)]">Reference on the supplier's paper delivery note.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold">Driver name</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Mark Wilson"
                    className="h-9 text-[12.5px]"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1.5 block text-[12px] font-semibold">Delivery photos</Label>
                  <PhotoDropzone value={photos} onChange={setPhotos} />
                </div>
              </div>
            ),
          },
          {
            id: "sign",
            label: "Sign & submit",
            render: () => (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold">Signed by</Label>
                    <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} className="h-9 text-[12.5px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold">Signed at</Label>
                    <Input type="datetime-local" value={signedAt} onChange={(e) => setSignedAt(e.target.value)} className="h-9 text-[12.5px]" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12px] font-semibold">Signature</Label>
                  <SignaturePad value={signature} onChange={setSignature} />
                </div>
                {!canSubmit && (
                  <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-3 text-[12px] text-[var(--ink-700)]">
                    <AlertTriangle className="mr-1 inline h-3 w-3 text-[var(--amber-500)]" />
                    Add at least one received line, a signed-by name, and a signature before submitting.
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}