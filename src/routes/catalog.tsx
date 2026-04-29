import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check, Sparkles, ArrowRight, Search, SlidersHorizontal,
  Layers, Volume2, Flame, Ruler, GitCompare,
  Building2, PanelTop, Shield, Grid3x3, Box, Hammer, Wind, Brush,
} from "lucide-react";
import { toast } from "sonner";
import { pushToTray } from "@/lib/compareTray";
import { fireTier, acousticTier, heightTier, thicknessTier, bestTier, tierColorVar, type Tier } from "@/lib/impact";
import { findSystem, scaledTotals } from "@/lib/systemLibrary";
import { estimateCost } from "@/lib/calculatorPricing";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/catalog")({ component: GuardedCatalog });

function GuardedCatalog() {
  const allowed = useCan("view.priceIntel");
  if (!allowed) return <NoAccess cap="view.priceIntel" title="Catalog restricted" />;
  return <Catalog />;
}

// ---- Domain ----
type Family = { id: string; name: string; blurb: string; status: "live" | "beta" | "roadmap"; icon: React.ComponentType<{ className?: string }> };

const families: Family[] = [
  { id: "walls",    name: "Partitions & Walls", blurb: "Internal partition systems",          status: "live",    icon: Building2 },
  { id: "lining",   name: "Wall Linings",       blurb: "Independent & direct linings",        status: "live",    icon: PanelTop  },
  { id: "shaft",    name: "Shaftwalls",         blurb: "Fire rated systems",                  status: "live",    icon: Shield    },
  { id: "ceilings", name: "Ceilings",           blurb: "MF ceilings & horizontal shaftwalls", status: "beta",    icon: Grid3x3   },
  { id: "steel",    name: "Steel Protection",   blurb: "Board & coating fire protection",     status: "roadmap", icon: Box       },
  { id: "floors",   name: "Floors",             blurb: "Floating & acoustic floors",          status: "roadmap", icon: Hammer    },
  { id: "external", name: "External Walls",     blurb: "Lightweight external systems",        status: "roadmap", icon: Wind      },
  { id: "plasters", name: "Plasters",           blurb: "Skim & undercoat plasters",           status: "roadmap", icon: Brush     },
];

const allMatches = [
  { code: "GIWL-146-I-80-1L-DL15 (B)", name: "Independent lining · DuraLine 15",        family: "lining",  height: 7.2, fire: 0,   rw: 0,  centres: 600, thick: 161 },
  { code: "GIWL-92-C-50-2L-WB12.5",    name: "Independent lining · 2× WallBoard 12.5",  family: "lining",  height: 5.4, fire: 60,  rw: 44, centres: 600, thick: 117 },
  { code: "GDWL-DL15-1L",              name: "Direct lining · DuraLine 15 (dabs)",      family: "lining",  height: 3.6, fire: 0,   rw: 0,  centres: 0,   thick: 35  },
  { code: "C-48/70-1L-WB15",           name: "GypWall CLASSIC · WallBoard 15",          family: "walls",   height: 4.2, fire: 60,  rw: 43, centres: 600, thick: 100 },
  { code: "C-92/146-2L-SB",            name: "GypWall QUIET · SoundBloc",               family: "walls",   height: 5.8, fire: 60,  rw: 63, centres: 600, thick: 176 },
  { code: "S-CW-120",                  name: "ShaftWall S-CW · 120 min",                family: "shaft",   height: 8.1, fire: 120, rw: 52, centres: 600, thick: 130 },
  { code: "MF-CASOLINE",               name: "CasoLine MF ceiling",                     family: "ceilings", height: 0,  fire: 30,  rw: 37, centres: 0,   thick: 28  },
];

