import { useEffect, useState } from "react";
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
import { Settings2, RotateCcw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  saveCallOffSettings,
  useCallOffSettings,
  type CallOffSettings,
} from "@/lib/callOffSettings";
import { useProjectData } from "@/lib/projectData";

/**
 * Gear button + dialog that lets the user tune the auto call-off rules.
 * All changes are saved to a per-project store and immediately re-evaluate
 * the proposals in the banner. Drafts still require explicit confirmation
 * in the review dialog.
 */
export function AutoCallOffSettingsDialog({ projectId }: { projectId: string }) {
  const saved = useCallOffSettings(projectId);
  const { boqLines } = useProjectData(projectId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CallOffSettings>(saved);

  // Re-seed the draft whenever the dialog opens with the latest persisted
  // values, so unsaved tweaks don't leak across opens.
  useEffect(() => {
    if (open) setDraft(saved);
  }, [open, saved]);

  const materials = Array.from(new Set(boqLines.map((l) => l.material))).sort();
  const overrideEntries = Object.entries(draft.perMaterialLeadDays);

  const setNum = (k: keyof Omit<CallOffSettings, "perMaterialLeadDays">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      setDraft((d) => ({ ...d, [k]: Number.isFinite(n) && n >= 0 ? n : 0 }));
    };

  const addOverride = (material: string) => {
    if (!material || draft.perMaterialLeadDays[material] != null) return;
    setDraft((d) => ({
      ...d,
      perMaterialLeadDays: { ...d.perMaterialLeadDays, [material]: d.defaultLeadDays },
    }));
  };
  const updateOverride = (material: string, days: number) => {
    setDraft((d) => ({
      ...d,
      perMaterialLeadDays: { ...d.perMaterialLeadDays, [material]: Math.max(0, days) },
    }));
  };
  const removeOverride = (material: string) => {
    setDraft((d) => {
      const next = { ...d.perMaterialLeadDays };
      delete next[material];
      return { ...d, perMaterialLeadDays: next };
    });
  };

  const save = () => {
    saveCallOffSettings(projectId, draft);
    toast.success("Call-off rules updated", {
      description: "Proposals re-evaluated — drafts still require your confirmation.",
    });
    setOpen(false);
  };

  const reset = () => setDraft(DEFAULT_SETTINGS);

  const availableMaterials = materials.filter((m) => draft.perMaterialLeadDays[m] == null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" title="Configure call-off rules">
          <Settings2 className="mr-1 h-3.5 w-3.5" /> Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Call-off generation rules</DialogTitle>
          <DialogDescription>
            Tune when and how draft call-offs are proposed. Nothing is sent automatically —
            every batch still requires your confirmation in the review dialog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <section className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Default lead time (days)"
              hint="Used when a BoQ line has no lead time of its own."
              value={draft.defaultLeadDays}
              onChange={setNum("defaultLeadDays")}
            />
            <NumberField
              label="Safety buffer (days)"
              hint="Added on top of lead time when computing send-by date."
              value={draft.bufferDays}
              onChange={setNum("bufferDays")}
            />
            <NumberField
              label="Coalesce window (days)"
              hint="Needs to the same supplier within this many days are batched."
              value={draft.coalesceWindowDays}
              onChange={setNum("coalesceWindowDays")}
            />
            <NumberField
              label="Imminent threshold (days)"
              hint='Send-by within this window shows the "imminent" amber badge.'
              value={draft.urgencyImminentDays}
              onChange={setNum("urgencyImminentDays")}
            />
            <NumberField
              label="Reorder point (min qty per batch)"
              hint="Skip proposals whose total qty stays below this. 0 disables the filter."
              value={draft.minBatchQty}
              onChange={setNum("minBatchQty")}
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[var(--ink-900)]">
                  Per-material lead time overrides
                </p>
                <p className="text-[11px] text-[var(--ink-500)]">
                  Overrides the BoQ line's lead time for the matching material name.
                </p>
              </div>
            </div>

            <ul className="space-y-1.5">
              {overrideEntries.map(([material, days]) => (
                <li
                  key={material}
                  className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--ink-900)]">
                    {material}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={days}
                    onChange={(e) => updateOverride(material, Number(e.target.value))}
                    className="h-7 w-[80px] text-[12px]"
                  />
                  <span className="text-[11px] text-[var(--ink-500)]">days</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => removeOverride(material)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
              {overrideEntries.length === 0 && (
                <li className="rounded-md border border-dashed border-[var(--ink-200)] px-2 py-3 text-center text-[11px] text-[var(--ink-500)]">
                  No per-material overrides yet.
                </li>
              )}
            </ul>

            {availableMaterials.length > 0 && (
              <AddOverrideRow materials={availableMaterials} onAdd={addOverride} />
            )}
            {materials.length === 0 && (
              <p className="mt-2 text-[11px] text-[var(--ink-500)]">
                Add systems via the Calculator to populate material options.
              </p>
            )}
          </section>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={reset} className="text-[11px]">
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset to defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save rules</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-semibold text-[var(--ink-900)]">{label}</span>
      <Input type="number" min={0} value={value} onChange={onChange} className="mt-1 h-8 text-[12px]" />
      <span className="mt-0.5 block text-[10.5px] text-[var(--ink-500)]">{hint}</span>
    </label>
  );
}

function AddOverrideRow({
  materials,
  onAdd,
}: {
  materials: string[];
  onAdd: (material: string) => void;
}) {
  const [pick, setPick] = useState<string>(materials[0] ?? "");
  useEffect(() => {
    if (!materials.includes(pick)) setPick(materials[0] ?? "");
  }, [materials, pick]);
  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        className="h-7 flex-1 rounded-md border border-[var(--ink-200)] bg-white px-2 text-[12px]"
      >
        {materials.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-[11px]"
        disabled={!pick}
        onClick={() => onAdd(pick)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add override
      </Button>
    </div>
  );
}