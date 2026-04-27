import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHead, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Check, Search, Sparkles, Download, Info, Layers, Ruler, Flame, Volume2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({ component: Calculator });

// ---------- Domain data (Wall Lining demo, drawn from the user's screenshots) ----------

type Family = {
  id: string;
  name: string;
  blurb: string;
  status: "live" | "beta" | "roadmap";
};

const families: Family[] = [
  { id: "walls",    name: "Partitions & Walls", blurb: "Internal partition systems.",      status: "live" },
  { id: "lining",   name: "Wall Linings",       blurb: "Independent & direct linings.",   status: "live" },
  { id: "shaft",    name: "Shaftwalls",         blurb: "Fire rated systems.",              status: "live" },
  { id: "steel",    name: "Steel Protection",   blurb: "Board & coating fire protection.", status: "roadmap" },
  { id: "ceilings", name: "Ceilings",           blurb: "MF ceilings and horizontal shaftwalls.", status: "beta" },
  { id: "floors",   name: "Floors",             blurb: "Floating and acoustic floors.",   status: "roadmap" },
  { id: "external", name: "External Walls",     blurb: "Lightweight external wall systems.", status: "roadmap" },
  { id: "plasters", name: "Plasters",           blurb: "Skim & undercoat plaster systems.", status: "roadmap" },
];

// Demo system referenced throughout (matches the user's screenshots)
const systemRef = "GIWL-146-I-80-1L-DL15 (B)";
const systemDesc =
  "One layer of Gyproc DuraLine 15mm to one side of Gypframe 146 | 80 'I' Stud framework forming an independent lining where there is no requirement to satisfy any performance criteria. For heights up to 7200mm.";

const buildUp = [
  { k: "Board type",          v: "Gyproc DuraLine" },
  { k: "Board thickness (mm)", v: "15" },
  { k: "Layers / Side",        v: "1 - 0" },
  { k: "Board size used",      v: "1200 × 2400" },
  { k: "Suggested stud length",v: "4.2 m" },
];

const performance = [
  { icon: <Volume2 className="h-3 w-3" />, label: "Approx. weight (kg/m²)", v: "14" },
  { icon: <Ruler  className="h-3 w-3" />, label: "Max Height (mm)",        v: "7200" },
  { icon: <Layers className="h-3 w-3" />, label: "Stud Centres (mm)",      v: "600" },
];

// Aggregated BoQ — demo numbers (length 50m × height 4m, 5% waste)
const totals = [
  { item: "Gypframe Stud (4.2m)",                                    qty: 84,   unit: "lengths" },
  { item: "Gypframe 62 FEC 50 Folded Edge Standard Floor & Ceiling Channel (3.6m)", qty: 28, unit: "lengths" },
  { item: "Gypframe 99 FC 50",                                       qty: 14,   unit: "lengths" },
  { item: "Gypframe GFS1",                                           qty: 100,  unit: "lm" },
  { item: "Jointing",                                                qty: 168,  unit: "kg" },
  { item: "Sealant",                                                 qty: 2500, unit: "ml" },
];

// ---------- Component ----------

