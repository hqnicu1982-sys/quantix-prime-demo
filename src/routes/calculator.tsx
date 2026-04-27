import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search, Sparkles, Download, Shield, Layers, Ruler, Volume2, Flame,
  ArrowRight, Wand2, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({ component: Calculator });

// ---- Demo BG system (matches the user's screenshots) ----
const systemRef  = "GIWL-146-I-80-1L-DL15 (B)";
const systemDesc =
  "One layer of Gyproc DuraLine 15mm to one side of Gypframe 146 | 80 'I' Stud framework forming an independent lining where there is no requirement to satisfy any performance criteria. For heights up to 7200mm.";

const buildUp = [
  { k: "Board type",            v: "Gyproc DuraLine" },
  { k: "Board thickness (mm)",  v: "15" },
  { k: "Layers / Side",         v: "1 — 0" },
  { k: "Board size used",       v: "1200 × 2400" },
  { k: "Suggested stud length", v: "4.2 m" },
];

const performance = [
  { icon: <Volume2 className="h-3 w-3" />, k: "Approx. weight",  v: "14 kg/m²" },
  { icon: <Ruler   className="h-3 w-3" />, k: "Max Height",      v: "7200 mm" },
  { icon: <Layers  className="h-3 w-3" />, k: "Stud Centres",    v: "600 mm" },
];

const totals = [
  { item: "Gypframe Stud (4.2m)",                                                 qty: 84,   unit: "lengths" },
  { item: "Gypframe 62 FEC 50 Folded Edge Floor & Ceiling Channel (3.6m)",        qty: 28,   unit: "lengths" },
  { item: "Gypframe 99 FC 50",                                                    qty: 14,   unit: "lengths" },
  { item: "Gypframe GFS1",                                                        qty: 100,  unit: "lm" },
  { item: "Jointing",                                                             qty: 168,  unit: "kg" },
  { item: "Sealant",                                                              qty: 2500, unit: "ml" },
];

