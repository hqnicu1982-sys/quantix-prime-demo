import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Layers, Wand2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  BOARD_CHOICES, type BoardChoice, type BespokeBuildUp, type StudType, type StudSize, type StudCentres, type Insulation,
  type BespokeSystem, saveBespoke, describeBuildUp, buildUpToMaterials,
} from "@/lib/bespokeSystems";

type Parent = {
  code: string;
  shortName: string;
  // Best-effort seed values from a library system
  seed: BespokeBuildUp;
};

export function BespokeBuildUpDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  parent,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectName: string;
  parent: Parent;
  onCreated: (sys: BespokeSystem) => void;
}) {
  const [name, setName] = useState(`Bespoke — ${parent.shortName}`);
  const [b, setB] = useState<BespokeBuildUp>(parent.seed);

  // Re-seed when parent changes (user picked a different starting point)
  useEffect(() => {
    setName(`Bespoke — ${parent.shortName}`);
    setB(parent.seed);
  }, [parent.code]);

  const setSideA = (next: BoardChoice[]) => setB({ ...b, sideA: next });
  const setSideB = (next: BoardChoice[]) => setB({ ...b, sideB: next });

  const onSave = () => {
    if (b.sideA.length === 0) {
      toast.error("Side A must have at least one board layer");
      return;
    }
    const created = saveBespoke(projectId, {
      parentCode: parent.code,
      parentShortName: parent.shortName,
      name: name.trim() || `Bespoke — ${parent.shortName}`,
      buildUp: b,
    });
    onCreated(created);
    toast.success("Bespoke system saved", { description: `${created.id} added to ${projectName}` });
    onOpenChange(false);
  };

  const materials = buildUpToMaterials(b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[920px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[20px] tracking-tight">
            <Wand2 className="h-4 w-4 text-[var(--accent-500)]" />
            Customise build-up
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Forked from <span className="font-mono-num font-semibold text-[var(--ink-900)]">{parent.code}</span> · {parent.shortName}.
            Saved per project ({projectName}). Performance ratings are <strong>not</strong> carried over — submit the spec to British Gypsum for re-certification.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[1fr_300px]">
          {/* Editor */}
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[var(--ink-200)] bg-[var(--card)] px-3 py-2 text-[13px]"
              />
            </div>

            <LayerStack title="Side A (room face)" layers={b.sideA} onChange={setSideA} />

            {/* Frame */}
            <div className="rounded-lg border border-[var(--ink-200)] p-4">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
                <Layers className="h-3.5 w-3.5 text-[var(--accent-500)]" /> Frame
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Picker label="Stud type" value={b.studType} options={["C-Stud", "I-Stud"]} onChange={(v) => setB({ ...b, studType: v as StudType })} />
                <Picker label="Stud size (mm)" value={String(b.studSize)} options={["48", "70", "92", "146"]} onChange={(v) => setB({ ...b, studSize: +v as StudSize })} />
                <Picker label="Centres (mm)" value={String(b.studCentres)} options={["400", "600"]} onChange={(v) => setB({ ...b, studCentres: +v as StudCentres })} />
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={b.resilientBars}
                  onChange={(e) => setB({ ...b, resilientBars: e.target.checked })}
                  className="h-3.5 w-3.5 accent-[var(--accent-500)]"
                />
                <span>Add resilient bars (one face)</span>
              </label>
            </div>

            {/* Insulation */}
            <div className="rounded-lg border border-[var(--ink-200)] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Cavity insulation</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Picker
                  label="Type"
                  value={b.insulation.kind}
                  options={["none", "isover-apr", "rockwool-rw3"]}
                  onChange={(v) => {
                    const kind = v as Insulation["kind"];
                    if (kind === "none") setB({ ...b, insulation: { kind: "none" } });
                    else if (kind === "isover-apr") setB({ ...b, insulation: { kind, thicknessMm: 50 } });
                    else setB({ ...b, insulation: { kind, thicknessMm: 75 } });
                  }}
                  format={(v) => v === "none" ? "None" : v === "isover-apr" ? "Isover APR (acoustic)" : "Rockwool RW3 (thermal/acoustic)"}
                />
                {b.insulation.kind !== "none" && (
                  <Picker
                    label="Thickness (mm)"
                    value={String(b.insulation.thicknessMm)}
                    options={b.insulation.kind === "isover-apr" ? ["25", "50", "75"] : ["50", "75", "100"]}
                    onChange={(v) => {
                      const t = +v;
                      if (b.insulation.kind === "isover-apr") setB({ ...b, insulation: { kind: "isover-apr", thicknessMm: t as 25 | 50 | 75 } });
                      else if (b.insulation.kind === "rockwool-rw3") setB({ ...b, insulation: { kind: "rockwool-rw3", thicknessMm: t as 50 | 75 | 100 } });
                    }}
                  />
                )}
              </div>
            </div>

            <LayerStack title="Side B (back face — empty for linings)" layers={b.sideB} onChange={setSideB} allowEmpty />

            <div className="flex items-start gap-2 rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/8 p-3 text-[12px] text-[var(--ink-700)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--amber-500)]" />
              <p>
                Bespoke build-ups <strong>do not carry SpecSure®</strong>. Use this to plan materials and call-offs. For a real fire/acoustic rating, send the build-up to BG technical for re-certification.
              </p>
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-3 rounded-lg border border-[var(--ink-200)] bg-[var(--ink-50)]/50 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Build-up summary</p>
            <p className="text-[12px] leading-relaxed text-[var(--ink-900)]">{describeBuildUp(b)}</p>

            <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Materials per m² (preview)</p>
            <ul className="divide-y divide-[var(--ink-200)] text-[11.5px]">
              {materials.map((m) => (
                <li key={m.item} className="flex justify-between gap-2 py-1.5">
                  <span className="truncate text-[var(--ink-700)]">{m.item}</span>
                  <span className="font-mono-num shrink-0 font-semibold">{m.qty.toFixed(2)} <span className="text-[var(--ink-500)]">{m.unit}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save bespoke system</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LayerStack({
  title, layers, onChange, allowEmpty,
}: {
  title: string; layers: BoardChoice[]; onChange: (next: BoardChoice[]) => void; allowEmpty?: boolean;
}) {
  const addLayer = () => {
    if (layers.length >= 3) return;
    onChange([...layers, layers[0] ?? "Gyproc WallBoard 12.5"]);
  };
  return (
    <div className="rounded-lg border border-[var(--ink-200)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">{title}</p>
        <Button size="sm" variant="outline" onClick={addLayer} disabled={layers.length >= 3} className="h-7 text-[11px]">
          <Plus className="mr-1 h-3 w-3" /> Add layer
        </Button>
      </div>
      {layers.length === 0 ? (
        <p className="rounded border border-dashed border-[var(--ink-200)] px-3 py-4 text-center text-[11.5px] text-[var(--ink-500)]">
          {allowEmpty ? "No boards on this side (lining only)." : "Add at least one board layer."}
        </p>
      ) : (
        <div className="space-y-2">
          {layers.map((board, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono-num inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-500)]/15 text-[10px] font-bold text-[var(--accent-500)]">
                {i + 1}
              </span>
              <select
                value={board}
                onChange={(e) => {
                  const next = [...layers];
                  next[i] = e.target.value as BoardChoice;
                  onChange(next);
                }}
                className="flex-1 rounded-md border border-[var(--ink-200)] bg-[var(--card)] px-3 py-1.5 text-[12.5px]"
              >
                {BOARD_CHOICES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <button
                type="button"
                onClick={() => onChange(layers.filter((_, idx) => idx !== i))}
                className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--red-500)]/10 hover:text-[var(--red-500)]"
                aria-label="Remove layer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Picker({
  label, value, options, onChange, format,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; format?: (v: string) => string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--ink-200)] bg-[var(--card)] px-3 py-1.5 text-[12.5px]"
      >
        {options.map((o) => <option key={o} value={o}>{format ? format(o) : o}</option>)}
      </select>
    </div>
  );
}