function Catalog() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string>("lining");
  const [q, setQ] = useState("");
  const [minH, setMinH] = useState("");
  const [minRw, setMinRw] = useState("");
  const [minFire, setMinFire] = useState("");
  const [maxThick, setMaxThick] = useState("");
  const [duty, setDuty] = useState("Any");
  const [board, setBoard] = useState("Any");
  const [stud, setStud] = useState("Any");
  const [sort, setSort] = useState<"best"|"height"|"thick"|"price">("best");

  // Per-m² cost lookup (where we have a quantity build-up in the shared library)
  const costFor = (code: string): { perM2: number; materials: number; labour: number; pricedRatio: number } | null => {
    const sys = findSystem(code);
    if (!sys) return null;
    const totals = scaledTotals(sys, 1, 1.05); // 1 m², 5 % waste — comparable across systems
    const c = estimateCost(totals, 1, 1.05);
    return {
      perM2: c.perM2,
      materials: c.materials,
      labour: c.labour,
      pricedRatio: c.totalLines > 0 ? c.pricedLines / c.totalLines : 0,
    };
  };

  const results = useMemo(() => {
    let r = allMatches.filter(m =>
      m.family === picked &&
      (!q || (m.code + " " + m.name).toLowerCase().includes(q.toLowerCase())) &&
      (!minH    || m.height >= +minH) &&
      (!minRw   || m.rw     >= +minRw) &&
      (!minFire || m.fire   >= +minFire) &&
      (!maxThick|| m.thick  <= +maxThick)
    );
    if (sort === "height") r = [...r].sort((a,b) => b.height - a.height);
    if (sort === "thick")  r = [...r].sort((a,b) => a.thick  - b.thick);
    if (sort === "price")  r = [...r].sort((a,b) => {
      const ca = costFor(a.code)?.perM2 ?? Infinity;
      const cb = costFor(b.code)?.perM2 ?? Infinity;
      return ca - cb;
    });
    return r;
  }, [picked, q, minH, minRw, minFire, maxThick, sort]);

  return (
    <div className="glass-bg -m-6 min-h-[calc(100vh-4rem)] p-6 md:-m-8 md:p-10">
      <div className="relative space-y-8">
        {/* Hero */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="pop-in">
            <p className="font-mono-num flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--ink-500)]">
              <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-[var(--accent-500)] shadow-[0_0_12px_var(--accent-500)]" />
              Guided Selection · BG Systems
            </p>
            <h1 className="font-display mt-3 text-[44px] font-semibold leading-[0.95] tracking-tight md:text-[60px]">
              <span className="hero-gradient-text">Choose a system —</span><br />
              <span className="italic text-[var(--accent-500)]">on your terms.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--ink-700)]">
              Pick a family, narrow by performance, and load the right BG build-up straight into the calculator.
            </p>
            {/* Tier legend */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[var(--ink-500)]">Impact coding</span>
              <span className="tier-chip" data-tier="critical"><span className="tier-dot" /> Critical</span>
              <span className="tier-chip" data-tier="high"><span className="tier-dot" /> High</span>
              <span className="tier-chip" data-tier="standard"><span className="tier-dot" /> Standard</span>
              <span className="tier-chip" data-tier="eco"><span className="tier-dot" /> Eco</span>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate({ to: "/calculator" })} className="gap-1.5">
            Open calculator <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </header>

        {/* Split layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* LEFT — family rail (sticky) */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass-card rounded-2xl p-3">
              <p className="px-2 pb-2 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                System type
              </p>
              <ul className="space-y-1">
                {families.map(f => {
                  const isPicked = picked === f.id;
                  const disabled = f.status === "roadmap";
                  const Icon = f.icon;
                  return (
                    <li key={f.id}>
                      <button
                        disabled={disabled}
                        onClick={() => setPicked(f.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                          disabled
                            ? "cursor-not-allowed opacity-45"
                            : isPicked
                            ? "bg-gradient-to-r from-[var(--accent-500)]/15 to-transparent ring-1 ring-[var(--accent-500)]/40"
                            : "hover:bg-[var(--ink-50)]"
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                          isPicked
                            ? "bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-white shadow-[0_8px_22px_-10px_var(--accent-500)]"
                            : "bg-[var(--ink-50)] text-[var(--ink-700)] group-hover:bg-[var(--card)]"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{f.name}</p>
                            <StatusDot s={f.status} />
                          </div>
                          <p className="mt-0.5 truncate text-[11.5px] text-[var(--ink-500)]">{f.blurb}</p>
                        </div>
                        {isPicked && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* RIGHT — filters + results */}
          <main className="space-y-6">
            {/* Filter bar */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[var(--accent-500)]" />
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Filters</p>
                <span className="ml-auto text-[11px] text-[var(--ink-500)]">Empty fields don't constrain</span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Min height (m)" placeholder="3.6" value={minH}    onChange={setMinH} />
                <Field label="Min Rw (dB)"    placeholder="50"  value={minRw}   onChange={setMinRw} />
                <Field label="Min Fire (min)" placeholder="60"  value={minFire} onChange={setMinFire} />
                <Field label="Max thickness (mm)" placeholder="150" value={maxThick} onChange={setMaxThick} />
                <SelectField label="Duty rating" value={duty}  onChange={setDuty}  options={["Any","SD1","SD2","SD3","SD4"]} />
                <SelectField label="Board type"  value={board} onChange={setBoard} options={["Any","WallBoard","DuraLine","SoundBloc","FireLine","Glasroc F"]} />
                <SelectField label="Stud size"   value={stud}  onChange={setStud}  options={["Any","48","70","92","146"]} />
                <div className="flex items-end">
                  <Button className="w-full gap-1.5" onClick={() => toast.success(`${results.length} systems matched`)}>
                    <Sparkles className="h-3.5 w-3.5" /> Recommend
                  </Button>
                </div>
              </div>
            </div>

            {/* Results header */}
            <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3">
              <div className="relative flex flex-1 items-center">
                <Search className="absolute left-3 h-4 w-4 text-[var(--ink-500)]" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search system code or name…"
                  className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-[13px] placeholder:text-[var(--ink-500)]"
                />
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[var(--ink-500)]">Sort</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as typeof sort)}
                  className="glass-input rounded-lg px-2.5 py-1.5 text-[12px] font-medium"
                >
                  <option value="best">Best match</option>
                  <option value="height">Tallest height</option>
                  <option value="thick">Thinnest build-up</option>
                  <option value="price">Cheapest £/m²</option>
                </select>
              </div>
              <span className="font-mono-num rounded-full bg-[var(--accent-500)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-500)]">
                {results.length} match{results.length === 1 ? "" : "es"}
              </span>
            </div>

            {/* Results grid */}
            {results.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <p className="font-display text-[22px] text-[var(--ink-700)]">Nothing matches.</p>
                <p className="mt-1 text-[12.5px] text-[var(--ink-500)]">Loosen a filter or try another family.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((m, i) => {
                  const tH = heightTier(m.height);
                  const tF = fireTier(m.fire);
                  const tR = acousticTier(m.rw);
                  const tT = thicknessTier(m.thick);
                  const top = bestTier(tF, tR, tH);
                  return (
                  <article
                    key={m.code}
                    className="glass-card lift-on-hover pop-in group relative overflow-hidden rounded-2xl p-5 hover:neon-ring"
                    style={{
                      // ribbon color picks up the highest-impact tier
                      ['--tier-color' as never]: tierColorVar(top),
                      animationDelay: `${i * 35}ms`,
                    }}
                  >
                    <span className="impact-ribbon" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">{m.code}</p>
                          {top !== "none" && (
                            <span className="tier-chip" data-tier={top}>
                              <span className="tier-dot" /> {top}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[15px] font-semibold leading-snug text-[var(--ink-900)]">{m.name}</p>
                      </div>
                      <button
                        onClick={() => { toast.success("Loaded into calculator", { description: m.code }); navigate({ to: "/calculator" }); }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ink-900)] to-[var(--navy-800)] text-white transition-all group-hover:scale-110 group-hover:shadow-[0_10px_24px_-8px_var(--accent-500)]"
                        aria-label="Load"
                      >
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <SpecChip icon={<Ruler   className="h-3 w-3" />} v={m.height ? `${m.height} m` : "—"} k="Height" tier={tH} />
                      <SpecChip icon={<Flame   className="h-3 w-3" />} v={m.fire   ? `${m.fire}'`    : "—"} k="Fire"   tier={tF} />
                      <SpecChip icon={<Volume2 className="h-3 w-3" />} v={m.rw     ? `${m.rw} dB`    : "—"} k="Rw"     tier={tR} />
                      <SpecChip icon={<Layers  className="h-3 w-3" />} v={`${m.thick} mm`}                  k="Thick"  tier={tT} />
                    </div>

                    {(() => {
                      const c = costFor(m.code);
                      if (!c) {
                        return (
                          <div
                            className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 px-3 py-2 text-[11px] text-[var(--ink-500)]"
                            title="No quantity build-up yet — open in calculator to estimate manually"
                          >
                            <span className="font-semibold uppercase tracking-wider">Price</span>
                            <span>n/a · open in calculator</span>
                          </div>
                        );
                      }
                      const matPct = Math.round((c.materials / (c.materials + c.labour)) * 100);
                      const partial = c.pricedRatio < 1;
                      return (
                        <div
                          className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-[var(--accent-500)]/10 to-transparent px-3 py-2"
                          title={`Materials £${c.materials.toFixed(2)}/m² · Labour £${c.labour.toFixed(2)}/m²${partial ? " · partial catalogue coverage" : ""}`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                            Indicative cost {partial && <span className="text-[var(--amber-500)]">·</span>}
                          </span>
                          <span className="font-mono-num text-[13px] font-bold text-[var(--accent-500)]">
                            £{c.perM2.toFixed(0)}<span className="text-[10px] font-medium text-[var(--ink-500)]"> /m²</span>
                            <span className="ml-2 text-[10px] font-normal text-[var(--ink-500)]">{matPct}% mat</span>
                          </span>
                        </div>
                      );
                    })()}

                    <div className="mt-4 flex items-center gap-2 border-t border-[var(--ink-200)]/50 pt-3">
                      <button
                        onClick={() => {
                          const side = pushToTray(m.code);
                          toast.success(`Added to Compare slot ${side}`, { description: m.code });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 px-2.5 py-1 text-[11.5px] font-semibold text-[var(--accent-500)] transition-colors hover:bg-[var(--accent-500)]/15"
                      >
                        <GitCompare className="h-3 w-3" /> Send to Compare
                      </button>
                      <button
                        onClick={() => { toast.success("Loaded into calculator", { description: m.code }); navigate({ to: "/calculator" }); }}
                        className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--ink-700)] hover:text-[var(--ink-900)]"
                      >
                        Load → calculator <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----
function StatusDot({ s }: { s: Family["status"] }) {
  const cfg = {
    live:    { c: "bg-[var(--green-600)]",  t: "Live"    },
    beta:    { c: "bg-[var(--amber-500)]",  t: "Beta"    },
    roadmap: { c: "bg-[var(--ink-200)]",    t: "Roadmap" },
  }[s];
  return (
    <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.c}`} />
      {cfg.t}
    </span>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium placeholder:text-[var(--ink-500)]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SpecChip({ icon, k, v, tier = "none" }: { icon: React.ReactNode; k: string; v: string; tier?: Tier }) {
  const color = tierColorVar(tier);
  const isNone = tier === "none";
  return (
    <div
      className="group/chip relative overflow-hidden rounded-lg border p-2 text-center backdrop-blur-sm transition-all hover:-translate-y-0.5"
      style={{
        borderColor: isNone
          ? "color-mix(in oklab, var(--ink-200) 60%, transparent)"
          : `color-mix(in oklab, ${color} 35%, transparent)`,
        background: isNone
          ? "color-mix(in oklab, var(--card) 40%, transparent)"
          : `linear-gradient(180deg, color-mix(in oklab, ${color} 12%, transparent), color-mix(in oklab, ${color} 4%, transparent))`,
      }}
    >
      {/* tier corner accent */}
      {!isNone && (
        <span
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
      <span
        className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider"
        style={{ color: isNone ? "var(--ink-500)" : color }}
      >
        {icon} {k}
      </span>
      <p
        className="font-mono-num mt-1 text-[12.5px] font-bold"
        style={{ color: isNone ? "var(--ink-900)" : color }}
      >
        {v}
      </p>
    </div>
  );
}