function Calculator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"code" | "recommend">("code");
  const [family, setFamily] = useState<string>("lining");

  return (
    <Section
      title="BG System Wall Lining Calculator"
      subtitle="Quantify a complete British Gypsum build-up — frame, board and ancillaries — from one system reference."
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast.success("Saved", { description: systemRef })}>Save estimate</Button>
          <Button size="sm" onClick={() => { toast.success("Added to BoQ"); navigate({ to: "/costed-boq" }); }}>Add to BoQ</Button>
        </>
      }
    >
      {/* Mode tabs */}
      <div className="inline-flex rounded-full border border-[var(--ink-200)] bg-card p-1">
        <button
          onClick={() => setMode("code")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            mode === "code" ? "bg-[var(--accent-500)] text-white shadow-sm" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
          }`}
        >
          <Search className="h-3.5 w-3.5" /> By System Code
        </button>
        <button
          onClick={() => setMode("recommend")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            mode === "recommend" ? "bg-[var(--accent-500)] text-white shadow-sm" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Recommend by Requirements
        </button>
      </div>

      {mode === "recommend" && (
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Guided selection</p>
          <p className="mt-1 text-[13px] text-[var(--ink-700)]">
            Describe your performance requirements — we'll match the right BG system. Empty fields won't constrain results.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {families.filter(f => f.status !== "roadmap").map(f => (
              <button
                key={f.id}
                onClick={() => setFamily(f.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  family === f.id
                    ? "bg-[var(--ink-900)] text-white"
                    : "border border-[var(--ink-200)] bg-card text-[var(--ink-700)] hover:border-[var(--ink-900)]"
                }`}
              >{f.name}</button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <ReqField label="Min height (m)" placeholder="e.g. 3.6" />
            <ReqField label="Min Rw (dB)"    placeholder="e.g. 50" />
            <ReqField label="Min Fire (min)" placeholder="e.g. 60" />
            <ReqField label="Max thickness (mm)" placeholder="e.g. 150" />
            <ReqSelect label="Duty rating" options={["Any","SD1","SD2","SD3","SD4"]} />
            <ReqSelect label="Board type"  options={["Any","WallBoard","DuraLine","SoundBloc","FireLine","Glasroc F"]} />
            <ReqSelect label="Stud size"   options={["Any","48","70","92","146"]} />
            <div className="flex items-end">
              <Button className="w-full" onClick={() => toast.success("3 systems matched", { description: "Switch to By System Code to load." })}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommend systems
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Two-column working area */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT — Calculator inputs */}
        <Card>
          <CardHead title="Calculator Inputs" subtitle="Type a code and press Load. Data comes from the live System Catalog." />
          <div className="space-y-4 p-5 text-[13px]">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System Reference</p>
              <div className="flex gap-2">
                <input
                  defaultValue={systemRef}
                  className="font-mono-num flex-1 rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] font-semibold focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20"
                />
                <Button variant="outline" size="sm" onClick={() => toast.success("System loaded", { description: systemRef })}>Load</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Length (m)" value="50" />
              <Field label="Height (m)" value="4" />
              <ReqSelect label="Stud Centres" options={["400mm","600mm","Other"]} defaultValue="600mm" />
              <ReqSelect label="Board Size"   options={["1200 × 2400","1200 × 3000","900 × 1800"]} defaultValue="1200 × 2400" />
              <ReqSelect label="Finish" options={["Tape & Joint","Skim","Direct decorate"]} defaultValue="Tape & Joint" />
              <ReqSelect label="Stage"  options={["Both","Frame only","Board only"]} defaultValue="Both" />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Waste % (5%)</p>
                <span className="font-mono-num text-[12px] font-semibold text-[var(--ink-900)]">5</span>
              </div>
              <input type="range" min={0} max={20} defaultValue={5} className="w-full accent-[var(--accent-500)]" />
            </div>

            <Button className="w-full" size="lg" onClick={() => toast.success("BoQ calculated", { description: `${systemRef} · 84 studs · 168 kg jointing` })}>
              Calculate BoQ
            </Button>

            {/* Loaded system reference card */}
            <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] p-4">
              <p className="font-mono-num text-[11.5px] font-semibold text-[var(--accent-500)]">{systemRef}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-700)]">{systemDesc}</p>
              <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
                <Spec label="RW"     v="—"    sub="airborne" />
                <Spec label="FIRE"   v="—"    sub="EN 1364-1" />
                <Spec label="DUTY"   v="—"    sub="impact" />
                <Spec label="CENTRES" v="600 m" sub="standard" />
                <Spec label="MAX HEIGHT" v="7.2 m" sub="engineered" />
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT — Summary */}
        <div className="space-y-5">
          <Card>
            <CardHead title="Summary" />
            <div className="space-y-4 p-5">
              <div>
                <p className="font-mono-num text-[11px] font-semibold text-[var(--accent-500)]">{systemRef}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-900)]">{systemDesc}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {performance.map(p => (
                  <div key={p.label} className="rounded-md border border-[var(--ink-200)] bg-card p-3">
                    <p className="flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                      {p.icon} {p.label}
                    </p>
                    <p className="font-mono-num mt-1 text-[18px] font-semibold text-[var(--ink-900)]">{p.v}</p>
                  </div>
                ))}
              </div>

              {/* System build-up */}
              <div className="overflow-hidden rounded-md border border-[var(--ink-200)]">
                <div className="border-b border-[var(--ink-200)] bg-[var(--ink-50)] px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">System build-up</p>
                </div>
                <div className="divide-y divide-[var(--ink-200)] text-[12.5px]">
                  {buildUp.map(b => (
                    <div key={b.k} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[var(--ink-500)]">{b.k}</span>
                      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{b.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregated totals */}
              <div className="overflow-hidden rounded-md border border-[var(--ink-200)]">
                <div className="border-b border-[var(--ink-200)] bg-[var(--ink-50)] px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Aggregated totals</p>
                </div>
                <div className="divide-y divide-[var(--ink-200)] text-[12.5px]">
                  {totals.map(t => (
                    <div key={t.item} className="flex items-start justify-between gap-4 px-4 py-2.5">
                      <span className="text-[var(--ink-900)]">{t.item}</span>
                      <span className="font-mono-num shrink-0 font-semibold text-[var(--ink-900)]">
                        {t.qty.toLocaleString()} <span className="font-normal text-[var(--ink-500)]">{t.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => toast.success("BoQ exported", { description: `${systemRef} · CSV ready` })}>
                <Download className="mr-1.5 h-4 w-4" /> Export BoQ
              </Button>
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-4 text-[12.5px] text-[var(--ink-900)]">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" />
            <p><strong>SpecSure®</strong> applies when genuine BG components and details are followed.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- helpers ----------

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input className="w-full rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] font-medium focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20" defaultValue={value} />
    </div>
  );
}

function ReqField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input placeholder={placeholder} className="w-full rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] placeholder:text-[var(--ink-500)] focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20" />
    </div>
  );
}

function ReqSelect({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select defaultValue={defaultValue} className="w-full rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] font-medium focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Spec({ label, v, sub }: { label: string; v: string; sub: string }) {
  return (
    <div className="rounded border border-[var(--ink-200)] bg-card p-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className="font-mono-num mt-0.5 text-[12px] font-bold text-[var(--ink-900)]">{v}</p>
      <p className="text-[9px] text-[var(--ink-500)]">{sub}</p>
    </div>
  );
}
