import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check, ArrowRight, Search,
  Layers, Volume2, Flame, Ruler, GitCompare, ChevronDown, X,
  Building2, PanelTop, Shield, Grid3x3, Box, Hammer, Wind, Brush,
} from "lucide-react";
import { toast } from "sonner";
import { pushToTray } from "@/lib/compareTray";
import { fireTier, acousticTier, heightTier, thicknessTier, bestTier, tierColorVar, type Tier } from "@/lib/impact";
import { findSystem, scaledTotals } from "@/lib/systemLibrary";
import { estimateCost } from "@/lib/calculatorPricing";
import { useCan } from "@/lib/permissions";

export const Route = createFileRoute("/catalog")({ component: Catalog });

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

// Each system declares the layered build-up so we can render a visual stack on the card.
// `t` = relative thickness weight for the SVG stack (mm-ish, just for proportions).
type Layer = { kind: "board" | "stud" | "insul" | "void"; label: string; t: number; c: string };

const allMatches: {
  code: string; name: string; family: string; brand: string; board: string;
  height: number; fire: number; rw: number; centres: number; thick: number;
  layers: Layer[];
}[] = [
  {
    code: "GIWL-146-I-80-1L-DL15 (B)", name: "Independent lining · DuraLine 15",
    family: "lining", brand: "BG", board: "DuraLine",
    height: 7.2, fire: 0, rw: 0, centres: 600, thick: 161,
    layers: [
      { kind: "stud",  label: "I-Stud 146 framework",   t: 146, c: "var(--ink-700)" },
      { kind: "board", label: "Gyproc DuraLine 15",     t: 15,  c: "var(--accent-500)" },
    ],
  },
  {
    code: "GIWL-92-C-50-2L-WB12.5", name: "Independent lining · 2× WallBoard 12.5",
    family: "lining", brand: "BG", board: "WallBoard",
    height: 5.4, fire: 60, rw: 44, centres: 600, thick: 117,
    layers: [
      { kind: "stud",  label: "C-Stud 92",              t: 92,   c: "var(--ink-700)" },
      { kind: "board", label: "Gyproc WallBoard 12.5",  t: 12.5, c: "var(--accent-500)" },
      { kind: "board", label: "Gyproc WallBoard 12.5",  t: 12.5, c: "var(--accent-500)" },
    ],
  },
  {
    code: "GDWL-DL15-1L", name: "Direct lining · DuraLine 15 (dabs)",
    family: "lining", brand: "BG", board: "DuraLine",
    height: 3.6, fire: 0, rw: 0, centres: 0, thick: 35,
    layers: [
      { kind: "void",  label: "Adhesive dabs cavity",   t: 20, c: "var(--ink-200)" },
      { kind: "board", label: "Gyproc DuraLine 15",     t: 15, c: "var(--accent-500)" },
    ],
  },
  {
    code: "C-48/70-1L-WB15", name: "GypWall CLASSIC · WallBoard 15",
    family: "walls", brand: "BG", board: "WallBoard",
    height: 4.2, fire: 60, rw: 43, centres: 600, thick: 100,
    layers: [
      { kind: "board", label: "Gyproc WallBoard 15",    t: 15, c: "var(--accent-500)" },
      { kind: "stud",  label: "C-Stud 70",              t: 70, c: "var(--ink-700)" },
      { kind: "board", label: "Gyproc WallBoard 15",    t: 15, c: "var(--accent-500)" },
    ],
  },
  {
    code: "C-92/146-2L-SB", name: "GypWall QUIET · SoundBloc",
    family: "walls", brand: "BG", board: "SoundBloc",
    height: 5.8, fire: 60, rw: 63, centres: 600, thick: 176,
    layers: [
      { kind: "board", label: "Gyproc SoundBloc 15",    t: 15, c: "var(--teal-500)" },
      { kind: "board", label: "Gyproc SoundBloc 15",    t: 15, c: "var(--teal-500)" },
      { kind: "stud",  label: "C-Stud 92",              t: 92, c: "var(--ink-700)" },
      { kind: "insul", label: "Acoustic insulation",    t: 40, c: "var(--amber-500)" },
      { kind: "board", label: "Gyproc SoundBloc 15",    t: 15, c: "var(--teal-500)" },
      { kind: "board", label: "Gyproc SoundBloc 15",    t: 15, c: "var(--teal-500)" },
    ],
  },
  {
    code: "S-CW-120", name: "ShaftWall S-CW · 120 min",
    family: "shaft", brand: "BG", board: "Glasroc F",
    height: 8.1, fire: 120, rw: 52, centres: 600, thick: 130,
    layers: [
      { kind: "board", label: "Glasroc F FireCase",     t: 20, c: "var(--red-500)" },
      { kind: "stud",  label: "C-H Stud shaft framework", t: 90, c: "var(--ink-700)" },
      { kind: "board", label: "Gyproc CoreBoard 25",    t: 25, c: "var(--red-500)" },
    ],
  },
  {
    code: "MF-CASOLINE", name: "CasoLine MF ceiling",
    family: "ceilings", brand: "BG", board: "WallBoard",
    height: 0, fire: 30, rw: 37, centres: 0, thick: 28,
    layers: [
      { kind: "stud",  label: "MF grid + hangers",      t: 15, c: "var(--ink-700)" },
      { kind: "board", label: "Gyproc WallBoard 12.5",  t: 12.5, c: "var(--accent-500)" },
    ],
  },
];

