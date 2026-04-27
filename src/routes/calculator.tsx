import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Search, Sparkles, Download, Shield, Layers, Ruler, Volume2, Flame,
  ArrowRight, Wand2, RotateCcw, GitCompare, Check, ArrowDown, ArrowUp, Minus, Lightbulb,
  ChevronDown, Scissors, PoundSterling,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { pushToTray, readSlots, setSlot, subscribe } from "@/lib/compareTray";
import { BOARD_LIBRARY, recommendBoard, boardOffcutWaste, getAvailableBoards, piecesPerColumn, boardNetWasteWithReuse, recommendBoardSmart, planWalls, type WallInput } from "@/lib/boardSizing";
import { fireTier, acousticTier, heightTier, bestTier, tierColorVar, type Tier } from "@/lib/impact";
import { TierMetric as TierChip } from "@/components/TierMetric";
import { validateGeometry, hasErrors } from "@/lib/calcValidation";
import { ColumnDiagram } from "@/components/calculator/ColumnDiagram";
import { WallEditor } from "@/components/calculator/WallEditor";

export const Route = createFileRoute("/calculator")({ component: Calculator });

// =============================================================================
// SYSTEM LIBRARY (structured for compare)
// =============================================================================
type Perf = {
  weight: number;     // kg/m²
  maxHeight: number;  // mm
  studCentres: number;// mm
  fire: number;       // minutes (0 = none)
  rw: number;         // dB     (0 = none)
};
type Totals = Record<string, { qty: number; unit: string }>;
type SystemDef = {
  code: string;
  shortName: string;
  desc: string;
  buildUp: { k: string; v: string }[];
  perf: Perf;
  // qty is per m² of wall — multiplied by area in render
  totalsPerM2: Totals;
  // Board sizes the manufacturer actually supplies for this system.
  // Subset of BOARD_LIBRARY labels. If omitted, all boards are assumed available.
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
    availableBoards: ["1200 × 2400", "1200 × 3000"], // DuraLine 15: no 3600 in this thickness
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
    availableBoards: ["1200 × 2400", "1200 × 3000", "1200 × 3600"], // WallBoard 12.5: full range
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
    availableBoards: ["1200 × 2400", "1200 × 3000"], // SoundBloc 15: heavier, no 3600
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
// COMPONENT
// =============================================================================
type Mode = "code" | "recommend" | "compare";

function Calculator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("code");
  const [length, setLength] = useState("50");
  const [height, setHeight] = useState("4");
  const [waste, setWaste]   = useState(5);

  // Compare-mode state
  const [leftCode,  setLeftCode]  = useState<string>(LIBRARY[0].code);
  const [rightCode, setRightCode] = useState<string>(LIBRARY[1].code);

  // Active system shown in SingleView (By code / Recommend)
  const [activeCode, setActiveCode] = useState<string>(LIBRARY[0].code);

  // Board sizing — "auto" lets us derive the best board from height to minimise waste.
  const [boardSize, setBoardSize] = useState<string>("auto");
  // When true, the recommender and waste table assume off-cuts that still carry a
  // factory edge will be re-used in subsequent columns / walls. Reflects realistic
  // site practice where large off-cuts top a column near the ceiling/skirting.
  const [reuseOffcuts, setReuseOffcuts] = useState<boolean>(false);

  // On mount: if URL says ?mode=compare or the tray has slots, switch to compare
  // and hydrate left/right from the tray. Then keep them in sync with the tray.
  useEffect(() => {
    const url = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const slots = readSlots();
    const wantsCompare = url?.get("mode") === "compare" || !!(slots.A && slots.B);
    if (wantsCompare) setMode("compare");
    if (slots.A && LIBRARY.some(s => s.code === slots.A)) setLeftCode(slots.A);
    if (slots.B && LIBRARY.some(s => s.code === slots.B)) setRightCode(slots.B);

    return subscribe(() => {
      const s = readSlots();
      if (s.A && LIBRARY.some(x => x.code === s.A)) setLeftCode(s.A);
      if (s.B && LIBRARY.some(x => x.code === s.B)) setRightCode(s.B);
    });
  }, []);

  // When the user changes a picker in compare view, mirror it back to the tray.
  const setLeftAndSync = (v: string) => { setLeftCode(v); setSlot("A", v); };
  const setRightAndSync = (v: string) => { setRightCode(v); setSlot("B", v); };

  const area = +length * +height;
  const wasteFactor = 1 + waste / 100;

  // Promote one side of the comparison into the single-system calculator.
  const promoteToCalculator = (code: string, label?: string) => {
    setActiveCode(code);
    setMode("code");
    toast.success(label ?? "Loaded into calculator", { description: code });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="glass-bg -m-6 min-h-[calc(100vh-4rem)] p-6 md:-m-8 md:p-10">
      <div className="relative space-y-8">
        {/* Hero */}
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

          {/* Mode toggle */}
          <div className="glass-card inline-flex rounded-full p-1">
            <ModeBtn active={mode === "code"}      onClick={() => setMode("code")}      icon={<Search className="h-3.5 w-3.5" />}      label="By code" />
            <ModeBtn active={mode === "recommend"} onClick={() => setMode("recommend")} icon={<Sparkles className="h-3.5 w-3.5" />}    label="Recommend" />
            <ModeBtn active={mode === "compare"}   onClick={() => setMode("compare")}   icon={<GitCompare className="h-3.5 w-3.5" />}  label="Compare" />
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
                <Button className="w-full gap-1.5" onClick={() => { setMode("code"); toast.success("Loaded best match", { description: LIBRARY[0].code }); }}>
                  Recommend & load <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== COMPARE MODE ===================== */}
        {mode === "compare" ? (
          <CompareView
            leftCode={leftCode}  setLeftCode={setLeftAndSync}
            rightCode={rightCode} setRightCode={setRightAndSync}
            length={length} setLength={setLength}
            height={height} setHeight={setHeight}
            waste={waste}   setWaste={setWaste}
            area={area} wasteFactor={wasteFactor}
            onPromote={promoteToCalculator}
          />
        ) : (
          /* ===================== SINGLE-SYSTEM MODE ===================== */
          <SingleView
            activeCode={activeCode} setActiveCode={setActiveCode}
            length={length} setLength={setLength}
            height={height} setHeight={setHeight}
            waste={waste}   setWaste={setWaste}
            boardSize={boardSize} setBoardSize={setBoardSize}
            reuseOffcuts={reuseOffcuts} setReuseOffcuts={setReuseOffcuts}
            area={area} wasteFactor={wasteFactor}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SINGLE-SYSTEM VIEW (existing layout, scaled to area)
// =============================================================================
function SingleView({
  activeCode, setActiveCode,
  length, setLength, height, setHeight, waste, setWaste,
  boardSize, setBoardSize,
  reuseOffcuts, setReuseOffcuts,
  area, wasteFactor, navigate,
}: {
  activeCode: string; setActiveCode: (v: string) => void;
  length: string; setLength: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  waste: number;  setWaste: (v: number) => void;
  boardSize: string; setBoardSize: (v: string) => void;
  reuseOffcuts: boolean; setReuseOffcuts: (v: boolean) => void;
  area: number;   wasteFactor: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const sys = LIBRARY.find(s => s.code === activeCode) ?? LIBRARY[0];
  const errs = validateGeometry(length, height, waste);
  const invalid = hasErrors(errs);
  const totals = scaledTotals(sys, area, wasteFactor);

  // Recommendation: pick the smallest board ≥ wall height to minimise off-cuts.
  // Wall height in mm; board catalogue (W × H, mm).
  const heightMm = Math.round((+height || 0) * 1000);
  const lengthMm = Math.round((+length || 0) * 1000);
  const availableBoards = getAvailableBoards(sys.availableBoards);
  const recommended = recommendBoardSmart(heightMm, lengthMm, sys.availableBoards, reuseOffcuts);
  const effectiveBoard = boardSize === "auto" ? recommended.label : boardSize;
  const cutWastePct = reuseOffcuts
    ? boardNetWasteWithReuse(heightMm, lengthMm, effectiveBoard)
    : boardOffcutWaste(heightMm, effectiveBoard);

  // ─── Plan all walls (drawer): multi-wall, off-cut re-use cross-wall, cost ──
  const [planOpen, setPlanOpen] = useState(false);
  const [extraWalls, setExtraWalls] = useState<WallInput[]>([]);
  const [reuseAcrossWalls, setReuseAcrossWalls] = useState(true);

  // Always include the current wall as "Wall 1" — synced from the main inputs.
  const allWalls = useMemo<WallInput[]>(() => {
    const w1: WallInput = {
      id: "wall-current",
      name: "Wall 1 (current)",
      heightMm,
      lengthMm,
      openingsM2: 0,
    };
    return [w1, ...extraWalls];
  }, [heightMm, lengthMm, extraWalls]);

  const projectPlan = useMemo(
    () =>
      heightMm > 0 && lengthMm > 0
        ? planWalls(allWalls, effectiveBoard, { reuseAcrossWalls })
        : null,
    [allWalls, effectiveBoard, reuseAcrossWalls, heightMm, lengthMm],
  );

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
          <p className="mt-3 text-[12px] text-[var(--ink-500)]">Type a code and press Load. Data comes from the live System Catalog.</p>

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
          <SectionTitle n="02" label="Geometry & finish" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Length" unit="m" value={length} onChange={setLength} error={errs.length} hint="Required — wall length, e.g. 12.5" />
            <Field label="Height" unit="m" value={height} onChange={setHeight} error={errs.height} hint="Required — floor to ceiling, e.g. 3.0" />
            <Select label="Stud Centres" options={["400 mm","600 mm","Other"]} defaultValue="600 mm" />
            <div>
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Board Size</p>
              <select
                value={boardSize}
                onChange={e => setBoardSize(e.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium"
              >
                <option value="auto">Auto — recommended</option>
                {availableBoards.map(b => (
                  <option key={b.label} value={b.label}>{b.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--ink-500)]">
                {availableBoards.length} size{availableBoards.length === 1 ? "" : "s"} supplied for {sys.shortName}
              </p>
            </div>
            <Select label="Finish" options={["Tape & Joint","Skim","Direct decorate"]} defaultValue="Tape & Joint" />
            <Select label="Stage"  options={["Both","Frame only","Board only"]} defaultValue="Both" />
          </div>

          {/* Board recommendation chip — always visible, hints user when height is missing */}
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--accent-500)]/25 bg-[var(--accent-500)]/5 px-4 py-3 text-[12.5px]">
            <Lightbulb className="h-4 w-4 shrink-0 text-[var(--accent-500)]" />
            <span className="text-[var(--ink-700)]">
              {heightMm <= 0 ? (
                <>Enter a wall <strong>height</strong> and we'll auto-pick the board size that minimises off-cut waste.</>
              ) : boardSize === "auto" ? (
                <>For <strong>{(+height).toFixed(2)} m</strong> wall we recommend <strong className="font-mono-num">{recommended.label}</strong> — {recommended.reason.toLowerCase()}.</>
              ) : (
                <>Using <strong className="font-mono-num">{effectiveBoard}</strong>. Auto would pick <strong className="font-mono-num">{recommended.label}</strong>.</>
              )}
            </span>
            {heightMm > 0 && (
              <span className="ml-auto inline-flex items-center gap-1.5">
                <span className="font-mono-num rounded-md bg-[var(--card)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
                  Cut waste {cutWastePct}%
                </span>
                {recommended.needsHorizontalJoint && (
                  <span className="font-mono-num rounded-md bg-[var(--amber-500)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--amber-500)]">
                    + horizontal joint
                  </span>
                )}
                {boardSize !== "auto" && boardSize !== recommended.label && (
                  <button
                    onClick={() => { setBoardSize("auto"); toast.success("Switched to recommended board", { description: recommended.label }); }}
                    className="rounded-md bg-[var(--accent-500)] px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90"
                  >
                    Use recommended
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Board comparison table — shows waste for every size the manufacturer supplies */}
          {heightMm > 0 && availableBoards.length > 1 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--ink-200)]">
              <div className="flex items-center justify-between border-b border-[var(--ink-200)] bg-[var(--ink-100)]/50 px-3 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                  Available boards for {sys.shortName}
                </p>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                    <input
                      type="checkbox"
                      checked={reuseOffcuts}
                      onChange={e => setReuseOffcuts(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[var(--accent-500)]"
                    />
                    Account for off-cut reuse
                  </label>
                  <p className="text-[10.5px] text-[var(--ink-500)]">Wall {(+height).toFixed(2)} m × {(+length || 0).toFixed(2)} m</p>
                </div>
              </div>
              <table className="w-full text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <tr className="border-b border-[var(--ink-200)]">
                    <th className="px-3 py-2 text-left font-semibold">Board size</th>
                    <th className="px-3 py-2 text-right font-semibold">Pieces / column</th>
                    <th className="px-3 py-2 text-right font-semibold">{reuseOffcuts ? "Net waste (after reuse)" : "Off-cut waste"}</th>
                    <th className="px-3 py-2 text-right font-semibold">Notes</th>
                    <th className="px-3 py-2 text-right font-semibold sr-only">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableBoards.map(b => {
                    const w = reuseOffcuts
                      ? boardNetWasteWithReuse(heightMm, lengthMm, b.label)
                      : boardOffcutWaste(heightMm, b.label);
                    const pieces = piecesPerColumn(heightMm, b.label);
                    const isRecommended = b.label === recommended.label;
                    const isSelected = effectiveBoard === b.label;
                    const needsJoint = pieces > 1;
                    const tone =
                      w <= 5  ? "var(--tier-good)"
                      : w <= 15 ? "var(--accent-500)"
                      : w <= 25 ? "var(--amber-500)"
                      :           "var(--tier-critical)";
                    return (
                      <tr
                        key={b.label}
                        className={
                          "border-b border-[var(--ink-200)] last:border-b-0 " +
                          (isSelected ? "bg-[var(--accent-500)]/5" : "")
                        }
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-semibold text-[var(--ink-900)]">{b.label}</span>
                            {isRecommended && (
                              <span className="rounded-full bg-[var(--accent-500)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
                                Recommended
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono-num px-3 py-2 text-right text-[var(--ink-700)]">{pieces}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className="font-mono-num inline-block rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                            style={{
                              color: tone,
                              background: `color-mix(in oklab, ${tone} 12%, transparent)`,
                            }}
                          >
                            {w}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-[11.5px] text-[var(--ink-500)]">
                          {needsJoint ? `${pieces} pieces stacked + horizontal joint` : "Single piece, no joint"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isSelected ? (
                            <span className="text-[11px] font-semibold text-[var(--accent-500)]">In use</span>
                          ) : (
                            <button
                              onClick={() => setBoardSize(b.label)}
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
            </div>
          )}

          {/* ───── Plan all walls (multi-wall + cutting strategy + cost) ───── */}
          {heightMm > 0 && lengthMm > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--ink-200)]">
              <button
                type="button"
                onClick={() => setPlanOpen(o => !o)}
                className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-[var(--accent-500)]/8 to-transparent px-3 py-2.5 text-left transition-colors hover:from-[var(--accent-500)]/14"
                aria-expanded={planOpen}
              >
                <span className="flex items-center gap-2">
                  <Scissors className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-900)]">
                    Plan all walls — cutting strategy &amp; project total
                  </span>
                  {projectPlan && allWalls.length > 1 && (
                    <span className="font-mono-num rounded-md bg-[var(--accent-500)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-500)]">
                      {allWalls.length} walls
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-[var(--ink-500)]">
                  {projectPlan && (
                    <>
                      <span className="font-mono-num">{projectPlan.totalBoardsBought} boards</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">£{projectPlan.totalCost.toFixed(0)}</span>
                    </>
                  )}
                  <ChevronDown className={"h-4 w-4 transition-transform " + (planOpen ? "rotate-180" : "")} />
                </span>
              </button>

              {planOpen && projectPlan && (
                <div className="space-y-4 border-t border-[var(--ink-200)] bg-[var(--ink-50)]/30 p-4">
                  <p className="text-[11.5px] leading-relaxed text-[var(--ink-700)]">
                    Add every wall built with <span className="font-mono-num font-semibold">{sys.shortName}</span> using <span className="font-mono-num font-semibold">{effectiveBoard}</span>.
                    The planner simulates board cutting wall-by-wall and reuses off-cuts that still have a factory edge — exactly as on site.
                  </p>

                  {/* Multi-wall editor */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                        Walls in this system ({allWalls.length})
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                        <input
                          type="checkbox"
                          checked={reuseAcrossWalls}
                          onChange={e => setReuseAcrossWalls(e.target.checked)}
                          className="h-3.5 w-3.5 accent-[var(--accent-500)]"
                        />
                        Re-use off-cuts across walls
                      </label>
                    </div>
                    <WallEditor
                      walls={allWalls}
                      onChange={(next) => {
                        // Wall 1 is locked (synced to main inputs); only persist extras.
                        setExtraWalls(next.filter(w => w.id !== "wall-current"));
                      }}
                    />
                  </div>

                  {/* Project total + cutting diagram */}
                  <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                    <ColumnDiagram plan={projectPlan.walls[0]} maxHeightPx={180} />
                    <div className="space-y-2 rounded-xl border border-[var(--ink-200)] bg-[var(--card)] p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                        <PoundSterling className="h-3 w-3" />
                        Project totals
                      </div>
                      <Stat label="Boards bought" value={`${projectPlan.totalBoardsBought}`} />
                      <Stat label="Wall area covered" value={`${projectPlan.totalWallAreaM2.toFixed(1)} m²`} />
                      <Stat label="Net waste" value={`${projectPlan.netWastePct}%`} tone={projectPlan.netWastePct <= 10 ? "good" : projectPlan.netWastePct <= 20 ? "warn" : "bad"} />
                      <div className="my-1 border-t border-[var(--ink-200)]" />
                      <Stat label="Board cost" value={`£${projectPlan.totalCost.toFixed(0)}`} strong />
                      <Stat label="Of which scrap" value={`£${projectPlan.scrapCost.toFixed(0)}`} tone="bad" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  const first = errs.length || errs.height || errs.waste;
                  toast.error("Please fix the highlighted fields", { description: first ?? undefined });
                  return;
                }
                toast.success("BoQ calculated", { description: `${sys.code} · ${area.toLocaleString()} m²` });
              }}
            >
              <Sparkles className="h-4 w-4" /> Calculate BoQ
            </Button>
            <Button size="lg" variant="outline" onClick={() => { setLength("50"); setHeight("4"); setWaste(5); toast("Reset to defaults"); }}>
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
            <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Wall area</p>
            <p className={"font-display mt-1 text-[44px] font-bold leading-none tracking-tight " + (invalid ? "text-[var(--ink-500)]" : "impact-number")}>
              {invalid ? "—" : area.toLocaleString()}<span className="ml-1 text-[16px] font-medium text-[var(--ink-500)]">m²</span>
            </p>
            <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">{length || "—"} m × {height || "—"} m · waste {waste}%</p>
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
            <Button className="w-full gap-2" size="lg" disabled={invalid} onClick={() => toast.success("BoQ exported", { description: "CSV ready" })}>
              <Download className="h-4 w-4" /> Export BoQ
            </Button>
            <Button className="w-full" variant="outline" disabled={invalid} onClick={() => { toast.success("Added to project BoQ"); navigate({ to: "/costed-boq" }); }}>
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
  length, setLength, height, setHeight, waste, setWaste,
  area, wasteFactor, onPromote,
}: {
  leftCode: string;  setLeftCode: (v: string) => void;
  rightCode: string; setRightCode: (v: string) => void;
  length: string;    setLength: (v: string) => void;
  height: string;    setHeight: (v: string) => void;
  waste: number;     setWaste: (v: number) => void;
  area: number;      wasteFactor: number;
  onPromote: (code: string, label?: string) => void;
}) {
  const left  = LIBRARY.find(s => s.code === leftCode)  ?? LIBRARY[0];
  const right = LIBRARY.find(s => s.code === rightCode) ?? LIBRARY[1];
  const sameSystem = left.code === right.code;

  // Perf rows for diff (higher = better unless noted)
  const perfRows = useMemo(() => ([
    { k: "Max Height",   unit: "mm",    icon: <Ruler   className="h-3 w-3" />, l: left.perf.maxHeight,   r: right.perf.maxHeight,   higherBetter: true  },
    { k: "Fire",         unit: "min",   icon: <Flame   className="h-3 w-3" />, l: left.perf.fire,        r: right.perf.fire,        higherBetter: true  },
    { k: "Acoustic Rw",  unit: "dB",    icon: <Volume2 className="h-3 w-3" />, l: left.perf.rw,          r: right.perf.rw,          higherBetter: true  },
    { k: "Stud Centres", unit: "mm",    icon: <Layers  className="h-3 w-3" />, l: left.perf.studCentres, r: right.perf.studCentres, higherBetter: false },
    { k: "Weight",       unit: "kg/m²", icon: <Layers  className="h-3 w-3" />, l: left.perf.weight,      r: right.perf.weight,      higherBetter: false },
  ]), [left, right]);

  // Tally perf wins to suggest a default winner. Ties don't count.
  const tally = useMemo(() => {
    let l = 0, r = 0;
    for (const row of perfRows) {
      const w = compareNum(row.l, row.r, row.higherBetter);
      if (w === "left") l++;
      else if (w === "right") r++;
    }
    return { l, r, winner: l === r ? null : l > r ? ("left" as const) : ("right" as const) };
  }, [perfRows]);

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
      return {
        item,
        unit: a?.unit ?? b?.unit ?? "",
        l: a?.qty ?? 0,
        r: b?.qty ?? 0,
      };
    });
  }, [left, right, area, wasteFactor]);

  return (
    <div className="space-y-6">
      {/* Geometry — shared inputs */}
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-[var(--accent-500)]" />
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
              Compare two systems · same area
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <div className="w-28"><Field label="Length" unit="m" value={length} onChange={setLength} error={validateGeometry(length, height, waste).length} /></div>
            <div className="w-28"><Field label="Height" unit="m" value={height} onChange={setHeight} error={validateGeometry(length, height, waste).height} /></div>
            <div className="w-32">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Waste {waste}%</p>
              <input type="range" min={0} max={20} value={waste} onChange={e => setWaste(+e.target.value)} className="w-full accent-[var(--accent-500)]" />
            </div>
            <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Area</p>
              <p className="font-mono-num text-[16px] font-bold text-[var(--ink-900)]">{area.toLocaleString()} <span className="text-[11px] font-normal text-[var(--ink-500)]">m²</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Two pickers */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SystemPicker side="A" value={leftCode}  onChange={setLeftCode}  exclude={rightCode} sys={left} />
        <SystemPicker side="B" value={rightCode} onChange={setRightCode} exclude={leftCode}  sys={right} />
      </div>

      {sameSystem && (
        <div className="glass-card rounded-2xl px-5 py-3 text-[12.5px] text-[var(--amber-500)]">
          Pick two different systems to see the diff.
        </div>
      )}

      {/* Performance comparison */}
      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Performance</p>
          <DiffLegend />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
          {perfRows.map(row => {
            const diff = compareNum(row.l, row.r, row.higherBetter);
            return (
              <RowGrid key={row.k}
                label={<span className="inline-flex items-center gap-1.5"><span className="text-[var(--accent-500)]">{row.icon}</span>{row.k}</span>}
                left={<PerfCell value={row.l} unit={row.unit} winner={diff === "left"} />}
                right={<PerfCell value={row.r} unit={row.unit} winner={diff === "right"} />}
              />
            );
          })}
        </div>
      </section>

      {/* Aggregated totals comparison */}
      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 bg-gradient-to-br from-[var(--accent-500)]/10 to-transparent px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">Aggregated material totals</p>
          <p className="text-[11px] text-[var(--ink-500)]">Lower quantity highlighted</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] divide-y divide-[var(--ink-200)]/60 text-[12.5px]">
          {totalsRows.map(row => {
            // For materials, "lower" is the winning side (less consumption).
            // Items present on only one side flag as "exclusive".
            const exclusive = row.l === 0 || row.r === 0;
            const winner = exclusive ? null : compareNum(row.l, row.r, false); // lower better
            return (
              <RowGrid key={row.item}
                label={<span className="text-[var(--ink-900)]">{row.item}</span>}
                left={
                  row.l === 0
                    ? <ExclusiveCell side="A" />
                    : <QtyCell value={row.l} unit={row.unit} winner={winner === "left"}  exclusive={exclusive && row.r === 0} />
                }
                right={
                  row.r === 0
                    ? <ExclusiveCell side="B" />
                    : <QtyCell value={row.r} unit={row.unit} winner={winner === "right"} exclusive={exclusive && row.l === 0} />
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
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => onPromote(left.code, "Loaded System A")}
        >
          Load A → calculator
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => onPromote(right.code, "Loaded System B")}
        >
          Load B → calculator
        </Button>
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
  side, value, onChange, exclude, sys,
}: {
  side: "A" | "B";
  value: string;
  onChange: (v: string) => void;
  exclude: string;
  sys: SystemDef;
}) {
  const accent = side === "A" ? "var(--accent-500)" : "var(--teal-500)";
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--ink-200)]/60 px-5 py-3" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 14%, transparent), transparent)` }}>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
          <span className="font-mono-num inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: accent }}>{side}</span>
          System {side}
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

function PerfCell({ value, unit, winner }: { value: number; unit: string; winner: boolean }) {
  if (value === 0) return <span className="text-[var(--ink-500)]">—</span>;
  return (
    <span className={`font-mono-num inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${
      winner
        ? "bg-[var(--green-600)]/12 text-[var(--green-600)]"
        : "text-[var(--ink-900)]"
    }`}>
      {winner && <Check className="h-3 w-3" />}
      {value.toLocaleString()} <span className="text-[10.5px] font-normal text-[var(--ink-500)]">{unit}</span>
    </span>
  );
}

function QtyCell({ value, unit, winner }: { value: number; unit: string; winner: boolean; exclusive?: boolean }) {
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
  label, value, onChange, placeholder, unit, error, hint,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string | null;
  hint?: string;
}) {
  const [touched, setTouched] = React.useState(false);
  const isEmpty = !value || value.trim() === "";
  // "info" = gentle nudge (empty required field, or before user has interacted).
  // "error" = real validation error after the user has touched the field.
  const tone: "none" | "info" | "error" =
    !error ? "none" : (isEmpty || !touched) ? "info" : "error";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
        {unit && <span className="font-mono-num text-[10.5px] font-medium text-[var(--ink-500)]">{unit}</span>}
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-invalid={tone === "error"}
          aria-describedby={tone !== "none" ? `${label}-err` : undefined}
          className={
            "glass-input w-full rounded-xl px-3 py-2 text-[13px] font-medium placeholder:text-[var(--ink-500)] transition-shadow " +
            (tone === "error"
              ? "border-[var(--tier-critical)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--tier-critical)_14%,transparent)]"
              : tone === "info"
              ? "border-[var(--ink-200)]"
              : "")
          }
        />
        {tone === "error" && (
          <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tier-critical)]" />
        )}
      </div>
      {tone === "error" ? (
        <p id={`${label}-err`} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--tier-critical)]">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : tone === "info" ? (
        <p id={`${label}-err`} className="mt-1 text-[11px] text-[var(--ink-500)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-[var(--ink-500)]">{hint}</p>
      ) : null}
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

function perfChipsFor(sys: SystemDef) {
  return [
    { icon: <Volume2 className="h-3 w-3" />, k: "Approx. weight",  v: `${sys.perf.weight} kg/m²` },
    { icon: <Ruler   className="h-3 w-3" />, k: "Max Height",      v: `${sys.perf.maxHeight} mm` },
    { icon: <Layers  className="h-3 w-3" />, k: "Stud Centres",    v: `${sys.perf.studCentres} mm` },
  ];
}

function scaledTotals(sys: SystemDef, area: number, wasteFactor: number) {
  return Object.entries(sys.totalsPerM2).map(([item, { qty, unit }]) => ({
    item,
    unit,
    qty: qty * area * wasteFactor,
  }));
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

function Stat({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
  strong?: boolean;
}) {
  const colorVar =
    tone === "good" ? "var(--tier-good)" :
    tone === "warn" ? "var(--amber-500)" :
    tone === "bad"  ? "var(--tier-critical)" :
    "var(--ink-900)";
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <span className="text-[var(--ink-500)]">{label}</span>
      <span
        className={"font-mono-num tabular-nums " + (strong ? "text-[14px] font-bold" : "font-semibold")}
        style={{ color: colorVar }}
      >
        {value}
      </span>
    </div>
  );
}
