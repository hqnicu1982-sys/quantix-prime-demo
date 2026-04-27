import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Download, Shield, Layers, Ruler, Volume2, Flame,
  ArrowRight, Wand2, RotateCcw, GitCompare, Check, ArrowDown, ArrowUp, Minus, Lightbulb,
  AlertCircle, Search, Link2, Info, PoundSterling, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { pushToTray, readSlots, setSlot, subscribe } from "@/lib/compareTray";
import { BOARD_LIBRARY, getAvailableBoards, planWalls, recommendBoardForWalls, type WallInput } from "@/lib/boardSizing";
import { fireTier, acousticTier, heightTier, bestTier, tierColorVar, type Tier } from "@/lib/impact";
import { TierMetric as TierChip } from "@/components/TierMetric";
import { ColumnDiagram } from "@/components/calculator/ColumnDiagram";
import { WallEditor } from "@/components/calculator/WallEditor";

// =============================================================================
// SEARCH PARAMS — calculator state lives in the URL so it can be shared
// =============================================================================
const searchSchema = z.object({
  mode:    fallback(z.enum(["code", "recommend", "compare"]), "code").default("code"),
  sys:     fallback(z.string(), "").default(""),
  left:    fallback(z.string(), "").default(""),
  right:   fallback(z.string(), "").default(""),
  board:   fallback(z.string(), "auto").default("auto"),
  reuse:   fallback(z.boolean(), false).default(false),
  waste:   fallback(z.number().int().min(0).max(20), 5).default(5),
  // Walls: encoded as JSON in `w` to keep URLs sane.
  // Each wall: { n: name, l: length-mm, h: height-mm, o?: openings-m² }
  w:       fallback(z.string(), "").default(""),
  // Filters for Recommend mode
  minH:    fallback(z.number().min(0).max(20).optional(), undefined).default(undefined),
  minRw:   fallback(z.number().int().min(0).max(80).optional(), undefined).default(undefined),
  minFire: fallback(z.number().int().min(0).max(240).optional(), undefined).default(undefined),
});

export const Route = createFileRoute("/calculator/advanced")({
  validateSearch: zodValidator(searchSchema),
  component: Calculator,
});

// =============================================================================
// SYSTEM LIBRARY (structured for compare)
// =============================================================================
type Perf = {
  weight: number;
  maxHeight: number;
  studCentres: number;
  fire: number;
  rw: number;
};
type Totals = Record<string, { qty: number; unit: string }>;
type SystemDef = {
  code: string;
  shortName: string;
  desc: string;
  buildUp: { k: string; v: string }[];
  perf: Perf;
  totalsPerM2: Totals;
  availableBoards?: string[];
};

const LIBRARY: SystemDef[] = [
  {
    code: "GIWL-146-I-80-1L-DL15 (B)",
    shortName: "DuraLine 15 · I-Stud 146",
    desc: "One layer of Gyproc DuraLine 15mm to one side of Gypframe 146 | 80 'I' Stud framework forming an independent lining. Heights up to 7200 mm.",
    buildUp: [
      { k: "Board type",            v: "Gyproc DuraLine" },
      { k: "Board thickness (mm)",  v: "15" },
      { k: "Layers / Side",         v: "1 — 0" },
      { k: "Board size used",       v: "1200 × 2400" },
      { k: "Suggested stud length", v: "4.2 m" },
    ],
    perf: { weight: 14, maxHeight: 7200, studCentres: 600, fire: 0, rw: 0 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Gypframe Stud (4.2m)":                                            { qty: 0.42,  unit: "lengths" },
      "Gypframe 62 FEC 50 Folded Edge Floor & Ceiling Channel (3.6m)":   { qty: 0.14,  unit: "lengths" },
      "Gypframe 99 FC 50":                                               { qty: 0.07,  unit: "lengths" },
      "Gypframe GFS1":                                                   { qty: 0.50,  unit: "lm" },
      "Jointing":                                                        { qty: 0.84,  unit: "kg" },
      "Sealant":                                                         { qty: 12.5,  unit: "ml" },
    },
  },
  {
    code: "GIWL-92-C-50-2L-WB12.5",
    shortName: "WallBoard 12.5 ×2 · C-Stud 92",
    desc: "Two layers of Gyproc WallBoard 12.5 mm to one side of Gypframe 92 C-Stud — 60 min fire and 44 dB Rw. Heights up to 5400 mm.",
    buildUp: [
      { k: "Board type",            v: "Gyproc WallBoard" },
      { k: "Board thickness (mm)",  v: "12.5 (×2)" },
      { k: "Layers / Side",         v: "2 — 0" },
      { k: "Board size used",       v: "1200 × 2400" },
      { k: "Suggested stud length", v: "3.0 m" },
    ],
    perf: { weight: 22, maxHeight: 5400, studCentres: 600, fire: 60, rw: 44 },
    availableBoards: ["1200 × 2400", "1200 × 3000", "1200 × 3600"],
    totalsPerM2: {
      "Gypframe Stud (3.0m)":                                            { qty: 0.42,  unit: "lengths" },
      "Gypframe 62 FEC 50 Folded Edge Floor & Ceiling Channel (3.6m)":   { qty: 0.14,  unit: "lengths" },
      "Gyproc WallBoard 12.5":                                           { qty: 2.10,  unit: "m²" },
      "Gypframe GFS1":                                                   { qty: 0.50,  unit: "lm" },
      "Jointing":                                                        { qty: 1.20,  unit: "kg" },
      "Sealant":                                                         { qty: 12.5,  unit: "ml" },
    },
  },
  {
    code: "GIWL-146-I-80-2L-SB15",
    shortName: "SoundBloc 15 ×2 · I-Stud 146 (acoustic)",
    desc: "Two layers of Gyproc SoundBloc 15 mm on Gypframe 146 I-Stud — 90 min fire and 58 dB Rw. Heights up to 7200 mm.",
    buildUp: [
      { k: "Board type",            v: "Gyproc SoundBloc" },
      { k: "Board thickness (mm)",  v: "15 (×2)" },
      { k: "Layers / Side",         v: "2 — 0" },
      { k: "Board size used",       v: "1200 × 2400" },
      { k: "Suggested stud length", v: "4.2 m" },
    ],
    perf: { weight: 28, maxHeight: 7200, studCentres: 600, fire: 90, rw: 58 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Gypframe Stud (4.2m)":                                            { qty: 0.42,  unit: "lengths" },
      "Gypframe 62 FEC 50 Folded Edge Floor & Ceiling Channel (3.6m)":   { qty: 0.14,  unit: "lengths" },
      "Gyproc SoundBloc 15":                                             { qty: 2.10,  unit: "m²" },
      "Isover Acoustic Partition Roll":                                  { qty: 1.00,  unit: "m²" },
      "Gypframe GFS1":                                                   { qty: 0.50,  unit: "lm" },
      "Jointing":                                                        { qty: 1.40,  unit: "kg" },
      "Sealant":                                                         { qty: 12.5,  unit: "ml" },
    },
  },
];