// Filter chip presets
const FIRE_CHIPS = [0, 30, 60, 90, 120];
const BRAND_CHIPS = ["BG", "Knauf", "Siniat", "Fermacell"];
const BOARD_CHIPS = ["WallBoard", "DuraLine", "SoundBloc", "FireLine", "Glasroc F"];

function Catalog() {
  const navigate = useNavigate();
  const canSeePricing = useCan("view.financials.lite");
  const [picked, setPicked] = useState<string>("lining");
  const [q, setQ] = useState("");
  const [minFire, setMinFire] = useState<number>(0);   // chip
  const [minRw, setMinRw] = useState<number>(0);       // slider
  const [minH, setMinH] = useState<number>(0);         // slider (m)
  const [brand, setBrand] = useState<string>("BG");    // single chip
  const [boards, setBoards] = useState<string[]>([]);  // multi chip
  const [sort, setSort] = useState<"best"|"height"|"thick"|"price">("best");
  const [openCard, setOpenCard] = useState<string | null>(null);
  // If the user lost pricing visibility but had "price" selected, fall back to "best"
  const effectiveSort = !canSeePricing && sort === "price" ? "best" : sort;

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
      (minH === 0    || m.height >= minH) &&
      (minRw === 0   || m.rw     >= minRw) &&
      (minFire === 0 || m.fire   >= minFire) &&
      (!brand        || m.brand  === brand) &&
      (boards.length === 0 || boards.includes(m.board))
    );
    if (effectiveSort === "height") r = [...r].sort((a,b) => b.height - a.height);
    if (effectiveSort === "thick")  r = [...r].sort((a,b) => a.thick  - b.thick);
    if (effectiveSort === "price")  r = [...r].sort((a,b) => {
      const ca = costFor(a.code)?.perM2 ?? Infinity;
      const cb = costFor(b.code)?.perM2 ?? Infinity;
      return ca - cb;
    });
    return r;
  }, [picked, q, minH, minRw, minFire, brand, boards, effectiveSort]);

  const activeFilterCount =
    (minFire ? 1 : 0) + (minRw ? 1 : 0) + (minH ? 1 : 0) +
    (brand !== "BG" ? 1 : 0) + boards.length;
  const clearFilters = () => { setMinFire(0); setMinRw(0); setMinH(0); setBrand("BG"); setBoards([]); };
  const toggleBoard = (b: string) =>
    setBoards(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  return (
    <div className="glass-bg -m-6 min-h-[calc(100vh-4rem)] p-6 md:-m-8 md:p-10">
      <div className="relative space-y-8">
        {/* Editorial header — quieter, magazine-style */}
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--ink-200)]/60 pb-7">
          <div>
            <p className="font-mono-num text-[10.5px] uppercase tracking-[0.28em] text-[var(--ink-500)]">
              The system catalog · vol. 01
            </p>
            <h1 className="font-display mt-4 max-w-2xl text-[42px] font-semibold leading-[1.02] tracking-tight text-[var(--ink-900)] md:text-[54px]">
              Pick a wall.<br/>
              <span className="italic text-[var(--ink-500)]">See exactly what's inside it.</span>
            </h1>
            <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-[var(--ink-700)]">
              Every system shown here opens up to reveal its layers, materials per m² and how it performs against fire, acoustics and height.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/calculator" })} className="gap-1.5">
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
            {/* Filter bar — chips + sliders */}
            <div className="glass-card space-y-5 rounded-2xl p-5">
              {/* Row 1: Fire chips */}
              <FilterRow icon={<Flame className="h-3.5 w-3.5" />} label="Fire rating">
                {FIRE_CHIPS.map(min => (
                  <Chip key={min} active={minFire === min} onClick={() => setMinFire(min)}>
                    {min === 0 ? "Any" : `${min}+ min`}
                  </Chip>
                ))}
              </FilterRow>

              {/* Row 2: Rw + Height sliders side by side */}
              <div className="grid gap-5 md:grid-cols-2">
                <SliderRow
                  icon={<Volume2 className="h-3.5 w-3.5" />}
                  label="Acoustic Rw"
                  value={minRw} min={0} max={65} step={5}
                  onChange={setMinRw}
                  fmt={v => v === 0 ? "Any" : `${v}+ dB`}
                />
                <SliderRow
                  icon={<Ruler className="h-3.5 w-3.5" />}
                  label="Max height"
                  value={minH} min={0} max={9} step={0.5}
                  onChange={setMinH}
                  fmt={v => v === 0 ? "Any" : `${v.toFixed(1)}+ m`}
                />
              </div>

              {/* Row 3: Brand + Board */}
              <div className="grid gap-5 md:grid-cols-[auto_1fr]">
                <FilterRow icon={<Building2 className="h-3.5 w-3.5" />} label="Brand">
                  {BRAND_CHIPS.map(b => (
                    <Chip key={b} active={brand === b} onClick={() => setBrand(b)} muted={b !== "BG"}>
                      {b}
                    </Chip>
                  ))}
                </FilterRow>
                <FilterRow icon={<Layers className="h-3.5 w-3.5" />} label="Board type">
                  {BOARD_CHIPS.map(b => (
                    <Chip key={b} active={boards.includes(b)} onClick={() => toggleBoard(b)}>
                      {b}
                    </Chip>
                  ))}
                </FilterRow>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center justify-between border-t border-[var(--ink-200)]/60 pt-3 text-[11.5px]">
                  <span className="text-[var(--ink-500)]">
                    <span className="font-semibold text-[var(--ink-900)]">{activeFilterCount}</span> filter{activeFilterCount === 1 ? "" : "s"} active
                  </span>
                  <button onClick={clearFilters} className="inline-flex items-center gap-1 font-semibold text-[var(--accent-500)] hover:underline">
                    <X className="h-3 w-3" /> Reset
                  </button>
                </div>
              )}
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
                  {canSeePricing && <option value="price">Cheapest £/m²</option>}
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
              <div className="grid gap-5 xl:grid-cols-2">
                {results.map((m, i) => {
                  const tH = heightTier(m.height);
                  const tF = fireTier(m.fire);
                  const tR = acousticTier(m.rw);
                  const tT = thicknessTier(m.thick);
                  const top = bestTier(tF, tR, tH);
                  const isOpen = openCard === m.code;
                  const sysDef = findSystem(m.code);
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
                    {/* Editorial layout: visual stack on the left, copy on the right */}
                    <div className="flex items-start gap-5">
                      <BuildUpStack layers={m.layers} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">{m.code}</p>
                          {top !== "none" && (
                            <span className="tier-chip" data-tier={top}>
                              <span className="tier-dot" /> {top}
                            </span>
                          )}
                        </div>
                        <p className="font-display mt-1.5 text-[18px] font-semibold leading-snug text-[var(--ink-900)]">{m.name}</p>
                        <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                          {m.layers.length} layer{m.layers.length === 1 ? "" : "s"} · {m.thick} mm overall
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <SpecChip icon={<Ruler   className="h-3 w-3" />} v={m.height ? `${m.height} m` : "—"} k="Height" tier={tH} />
                      <SpecChip icon={<Flame   className="h-3 w-3" />} v={m.fire   ? `${m.fire}'`    : "—"} k="Fire"   tier={tF} />
                      <SpecChip icon={<Volume2 className="h-3 w-3" />} v={m.rw     ? `${m.rw} dB`    : "—"} k="Rw"     tier={tR} />
                      <SpecChip icon={<Layers  className="h-3 w-3" />} v={`${m.thick} mm`}                  k="Thick"  tier={tT} />
                    </div>

                    {canSeePricing && (() => {
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

                    {/* Expandable build-up: layer-by-layer + per-m² materials */}
                    <button
                      onClick={() => setOpenCard(isOpen ? null : m.code)}
                      className="mt-4 flex w-full items-center justify-between rounded-lg bg-[var(--ink-50)]/60 px-3 py-2 text-[11.5px] font-semibold text-[var(--ink-700)] transition-colors hover:bg-[var(--ink-50)]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                        {isOpen ? "Hide" : "Show"} build-up
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div className="mt-3 space-y-3 rounded-xl border border-[var(--ink-200)]/60 bg-[var(--card)] p-3">
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Layers (outside → inside)</p>
                          <ol className="space-y-1.5">
                            {m.layers.map((L, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-[12px]">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: L.c }} />
                                <span className="font-mono-num w-5 text-[10px] text-[var(--ink-500)]">{idx + 1}.</span>
                                <span className="flex-1 text-[var(--ink-900)]">{L.label}</span>
                                <span className="font-mono-num text-[11px] text-[var(--ink-500)]">{L.t} mm</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        {sysDef && (
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Materials per m²</p>
                            <ul className="space-y-1">
                              {Object.entries(sysDef.totalsPerM2).map(([item, { qty, unit }]) => (
                                <li key={item} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                                  <span className="truncate text-[var(--ink-700)]">{item}</span>
                                  <span className="font-mono-num shrink-0 text-[var(--ink-900)]">{qty.toFixed(2)} {unit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

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

function FilterRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        <span className="text-[var(--accent-500)]">{icon}</span>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, muted, onClick, children }: { active: boolean; muted?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={muted}
      className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all ${
        active
          ? "bg-gradient-to-br from-[var(--ink-900)] to-[var(--navy-800)] text-white shadow-[0_4px_14px_-6px_var(--accent-500)]"
          : muted
          ? "cursor-not-allowed border border-dashed border-[var(--ink-200)] text-[var(--ink-500)] opacity-50"
          : "border border-[var(--ink-200)] bg-[var(--card)] text-[var(--ink-700)] hover:border-[var(--accent-500)]/50 hover:text-[var(--ink-900)]"
      }`}
    >
      {children}
    </button>
  );
}

function SliderRow({ icon, label, value, min, max, step, onChange, fmt }: {
  icon: React.ReactNode; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          <span className="text-[var(--accent-500)]">{icon}</span>
          {label}
        </span>
        <span className="font-mono-num rounded-full bg-[var(--accent-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--accent-500)]">
          {fmt(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--ink-200)] accent-[var(--accent-500)]"
      />
    </div>
  );
}

/** SVG-based layered build-up stack — visual cross-section of the wall. */
function BuildUpStack({ layers }: { layers: Layer[] }) {
  const total = layers.reduce((s, L) => s + L.t, 0);
  const W = 88; // px
  const H = 120; // px
  return (
    <div className="relative shrink-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible drop-shadow-[0_6px_14px_rgba(15,40,71,0.12)]">
        {/* Subtle outer frame */}
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="6" fill="var(--card)" stroke="color-mix(in oklab, var(--ink-200) 80%, transparent)" />
        {(() => {
          let y = 4;
          const usableH = H - 8;
          return layers.map((L, i) => {
            const h = Math.max(4, (L.t / total) * usableH);
            const node = (
              <g key={i}>
                <rect x="4" y={y} width={W - 8} height={h} rx="2"
                      fill={L.c}
                      opacity={L.kind === "void" ? 0.18 : L.kind === "stud" ? 0.55 : 0.85} />
                {L.kind === "stud" && h >= 16 && (
                  // hatch lines to suggest framework
                  <g stroke="var(--card)" strokeWidth="1" opacity="0.5">
                    {Array.from({ length: Math.floor((W - 12) / 8) }).map((_, j) => (
                      <line key={j} x1={6 + j * 8} y1={y + 2} x2={6 + j * 8 + 4} y2={y + h - 2} />
                    ))}
                  </g>
                )}
                {L.kind === "insul" && h >= 10 && (
                  <g stroke="var(--card)" strokeWidth="1" opacity="0.6">
                    {Array.from({ length: Math.floor(h / 4) }).map((_, j) => (
                      <line key={j} x1="6" y1={y + 2 + j * 4} x2={W - 6} y2={y + 2 + j * 4} strokeDasharray="2 2" />
                    ))}
                  </g>
                )}
              </g>
            );
            y += h;
            return node;
          });
        })()}
      </svg>
      <p className="font-mono-num mt-1.5 text-center text-[9.5px] uppercase tracking-wider text-[var(--ink-500)]">
        cross-section
      </p>
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
