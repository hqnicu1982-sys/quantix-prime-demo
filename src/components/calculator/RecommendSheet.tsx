import * as React from "react";
import { ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { LIBRARY, type SystemDef } from "@/lib/systemLibrary";

/**
 * Recommend sheet — extracted from the old in-page "Match by requirements"
 * fold-out. Same fields, now lives in a right-side drawer so the canvas stays
 * clean. On submit it picks the best match from the active category and hands
 * the code back via onPick.
 */
export function RecommendSheet({
  open, onOpenChange, systems, onPick,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  systems: SystemDef[];
  onPick: (code: string) => void;
}) {
  const [minH, setMinH] = React.useState("");
  const [minRw, setMinRw] = React.useState("");
  const [minFire, setMinFire] = React.useState("");
  const [maxThk, setMaxThk] = React.useState("");

  const onSubmit = () => {
    // Filter active list by the constraints, then pick the lightest weight.
    const minHmm = (+minH || 0) * 1000;
    const minRwN = +minRw || 0;
    const minFireN = +minFire || 0;
    const candidates = systems.filter(s =>
      s.perf.maxHeight >= minHmm &&
      s.perf.rw >= minRwN &&
      s.perf.fire >= minFireN,
    );
    const pool = candidates.length ? candidates : systems;
    const best = pool.slice().sort((a, b) => (a.perf.weight || 999) - (b.perf.weight || 999))[0]
      ?? LIBRARY[0];
    onPick(best.code);
    onOpenChange(false);
    toast.success("Loaded best match", { description: `${best.code} · ${best.shortName}` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[var(--accent-500)]" />
            Match by requirements
          </SheetTitle>
          <SheetDescription>
            Tell us the performance you need and we'll load the best system in the active category.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4">
          <SheetField label="Min height" unit="m" value={minH} onChange={setMinH} placeholder="3.6" />
          <SheetField label="Min Rw"     unit="dB" value={minRw} onChange={setMinRw} placeholder="50" />
          <SheetField label="Min Fire"   unit="min" value={minFire} onChange={setMinFire} placeholder="60" />
          <SheetField label="Max thickness" unit="mm" value={maxThk} onChange={setMaxThk} placeholder="150" />

          <SheetSelect label="Duty rating" options={["Any","SD1","SD2","SD3","SD4"]} />
          <SheetSelect label="Board type"  options={["Any","WallBoard","DuraLine","SoundBloc","FireLine"]} />
          <SheetSelect label="Stud size"   options={["Any","48","70","92","146"]} />

          <Button className="mt-2 w-full gap-1.5" onClick={onSubmit}>
            Recommend &amp; load <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetField({
  label, unit, value, onChange, placeholder,
}: {
  label: string; unit: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
        <span className="font-mono-num text-[10.5px] text-[var(--ink-500)]">{unit}</span>
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium"
      />
    </div>
  );
}

function SheetSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}