// =============================================================================
// Walls encoding helpers
// =============================================================================
const DEFAULT_WALLS: WallInput[] = [
  { id: "w-1", name: "Wall 1", lengthMm: 50000, heightMm: 4000, openingsM2: 0 },
];

function encodeWalls(walls: WallInput[]): string {
  return JSON.stringify(walls.map(w => ({ n: w.name, l: w.lengthMm, h: w.heightMm, o: w.openingsM2 ?? 0 })));
}
function decodeWalls(s: string): WallInput[] {
  if (!s) return DEFAULT_WALLS;
  try {
    const parsed = JSON.parse(s) as Array<{ n: string; l: number; h: number; o?: number }>;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WALLS;
    return parsed.map((p, i) => ({
      id: `w-${i + 1}`,
      name: p.n || `Wall ${i + 1}`,
      lengthMm: Math.max(0, p.l || 0),
      heightMm: Math.max(0, p.h || 0),
      openingsM2: Math.max(0, p.o || 0),
    }));
  } catch {
    return DEFAULT_WALLS;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================
function Calculator() {
  const navigate = useNavigate({ from: "/calculator" });
  const search = Route.useSearch();

  // Hydrate from URL
  const mode = search.mode;
  const activeCode = search.sys && LIBRARY.some(s => s.code === search.sys) ? search.sys : LIBRARY[0].code;
  const leftCode = search.left && LIBRARY.some(s => s.code === search.left) ? search.left : LIBRARY[0].code;
  const rightCode = search.right && LIBRARY.some(s => s.code === search.right) ? search.right : LIBRARY[1].code;
  const boardSize = search.board;
  const reuseOffcuts = search.reuse;
  const waste = search.waste;
  const walls = useMemo(() => decodeWalls(search.w), [search.w]);

  // Setters that write to URL
  const set = (patch: Record<string, unknown>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }), replace: true });

  // Sync compare slots from tray
  useEffect(() => {
    const slots = readSlots();
    const updates: Partial<typeof search> = {};
    if (slots.A && LIBRARY.some(x => x.code === slots.A) && slots.A !== leftCode) updates.left = slots.A;
    if (slots.B && LIBRARY.some(x => x.code === slots.B) && slots.B !== rightCode) updates.right = slots.B;
    if (Object.keys(updates).length) set(updates);
    return subscribe(() => {
      const s = readSlots();
      const u: Partial<typeof search> = {};
      if (s.A && LIBRARY.some(x => x.code === s.A)) u.left = s.A;
      if (s.B && LIBRARY.some(x => x.code === s.B)) u.right = s.B;
      if (Object.keys(u).length) set(u);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLeftAndSync = (v: string) => { set({ left: v }); setSlot("A", v); };
  const setRightAndSync = (v: string) => { set({ right: v }); setSlot("B", v); };

  const totalAreaGross = walls.reduce((a, w) => a + (w.heightMm * w.lengthMm) / 1_000_000, 0);
  const totalOpenings = walls.reduce((a, w) => a + (w.openingsM2 ?? 0), 0);
  const area = Math.max(0, totalAreaGross - totalOpenings);
  const wasteFactor = 1 + waste / 100;

  const promoteToCalculator = (code: string, label?: string) => {
    set({ sys: code, mode: "code" });
    toast.success(label ?? "Loaded into calculator", { description: code });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyShareLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied", { description: "Share this calculation with your team" });
  };

  return (
    <div className="glass-bg -m-6 min-h-[calc(100vh-4rem)] p-6 md:-m-8 md:p-10">
      <div className="relative space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="pop-in">
            <p className="font-mono-num flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--ink-500)]">
              <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-[var(--accent-500)] shadow-[0_0_12px_var(--accent-500)]" />
              BG System Calculator
            </p>
            <h1 className="font-display mt-3 text-[44px] font-semibold leading-[0.95] tracking-tight md:text-[60px]">
              <span className="hero-gradient-text">From a code to a</span><br />
              <span className="italic text-[var(--accent-500)]">priced BoQ</span>.
            </h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--ink-700)]">
              Load any British Gypsum system — set the area — get the full build-up: frame, board, jointing and ancillaries.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="glass-card inline-flex rounded-full p-1">
              <ModeBtn active={mode === "code"}      onClick={() => set({ mode: "code" })}      icon={<Search className="h-3.5 w-3.5" />}      label="By code" />
              <ModeBtn active={mode === "recommend"} onClick={() => set({ mode: "recommend" })} icon={<Sparkles className="h-3.5 w-3.5" />}    label="Recommend" />
              <ModeBtn active={mode === "compare"}   onClick={() => set({ mode: "compare" })}   icon={<GitCompare className="h-3.5 w-3.5" />}  label="Compare" />
            </div>
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--card)]/60 px-3 py-1 text-[11px] font-medium text-[var(--ink-700)] hover:border-[var(--accent-500)] hover:text-[var(--accent-500)]"
              title="Copy a shareable URL with all current inputs"
            >
              <Link2 className="h-3 w-3" /> Share link
            </button>
          </div>
        </header>

        {mode === "recommend" && (
          <RecommendBar
            search={search}
            onApply={(filters) => set(filters)}
            onLoad={(code) => set({ mode: "code", sys: code })}
          />
        )}

        {mode === "compare" ? (
          <CompareView
            leftCode={leftCode}  setLeftCode={setLeftAndSync}
            rightCode={rightCode} setRightCode={setRightAndSync}
            walls={walls} setWalls={(w) => set({ w: encodeWalls(w) })}
            waste={waste} setWaste={(v) => set({ waste: v })}
            area={area} wasteFactor={wasteFactor}
            onPromote={promoteToCalculator}
          />
        ) : (
          <SingleView
            activeCode={activeCode} setActiveCode={(v) => set({ sys: v })}
            walls={walls} setWalls={(w) => set({ w: encodeWalls(w) })}
            waste={waste} setWaste={(v) => set({ waste: v })}
            boardSize={boardSize} setBoardSize={(v) => set({ board: v })}
            reuseOffcuts={reuseOffcuts} setReuseOffcuts={(v) => set({ reuse: v })}
            area={area} wasteFactor={wasteFactor}
            navigate={navigate}
            onReset={() => set({ w: encodeWalls(DEFAULT_WALLS), waste: 5, board: "auto", reuse: false })}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// RECOMMEND MODE — actually filters
// =============================================================================
function RecommendBar({
  search,
  onApply,
  onLoad,
}: {
  search: { minH?: number; minRw?: number; minFire?: number };
  onApply: (patch: { minH?: number; minRw?: number; minFire?: number }) => void;
  onLoad: (code: string) => void;
}) {
  const [minH, setMinH] = useState(search.minH?.toString() ?? "");
  const [minRw, setMinRw] = useState(search.minRw?.toString() ?? "");
  const [minFire, setMinFire] = useState(search.minFire?.toString() ?? "");

  const matches = useMemo(() => {
    const h = +minH || 0;
    const rw = +minRw || 0;
    const f = +minFire || 0;
    return LIBRARY.filter(s =>
      s.perf.maxHeight / 1000 >= h &&
      s.perf.rw >= rw &&
      s.perf.fire >= f,
    );
  }, [minH, minRw, minFire]);

  const apply = () => {
    onApply({
      minH: minH ? +minH : undefined,
      minRw: minRw ? +minRw : undefined,
      minFire: minFire ? +minFire : undefined,
    });
    if (matches.length === 0) {
      toast.error("No system matches these criteria");
    } else {
      toast.success(`${matches.length} match${matches.length === 1 ? "" : "es"} found`);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-[var(--accent-500)]" />
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Match by requirements</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Min height (m)" placeholder="3.6" value={minH} onChange={setMinH} />
        <Field label="Min Rw (dB)"    placeholder="50"  value={minRw} onChange={setMinRw} />
        <Field label="Min Fire (min)" placeholder="60"  value={minFire} onChange={setMinFire} />
        <div className="flex items-end">
          <Button className="w-full gap-1.5" onClick={apply}>
            Apply filters <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            {matches.length} matching system{matches.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {matches.map(s => (
              <button
                key={s.code}
                onClick={() => onLoad(s.code)}
                className="group flex items-start justify-between gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--card)]/60 px-3 py-2.5 text-left transition-all hover:border-[var(--accent-500)] hover:shadow-sm"
              >
                <div>
                  <p className="font-mono-num text-[12px] font-semibold text-[var(--ink-900)]">{s.code}</p>
                  <p className="text-[11.5px] text-[var(--ink-500)]">{s.shortName}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10.5px] text-[var(--ink-700)]">
                    <span className="rounded-md bg-[var(--ink-100)] px-1.5 py-0.5">H {s.perf.maxHeight}mm</span>
                    {s.perf.fire > 0 && <span className="rounded-md bg-[var(--ink-100)] px-1.5 py-0.5">{s.perf.fire}' fire</span>}
                    {s.perf.rw > 0 && <span className="rounded-md bg-[var(--ink-100)] px-1.5 py-0.5">{s.perf.rw} dB Rw</span>}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-500)] group-hover:text-[var(--accent-500)]" />
              </button>
            ))}
          </div>
        </div>
      )}
      {matches.length === 0 && (minH || minRw || minFire) && (
        <p className="mt-4 rounded-md border border-dashed border-[var(--tier-critical)]/40 bg-[var(--tier-critical)]/5 px-3 py-2 text-[12px] text-[var(--tier-critical)]">
          No systems match these requirements. Try relaxing the constraints.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// SINGLE-SYSTEM VIEW
// =============================================================================
function SingleView({
  activeCode, setActiveCode,
  walls, setWalls, waste, setWaste,
  boardSize, setBoardSize,
  reuseOffcuts, setReuseOffcuts,
  area, wasteFactor, navigate, onReset,
}: {
  activeCode: string; setActiveCode: (v: string) => void;
  walls: WallInput[]; setWalls: (w: WallInput[]) => void;
  waste: number;  setWaste: (v: number) => void;
  boardSize: string; setBoardSize: (v: string) => void;
  reuseOffcuts: boolean; setReuseOffcuts: (v: boolean) => void;
  area: number;   wasteFactor: number;
  navigate: ReturnType<typeof useNavigate>;
  onReset: () => void;
}) {
  const sys = LIBRARY.find(s => s.code === activeCode) ?? LIBRARY[0];
  const totals = scaledTotals(sys, area, wasteFactor);
  const availableBoards = getAvailableBoards(sys.availableBoards);

  // Recommendation across the entire BoQ (multi-wall aware)
  const { recommendedLabel, plans } = useMemo(
    () => recommendBoardForWalls(walls, sys.availableBoards, reuseOffcuts),
    [walls, sys.availableBoards, reuseOffcuts],
  );
  const effectiveBoard = boardSize === "auto" ? recommendedLabel : boardSize;
  const activePlan = useMemo(
    () => planWalls(walls, effectiveBoard, { reuseAcrossWalls: reuseOffcuts }),
    [walls, effectiveBoard, reuseOffcuts],
  );

  const invalid = walls.some(w => w.heightMm <= 0 || w.lengthMm <= 0);
  const tallestWall = walls.reduce((a, w) => (w.heightMm > a ? w.heightMm : a), 0);
  const recommendedPlan = plans.find(p => p.label === recommendedLabel)?.plan;
  const needsHorizontalJoint = recommendedPlan
    ? recommendedPlan.walls.some(w => w.columns.some(col => col.length > 1))
    : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <main className="space-y-6">
        <section className="glass-card rounded-2xl p-6">
          <SectionTitle n="01" label="System reference" />
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System code</p>
              <select
                value={activeCode}
                onChange={e => setActiveCode(e.target.value)}
                className="glass-input font-mono-num w-full rounded-xl px-4 py-3 text-[14px] font-semibold"
              >
                {LIBRARY.map(s => (
                  <option key={s.code} value={s.code}>{s.code}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="gap-1.5"
              onClick={() => {
                const side = pushToTray(sys.code);
                toast.success(`Added to Compare slot ${side}`, { description: sys.code });
              }}
            >
              <GitCompare className="h-4 w-4" /> Send to Compare
            </Button>
          </div>

          {(() => {
            const tF = fireTier(sys.perf.fire);
            const tR = acousticTier(sys.perf.rw);
            const tH = heightTier(sys.perf.maxHeight / 1000);
            const top = bestTier(tF, tR, tH);
            return (
              <div
                className="relative mt-5 overflow-hidden rounded-xl border p-4"
                style={{
                  borderColor: `color-mix(in oklab, ${tierColorVar(top)} 35%, transparent)`,
                  background: `linear-gradient(135deg, color-mix(in oklab, ${tierColorVar(top)} 10%, transparent), color-mix(in oklab, var(--accent-500) 4%, transparent))`,
                  ['--tier-color' as never]: tierColorVar(top),
                }}
              >
                <span className="impact-ribbon" />
                <p className="text-[12.5px] leading-relaxed text-[var(--ink-900)]">{sys.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TierChip icon={<Flame   className="h-3 w-3" />} label="Fire"     value={sys.perf.fire ? `${sys.perf.fire}'`   : "—"} tier={tF} />
                  <TierChip icon={<Volume2 className="h-3 w-3" />} label="Acoustic" value={sys.perf.rw   ? `${sys.perf.rw} dB` : "—"} tier={tR} />
                  <TierChip icon={<Ruler   className="h-3 w-3" />} label="Max H"    value={`${sys.perf.maxHeight} mm`}                tier={tH} />
                  <TierChip icon={<Layers  className="h-3 w-3" />} label="Stud c/c" value={`${sys.perf.studCentres} mm`}              tier="none" />
                  <TierChip icon={<Layers  className="h-3 w-3" />} label="Weight"   value={`${sys.perf.weight} kg/m²`}                tier="none" />
                </div>
              </div>
            );
          })()}
        </section>

        <section className="glass-card rounded-2xl p-6">
          <SectionTitle n="02" label="Walls" />
          <p className="mt-2 text-[12px] text-[var(--ink-500)]">
            Add every wall built in this system. Off-cuts can be re-used across walls when the toggle is on — exactly as on site.
          </p>
          <div className="mt-4">
            <WallEditor walls={walls} onChange={setWalls} />
          </div>

          {/* Recommendation chip */}
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--accent-500)]/25 bg-[var(--accent-500)]/5 px-4 py-3 text-[12.5px]">
            <Lightbulb className="h-4 w-4 shrink-0 text-[var(--accent-500)]" />
            <span className="text-[var(--ink-700)]">
              {tallestWall <= 0 ? (
                <>Enter wall <strong>height</strong> & <strong>length</strong> to get a board recommendation that minimises off-cut waste.</>
              ) : boardSize === "auto" ? (
                <>For your BoQ ({walls.length} wall{walls.length === 1 ? "" : "s"}, {area.toFixed(1)} m²) we recommend <strong className="font-mono-num">{recommendedLabel}</strong> — lowest total cost.</>
              ) : (
                <>Using <strong className="font-mono-num">{effectiveBoard}</strong>. Auto would pick <strong className="font-mono-num">{recommendedLabel}</strong>.</>
              )}
            </span>
            {tallestWall > 0 && (
              <span className="ml-auto inline-flex items-center gap-1.5">
                <span className="font-mono-num rounded-md bg-[var(--card)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
                  Net waste {activePlan.netWastePct}%
                </span>
                {needsHorizontalJoint && (
                  <span className="font-mono-num rounded-md bg-[var(--amber-500)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--amber-500)]">
                    + horizontal joint
                  </span>
                )}
                {boardSize !== "auto" && boardSize !== recommendedLabel && (
                  <button
                    onClick={() => { setBoardSize("auto"); toast.success("Switched to recommended board", { description: recommendedLabel }); }}
                    className="rounded-md bg-[var(--accent-500)] px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90"
                  >
                    Use recommended
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Board comparison table */}
          {tallestWall > 0 && availableBoards.length > 1 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--ink-200)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink-200)] bg-[var(--ink-100)]/50 px-3 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                  Board comparison · {sys.shortName}
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <input
                    type="checkbox"
                    checked={reuseOffcuts}
                    onChange={e => setReuseOffcuts(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--accent-500)]"
                  />
                  Account for off-cut reuse across all walls
                </label>
              </div>
              <table className="w-full text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <tr className="border-b border-[var(--ink-200)]">
                    <th className="px-3 py-2 text-left font-semibold">Board size</th>
                    <th className="px-3 py-2 text-right font-semibold">Boards</th>
                    <th className="px-3 py-2 text-right font-semibold">{reuseOffcuts ? "Net waste" : "Off-cut waste"}</th>
                    <th className="px-3 py-2 text-right font-semibold">Material cost</th>
                    <th className="px-3 py-2 text-right font-semibold">Wasted £</th>
                    <th className="px-3 py-2 text-right font-semibold sr-only">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(({ label, plan }) => {
                    const isRecommended = label === recommendedLabel;
                    const isSelected = effectiveBoard === label;
                    const tone =
                      plan.netWastePct <= 5  ? "var(--tier-good)"
                      : plan.netWastePct <= 15 ? "var(--accent-500)"
                      : plan.netWastePct <= 25 ? "var(--amber-500)"
                      :           "var(--tier-critical)";
                    const board = BOARD_LIBRARY.find(b => b.label === label);
                    return (
                      <tr
                        key={label}
                        className={
                          "border-b border-[var(--ink-200)] last:border-b-0 " +
                          (isSelected ? "bg-[var(--accent-500)]/5" : "")
                        }
                        title={`${plan.totalBoardsBought} boards × ${board?.height}mm = ${(plan.totalBoardLengthMm / 1000).toFixed(1)}m of ${board?.label}\nWall coverage needed: ${(plan.totalCoverageMm / 1000).toFixed(1)}m\nScrap: ${(plan.totalScrapMm / 1000).toFixed(1)}m`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-semibold text-[var(--ink-900)]">{label}</span>
                            {isRecommended && (
                              <span className="rounded-full bg-[var(--accent-500)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
                                Recommended
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono-num px-3 py-2 text-right text-[var(--ink-700)]">{plan.totalBoardsBought}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className="font-mono-num inline-block rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                            style={{
                              color: tone,
                              background: `color-mix(in oklab, ${tone} 12%, transparent)`,
                            }}
                          >
                            {plan.netWastePct}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono-num text-[12px] tabular-nums text-[var(--ink-900)]">
                          £{Math.round(plan.totalCost).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-num text-[11.5px] tabular-nums text-[var(--tier-critical)]">
                          –£{Math.round(plan.scrapCost).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isSelected ? (
                            <span className="text-[11px] font-semibold text-[var(--accent-500)]">In use</span>
                          ) : (
                            <button
                              onClick={() => setBoardSize(label)}
                              className="rounded-md border border-[var(--ink-200)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-700)] hover:border-[var(--accent-500)] hover:text-[var(--accent-500)]"
                            >
                              Use
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-[var(--ink-200)] bg-[var(--ink-50)]/50 px-3 py-2 text-[10.5px] text-[var(--ink-500)]">
                <Info className="mr-1 inline h-3 w-3" />
                Hover any row for the breakdown. Cost uses indicative rates; replace with your active price list for project pricing.
              </div>
            </div>
          )}
        </section>

        {/* Visualisation */}
        {tallestWall > 0 && (
          <section className="glass-card rounded-2xl p-6">
            <SectionTitle n="03" label="Cutting strategy" />
            <p className="mt-2 text-[12px] text-[var(--ink-500)]">
              Schematic of how <strong className="font-mono-num text-[var(--ink-900)]">{effectiveBoard}</strong> is used per wall — one typical column and (when relevant) one column with a re-used off-cut. Diagonal stripes mark scrap.
            </p>
            <div className="mt-4 space-y-5">
              {activePlan.walls.map(wp => (
                <div key={wp.wall.id}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="text-[12.5px] font-semibold text-[var(--ink-900)]">{wp.wall.name}</p>
                    <p className="font-mono-num text-[10.5px] text-[var(--ink-500)]">
                      {wp.boardsBought} boards · {wp.scrapMm > 0 ? `${(wp.scrapMm / 1000).toFixed(2)} m scrap` : "no scrap"}
                    </p>
                  </div>
                  <ColumnDiagram plan={wp} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Handling waste */}
        <section className="glass-card rounded-2xl p-6">
          <SectionTitle n="04" label="Handling waste & finish" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select label="Stud Centres" options={["400 mm","600 mm","Other"]} defaultValue="600 mm" />
            <Select label="Finish" options={["Tape & Joint","Skim","Direct decorate"]} defaultValue="Tape & Joint" />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Handling waste %</p>
              <span className="font-mono-num rounded-md bg-[var(--accent-500)]/10 px-2 py-0.5 text-[12px] font-semibold text-[var(--accent-500)]">{waste}%</span>
            </div>
            <input type="range" min={0} max={20} value={waste} onChange={e => setWaste(+e.target.value)} className="w-full accent-[var(--accent-500)]" />
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">Adds on top of cut waste — covers damage, mistakes and offcuts that can't be reused.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="lg"
              className="flex-1 min-w-[200px] gap-2"
              disabled={invalid}
              onClick={() => {
                if (invalid) {
                  toast.error("Please fix wall dimensions first");
                  return;
                }
                toast.success("BoQ calculated", { description: `${sys.code} · ${area.toFixed(1)} m² across ${walls.length} wall${walls.length === 1 ? "" : "s"}` });
              }}
            >
              <Sparkles className="h-4 w-4" /> Calculate BoQ
            </Button>
            <Button size="lg" variant="outline" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <div className="glass-card flex items-start gap-3 rounded-2xl p-4 text-[12.5px] text-[var(--ink-900)]">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" />
          <p><strong>SpecSure®</strong> applies when genuine BG components and details are followed.</p>
        </div>
      </main>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="glass-card glass-card-strong relative overflow-hidden rounded-2xl">
          <span className="impact-ribbon" />
          <span className="shimmer-line absolute inset-x-0 top-0 h-[2px] opacity-60" />
          <div className="border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Live summary</p>
              {invalid ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--tier-critical)]">
                  <AlertCircle className="h-3 w-3" /> check inputs
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--green-600)]">
                  <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-[var(--green-600)]" /> live
                </span>
              )}
            </div>
            <p className="font-mono-num mt-1 text-[12px] font-semibold text-[var(--accent-500)]">{sys.code}</p>
          </div>

          <div className="border-b border-[var(--ink-200)]/60 px-5 py-5">
            <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Net wall area</p>
            <p className={"font-display mt-1 text-[44px] font-bold leading-none tracking-tight " + (invalid ? "text-[var(--ink-500)]" : "impact-number")}>
              {invalid ? "—" : area.toFixed(1)}<span className="ml-1 text-[16px] font-medium text-[var(--ink-500)]">m²</span>
            </p>
            <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
              {walls.length} wall{walls.length === 1 ? "" : "s"} · {totalAreaGrossOf(walls).toFixed(1)} m² gross − {sumOpenings(walls).toFixed(1)} m² openings · waste {waste}%
            </p>
          </div>

          <div className="border-b border-[var(--ink-200)]/60 px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Board cost</p>
              <PoundSterling className="h-3 w-3 text-[var(--ink-500)]" />
            </div>
            <p className="font-mono-num mt-1 text-[20px] font-semibold tabular-nums text-[var(--ink-900)]">
              £{Math.round(activePlan.totalCost).toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">
              {activePlan.totalBoardsBought} × <span className="font-mono-num">{effectiveBoard}</span> · –£{Math.round(activePlan.scrapCost).toLocaleString()} in scrap
            </p>
          </div>

          <div className="border-b border-[var(--ink-200)]/60 px-5 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System build-up</p>
            <ul className="mt-2 divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
              {sys.buildUp.map(b => (
                <li key={b.k} className="flex items-center justify-between py-2">
                  <span className="text-[var(--ink-500)]">{b.k}</span>
                  <span className="font-mono-num font-semibold text-[var(--ink-900)]">{b.v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Aggregated totals</p>
            <ul className="mt-2 divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
              {totals.map(t => (
                <li key={t.item} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="text-[var(--ink-900)]">{t.item}</span>
                  <span className="font-mono-num shrink-0 font-semibold text-[var(--ink-900)]">
                    {fmtQty(t.qty)} <span className="font-normal text-[var(--ink-500)]">{t.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-[var(--ink-200)]/60 bg-[var(--ink-50)]/40 p-4">
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={invalid}
              onClick={() => exportBoQCsv(sys, walls, totals, activePlan)}
            >
              <Download className="h-4 w-4" /> Export BoQ CSV
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={invalid}
              onClick={() => {
                toast.success("Added to project BoQ", { description: `${totals.length} line items · £${Math.round(activePlan.totalCost).toLocaleString()} board cost` });
                navigate({ to: "/costed-boq" });
              }}
            >
              Add to Costed BoQ
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// =============================================================================
// COMPARE VIEW
// =============================================================================
function CompareView({
  leftCode, setLeftCode, rightCode, setRightCode,
  walls, setWalls, waste, setWaste,
  area, wasteFactor, onPromote,
}: {
  leftCode: string;  setLeftCode: (v: string) => void;
  rightCode: string; setRightCode: (v: string) => void;
  walls: WallInput[]; setWalls: (w: WallInput[]) => void;
  waste: number;     setWaste: (v: number) => void;
  area: number;      wasteFactor: number;
  onPromote: (code: string, label?: string) => void;
}) {
  const left  = LIBRARY.find(s => s.code === leftCode)  ?? LIBRARY[0];
  const right = LIBRARY.find(s => s.code === rightCode) ?? LIBRARY[1];
  const sameSystem = left.code === right.code;

  const perfRows = useMemo(() => ([
    { k: "Max Height",   unit: "mm",    icon: <Ruler   className="h-3 w-3" />, l: left.perf.maxHeight,   r: right.perf.maxHeight,   higherBetter: true  },
    { k: "Fire",         unit: "min",   icon: <Flame   className="h-3 w-3" />, l: left.perf.fire,        r: right.perf.fire,        higherBetter: true  },
    { k: "Acoustic Rw",  unit: "dB",    icon: <Volume2 className="h-3 w-3" />, l: left.perf.rw,          r: right.perf.rw,          higherBetter: true  },
    { k: "Stud Centres", unit: "mm",    icon: <Layers  className="h-3 w-3" />, l: left.perf.studCentres, r: right.perf.studCentres, higherBetter: false },
    { k: "Weight",       unit: "kg/m²", icon: <Layers  className="h-3 w-3" />, l: left.perf.weight,      r: right.perf.weight,      higherBetter: false },
  ]), [left, right]);

  // Score perf rows + flag "decisive" gaps (>20% delta)
  const perfDecorated = useMemo(() => perfRows.map(row => {
    const winner = compareNum(row.l, row.r, row.higherBetter);
    const max = Math.max(row.l, row.r);
    const min = Math.min(row.l, row.r);
    const decisive = max > 0 && (max - min) / max >= 0.2;
    return { ...row, winner, decisive };
  }), [perfRows]);

  const tally = useMemo(() => {
    let l = 0, r = 0;
    for (const row of perfDecorated) {
      if (row.winner === "left")  l++;
      else if (row.winner === "right") r++;
    }
    return { l, r, winner: l === r ? null : l > r ? ("left" as const) : ("right" as const) };
  }, [perfDecorated]);

  const winnerCode =
    tally.winner === "left"  ? left.code  :
    tally.winner === "right" ? right.code :
    null;

  const totalsRows = useMemo(() => {
    const lT = scaledTotals(left,  area, wasteFactor);
    const rT = scaledTotals(right, area, wasteFactor);
    const items = Array.from(new Set([...lT.map(t => t.item), ...rT.map(t => t.item)]));
    return items.map(item => {
      const a = lT.find(t => t.item === item);
      const b = rT.find(t => t.item === item);
      return { item, unit: a?.unit ?? b?.unit ?? "", l: a?.qty ?? 0, r: b?.qty ?? 0 };
    });
  }, [left, right, area, wasteFactor]);

  const firstWall = walls[0];

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-[var(--accent-500)]" />
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
              Compare two systems · same area
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <div className="w-28">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Length (m)</p>
              <input
                type="number" step="0.1"
                value={firstWall ? (firstWall.lengthMm / 1000).toString() : ""}
                onChange={e => setWalls([{ ...(firstWall ?? DEFAULT_WALLS[0]), lengthMm: Math.round((+e.target.value || 0) * 1000) }])}
                className="glass-input font-mono-num w-full rounded-xl px-3 py-2 text-[13px]"
              />
            </div>
            <div className="w-28">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Height (m)</p>
              <input
                type="number" step="0.1"
                value={firstWall ? (firstWall.heightMm / 1000).toString() : ""}
                onChange={e => setWalls([{ ...(firstWall ?? DEFAULT_WALLS[0]), heightMm: Math.round((+e.target.value || 0) * 1000) }])}
                className="glass-input font-mono-num w-full rounded-xl px-3 py-2 text-[13px]"
              />
            </div>
            <div className="w-32">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Waste {waste}%</p>
              <input type="range" min={0} max={20} value={waste} onChange={e => setWaste(+e.target.value)} className="w-full accent-[var(--accent-500)]" />
            </div>
            <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Area</p>
              <p className="font-mono-num text-[16px] font-bold text-[var(--ink-900)]">{area.toFixed(1)} <span className="text-[11px] font-normal text-[var(--ink-500)]">m²</span></p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <SystemPicker side="A" value={leftCode}  onChange={setLeftCode}  exclude={rightCode} sys={left}  highlight={tally.winner === "left"} />
        <SystemPicker side="B" value={rightCode} onChange={setRightCode} exclude={leftCode}  sys={right} highlight={tally.winner === "right"} />
      </div>

      {sameSystem && (
        <div className="glass-card rounded-2xl px-5 py-3 text-[12.5px] text-[var(--amber-500)]">
          Pick two different systems to see the diff.
        </div>
      )}

      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[var(--accent-500)]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Performance</p>
          </div>
          <DiffLegend />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
          {perfDecorated.map(row => (
            <RowGrid key={row.k}
              label={<span className="inline-flex items-center gap-1.5"><span className="text-[var(--accent-500)]">{row.icon}</span>{row.k}</span>}
              left={<PerfCell value={row.l} unit={row.unit} winner={row.winner === "left"} decisive={row.decisive && row.winner === "left"} />}
              right={<PerfCell value={row.r} unit={row.unit} winner={row.winner === "right"} decisive={row.decisive && row.winner === "right"} />}
            />
          ))}
        </div>
        {tally.winner && !sameSystem && (
          <div className="border-t border-[var(--ink-200)]/60 bg-[var(--ink-50)]/40 px-5 py-2.5 text-[11.5px] text-[var(--ink-700)]">
            <strong>System {tally.winner === "left" ? "A" : "B"}</strong> wins {Math.max(tally.l, tally.r)}–{Math.min(tally.l, tally.r)} on performance metrics.
            {perfDecorated.some(r => r.decisive) && <span className="text-[var(--ink-500)]"> Highlighted rows have a ≥20% gap.</span>}
          </div>
        )}
      </section>

      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Aggregated material totals</p>
          <p className="text-[11px] text-[var(--ink-500)]">Lower quantity highlighted</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
          {totalsRows.map(row => {
            const exclusive = row.l === 0 || row.r === 0;
            const winner = exclusive ? null : compareNum(row.l, row.r, false);
            return (
              <RowGrid key={row.item}
                label={<span className="text-[var(--ink-900)]">{row.item}</span>}
                left={
                  row.l === 0
                    ? <ExclusiveCell side="A" />
                    : <QtyCell value={row.l} unit={row.unit} winner={winner === "left"} />
                }
                right={
                  row.r === 0
                    ? <ExclusiveCell side="B" />
                    : <QtyCell value={row.r} unit={row.unit} winner={winner === "right"} />
                }
              />
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => toast.success("Comparison exported", { description: "PDF ready" })}>
          <Download className="mr-1.5 h-4 w-4" /> Export comparison
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => onPromote(left.code, "Loaded System A")}>Load A → calculator</Button>
        <Button variant="outline" className="gap-1.5" onClick={() => onPromote(right.code, "Loaded System B")}>Load B → calculator</Button>
        <Button
          disabled={!winnerCode || sameSystem}
          className="gap-1.5"
          onClick={() => {
            if (!winnerCode) return;
            const side = tally.winner === "left" ? "A" : "B";
            onPromote(winnerCode, `Pick winner — System ${side} wins ${Math.max(tally.l, tally.r)}–${Math.min(tally.l, tally.r)}`);
          }}
        >
          <Check className="h-4 w-4" /> Pick winner & load
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPARE — building blocks
// =============================================================================
function SystemPicker({
  side, value, onChange, exclude, sys, highlight,
}: {
  side: "A" | "B";
  value: string;
  onChange: (v: string) => void;
  exclude: string;
  sys: SystemDef;
  highlight?: boolean;
}) {
  const accent = side === "A" ? "var(--accent-500)" : "var(--teal-500)";
  return (
    <div
      className="glass-card overflow-hidden rounded-2xl"
      style={highlight ? { boxShadow: `0 0 0 2px color-mix(in oklab, ${accent} 50%, transparent)` } : undefined}
    >
      <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 px-5 py-3" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 14%, transparent), transparent)` }}>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
          <span className="font-mono-num inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: accent }}>{side}</span>
          System {side}
          {highlight && <span className="ml-2 rounded-full bg-[var(--green-600)]/15 px-2 py-0.5 text-[9.5px] font-semibold text-[var(--green-600)]">Winning</span>}
        </p>
        <p className="font-mono-num text-[10.5px] text-[var(--ink-500)]">{sys.code}</p>
      </div>
      <div className="p-5">
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Choose system</p>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium"
        >
          {LIBRARY.map(s => (
            <option key={s.code} value={s.code} disabled={s.code === exclude}>
              {s.code} — {s.shortName}
            </option>
          ))}
        </select>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--ink-700)]">{sys.desc}</p>
      </div>
    </div>
  );
}

function RowGrid({ label, left, right }: { label: React.ReactNode; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <>
      <div className="px-5 py-2.5 text-[12px] text-[var(--ink-500)] [grid-column:1]">{left}</div>
      <div className="border-x border-[var(--ink-200)]/60 px-4 py-2.5 text-center font-medium text-[var(--ink-700)] [grid-column:2]">{label}</div>
      <div className="px-5 py-2.5 text-right text-[12px] [grid-column:3]">{right}</div>
    </>
  );
}

function PerfCell({ value, unit, winner, decisive }: { value: number; unit: string; winner: boolean; decisive?: boolean }) {
  if (value === 0) return <span className="text-[var(--ink-500)]">—</span>;
  return (
    <span className={`font-mono-num inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${
      winner
        ? decisive
          ? "bg-[var(--green-600)]/22 text-[var(--green-600)] ring-1 ring-[var(--green-600)]/40"
          : "bg-[var(--green-600)]/12 text-[var(--green-600)]"
        : "text-[var(--ink-900)]"
    }`}>
      {winner && <Check className="h-3 w-3" />}
      {value.toLocaleString()} <span className="text-[10.5px] font-normal text-[var(--ink-500)]">{unit}</span>
      {decisive && winner && <span className="ml-1 rounded-sm bg-[var(--green-600)] px-1 text-[8.5px] font-bold text-white">×{Math.round(((Math.max(value, 1)) / Math.max(1, value)) * 100) > 0 ? "" : ""}DECISIVE</span>}
    </span>
  );
}

function QtyCell({ value, unit, winner }: { value: number; unit: string; winner: boolean }) {
  return (
    <span className={`font-mono-num inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${
      winner ? "bg-[var(--green-600)]/12 text-[var(--green-600)]" : "text-[var(--ink-900)]"
    }`}>
      {winner ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3 opacity-30" />}
      {fmtQty(value)} <span className="text-[10.5px] font-normal text-[var(--ink-500)]">{unit}</span>
    </span>
  );
}

function ExclusiveCell({ side }: { side: "A" | "B" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--amber-500)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--amber-500)]">
      <ArrowUp className="h-3 w-3" /> Only in {side}
    </span>
  );
}

function DiffLegend() {
  return (
    <div className="hidden gap-3 text-[10.5px] text-[var(--ink-500)] sm:flex">
      <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-[var(--green-600)]" /> Better</span>
      <span className="inline-flex items-center gap-1"><Minus className="h-3 w-3" /> Same / lower</span>
    </div>
  );
}

// =============================================================================
// helpers
// =============================================================================
function ModeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active ? "bg-[var(--accent-500)] text-white shadow-sm" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="step-badge">{n}</span>
      <h2 className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">{label}</h2>
      <span className="ml-3 hidden h-px flex-1 bg-gradient-to-r from-[var(--ink-200)] to-transparent sm:block" />
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, unit,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
        {unit && <span className="font-mono-num text-[10.5px] font-medium text-[var(--ink-500)]">{unit}</span>}
      </div>
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

function scaledTotals(sys: SystemDef, area: number, wasteFactor: number) {
  return Object.entries(sys.totalsPerM2).map(([item, { qty, unit }]) => ({
    item, unit, qty: qty * area * wasteFactor,
  }));
}

function totalAreaGrossOf(walls: WallInput[]) {
  return walls.reduce((a, w) => a + (w.heightMm * w.lengthMm) / 1_000_000, 0);
}
function sumOpenings(walls: WallInput[]) {
  return walls.reduce((a, w) => a + (w.openingsM2 ?? 0), 0);
}

function fmtQty(n: number) {
  if (n >= 100) return Math.round(n).toLocaleString();
  if (n >= 10)  return n.toFixed(1);
  return n.toFixed(2);
}

function compareNum(a: number, b: number, higherBetter: boolean): "left" | "right" | "tie" {
  if (a === b) return "tie";
  if (a === 0) return "right";
  if (b === 0) return "left";
  if (higherBetter) return a > b ? "left" : "right";
  return a < b ? "left" : "right";
}

function exportBoQCsv(
  sys: SystemDef,
  walls: WallInput[],
  totals: { item: string; qty: number; unit: string }[],
  plan: ReturnType<typeof planWalls>,
) {
  const lines: string[] = [];
  lines.push("# BG System Calculator — BoQ export");
  lines.push(`# System,${sys.code},${sys.shortName}`);
  lines.push(`# Generated,${new Date().toISOString()}`);
  lines.push("");
  lines.push("Section,Item,Qty,Unit");
  lines.push(`Walls,Total walls,${walls.length},count`);
  walls.forEach(w => {
    lines.push(`Walls,${w.name} (${(w.lengthMm / 1000).toFixed(2)}m × ${(w.heightMm / 1000).toFixed(2)}m),${((w.heightMm * w.lengthMm) / 1_000_000 - (w.openingsM2 ?? 0)).toFixed(2)},m²`);
  });
  lines.push("");
  const firstWallBoard = plan.walls[0]?.boardLabel ?? "";
  lines.push(`Boards,${firstWallBoard},${plan.totalBoardsBought},boards`);
  lines.push(`Boards,Net waste %,${plan.netWastePct},%`);
  lines.push(`Boards,Material cost,${plan.totalCost.toFixed(2)},GBP`);
  lines.push(`Boards,Scrap cost,${plan.scrapCost.toFixed(2)},GBP`);
  lines.push("");
  totals.forEach(t => {
    lines.push(`Materials,"${t.item.replace(/"/g, '""')}",${fmtQty(t.qty)},${t.unit}`);
  });
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `boq-${sys.code.replace(/\s+/g, "-")}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("BoQ exported", { description: a.download });
}

// suppress lint about unused Tier import (kept for future)
void (null as unknown as Tier);