function Calculator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"code" | "recommend">("code");
  const [length, setLength] = useState("50");
  const [height, setHeight] = useState("4");
  const [waste, setWaste]   = useState(5);

  return (
    <div className="glass-bg -m-6 min-h-[calc(100vh-4rem)] p-6 md:-m-8 md:p-10">
      <div className="relative space-y-8">
        {/* Hero */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono-num flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--ink-500)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)] shadow-[0_0_12px_var(--accent-500)]" />
              BG System Calculator
            </p>
            <h1 className="font-display mt-3 text-[44px] font-semibold leading-[0.95] tracking-tight text-[var(--ink-900)] md:text-[60px]">
              From a code to a<br />
              <span className="italic text-[var(--accent-500)]">priced BoQ</span>.
            </h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--ink-700)]">
              Load any British Gypsum system — set the area — get the full build-up: frame, board, jointing and ancillaries.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="glass-card inline-flex rounded-full p-1">
            <button
              onClick={() => setMode("code")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
                mode === "code" ? "bg-[var(--accent-500)] text-white shadow-sm" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
              }`}
            >
              <Search className="h-3.5 w-3.5" /> By code
            </button>
            <button
              onClick={() => setMode("recommend")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
                mode === "recommend" ? "bg-[var(--accent-500)] text-white shadow-sm" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Recommend
            </button>
          </div>
        </header>

        {/* Recommend bar (fold-out) */}
        {mode === "recommend" && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[var(--accent-500)]" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Match by requirements</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Field label="Min height (m)" placeholder="3.6" />
              <Field label="Min Rw (dB)"    placeholder="50" />
              <Field label="Min Fire (min)" placeholder="60" />
              <Field label="Max thickness (mm)" placeholder="150" />
              <Select label="Duty rating" options={["Any","SD1","SD2","SD3","SD4"]} />
              <Select label="Board type"  options={["Any","WallBoard","DuraLine","SoundBloc","FireLine"]} />
              <Select label="Stud size"   options={["Any","48","70","92","146"]} />
              <div className="flex items-end">
                <Button className="w-full gap-1.5" onClick={() => { setMode("code"); toast.success("Loaded best match", { description: systemRef }); }}>
                  Recommend & load <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Two columns: inputs (wide) + sticky summary */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* LEFT — inputs */}
          <main className="space-y-6">
            {/* System reference */}
            <section className="glass-card rounded-2xl p-6">
              <SectionTitle n="01" label="System reference" />
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[280px] flex-1">
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System code</p>
                  <input
                    defaultValue={systemRef}
                    className="glass-input font-mono-num w-full rounded-xl px-4 py-3 text-[14px] font-semibold"
                  />
                </div>
                <Button variant="outline" size="lg" onClick={() => toast.success("System loaded", { description: systemRef })}>
                  Load
                </Button>
              </div>
              <p className="mt-3 text-[12px] text-[var(--ink-500)]">
                Type a code and press Load. Data comes from the live System Catalog.
              </p>

              {/* Loaded preview row */}
              <div className="mt-5 rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-4">
                <p className="text-[12.5px] leading-relaxed text-[var(--ink-900)]">{systemDesc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {performance.map(p => (
                    <span key={p.k} className="glass-card inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px]">
                      <span className="text-[var(--accent-500)]">{p.icon}</span>
                      <span className="text-[var(--ink-500)]">{p.k}</span>
                      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{p.v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Geometry */}
            <section className="glass-card rounded-2xl p-6">
              <SectionTitle n="02" label="Geometry & finish" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Length (m)" value={length} onChange={setLength} />
                <Field label="Height (m)" value={height} onChange={setHeight} />
                <Select label="Stud Centres" options={["400 mm","600 mm","Other"]} defaultValue="600 mm" />
                <Select label="Board Size"   options={["1200 × 2400","1200 × 3000","900 × 1800"]} defaultValue="1200 × 2400" />
                <Select label="Finish" options={["Tape & Joint","Skim","Direct decorate"]} defaultValue="Tape & Joint" />
                <Select label="Stage"  options={["Both","Frame only","Board only"]} defaultValue="Both" />
              </div>

              {/* Waste slider */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Waste %</p>
                  <span className="font-mono-num rounded-md bg-[var(--accent-500)]/10 px-2 py-0.5 text-[12px] font-semibold text-[var(--accent-500)]">{waste}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={waste}
                  onChange={e => setWaste(+e.target.value)}
                  className="w-full accent-[var(--accent-500)]"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="lg" className="flex-1 min-w-[200px] gap-2" onClick={() => toast.success("BoQ calculated", { description: `${systemRef} · ${+length * +height} m²` })}>
                  <Sparkles className="h-4 w-4" /> Calculate BoQ
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setLength("50"); setHeight("4"); setWaste(5); toast("Reset to defaults"); }}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Compliance ribbon */}
            <div className="glass-card flex items-start gap-3 rounded-2xl p-4 text-[12.5px] text-[var(--ink-900)]">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" />
              <p><strong>SpecSure®</strong> applies when genuine BG components and details are followed.</p>
            </div>
          </main>

          {/* RIGHT — sticky summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass-card glass-card-strong overflow-hidden rounded-2xl">
              {/* header */}
              <div className="border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Live summary</p>
                <p className="font-mono-num mt-1 text-[12px] font-semibold text-[var(--accent-500)]">{systemRef}</p>
              </div>

              {/* Headline */}
              <div className="border-b border-[var(--ink-200)]/60 px-5 py-5">
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Wall area</p>
                <p className="font-display mt-1 text-[34px] font-bold leading-none tracking-tight text-[var(--ink-900)]">
                  {(+length * +height).toLocaleString()}<span className="ml-1 text-[16px] font-medium text-[var(--ink-500)]">m²</span>
                </p>
                <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                  {length} m × {height} m · waste {waste}%
                </p>
              </div>

              {/* Build-up */}
              <div className="border-b border-[var(--ink-200)]/60 px-5 py-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System build-up</p>
                <ul className="mt-2 divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
                  {buildUp.map(b => (
                    <li key={b.k} className="flex items-center justify-between py-2">
                      <span className="text-[var(--ink-500)]">{b.k}</span>
                      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{b.v}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Aggregated totals */}
              <div className="px-5 py-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Aggregated totals</p>
                <ul className="mt-2 divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
                  {totals.map(t => (
                    <li key={t.item} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="text-[var(--ink-900)]">{t.item}</span>
                      <span className="font-mono-num shrink-0 font-semibold text-[var(--ink-900)]">
                        {t.qty.toLocaleString()}{" "}
                        <span className="font-normal text-[var(--ink-500)]">{t.unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer actions */}
              <div className="space-y-2 border-t border-[var(--ink-200)]/60 bg-[var(--ink-50)]/40 p-4">
                <Button className="w-full gap-2" size="lg" onClick={() => toast.success("BoQ exported", { description: "CSV ready" })}>
                  <Download className="h-4 w-4" /> Export BoQ
                </Button>
                <Button className="w-full" variant="outline" onClick={() => { toast.success("Added to project BoQ"); navigate({ to: "/costed-boq" }); }}>
                  Add to Costed BoQ
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----
function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono-num inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-900)] text-[11px] font-bold text-white">{n}</span>
      <h2 className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">{label}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange?: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium placeholder:text-[var(--ink-500)]"
      />
    </div>
  );
}

function Select({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select defaultValue={defaultValue} className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
