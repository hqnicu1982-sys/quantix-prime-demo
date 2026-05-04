// ============================================================================
// Shared BG system library
// Single source of truth for system codes, performance and per-m² material
// build-ups. Consumed by the Calculator and the System Catalog.
// ============================================================================

export type Perf = {
  weight: number;     // kg/m²
  maxHeight: number;  // mm
  studCentres: number;// mm
  fire: number;       // minutes (0 = none)
  rw: number;         // dB     (0 = none)
};

export type Totals = Record<string, { qty: number; unit: string }>;

// Top-level categories shown in the Calculator (mirrors the System Catalog).
// Keep ids stable — they're used to filter the system picker.
export type SystemCategory =
  | "walls"
  | "lining"
  | "shaft"
  | "ceilings"
  | "steel"
  | "floors"
  | "external"
  | "plasters";

export const SYSTEM_CATEGORIES: { id: SystemCategory; label: string; blurb: string }[] = [
  { id: "walls",    label: "Partitions",   blurb: "Internal partition walls" },
  { id: "lining",   label: "Wall linings", blurb: "Independent & direct linings" },
  { id: "shaft",    label: "Shaftwalls",   blurb: "Lift & service shafts" },
  { id: "ceilings", label: "Ceilings",     blurb: "MF & horizontal shaftwalls" },
  { id: "steel",    label: "Steel",        blurb: "Structural fire protection" },
  { id: "floors",   label: "Floors",       blurb: "Floating & acoustic floors" },
  { id: "external", label: "External",     blurb: "Lightweight external walls" },
  { id: "plasters", label: "Plasters",     blurb: "Skim & undercoat plasters" },
];

export type SystemDef = {
  code: string;
  shortName: string;
  desc: string;
  category: SystemCategory;
  buildUp: { k: string; v: string }[];
  perf: Perf;
  // Quantities are per m² of wall — multiply by area in render.
  totalsPerM2: Totals;
  // Board sizes the manufacturer actually supplies for this system.
  // Subset of BOARD_LIBRARY labels. If omitted, all boards are assumed available.
  availableBoards?: string[];
};

export const LIBRARY: SystemDef[] = [
  {
    code: "GIWL-146-I-80-1L-DL15 (B)",
    shortName: "DuraLine 15 · I-Stud 146",
    desc: "One layer of Gyproc DuraLine 15mm to one side of Gypframe 146 | 80 'I' Stud framework forming an independent lining. Heights up to 7200 mm.",
    category: "lining",
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
    category: "walls",
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
    category: "walls",
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
  // ──────────────────────────────────────────────────────────────────────────
  // Seed systems for the remaining catalog categories so the calculator tabs
  // are never empty. Quantities are representative — refine as real catalogue
  // data lands.
  // ──────────────────────────────────────────────────────────────────────────
  {
    code: "GSW-CH-90-2L-GF15",
    shortName: "Shaftwall · 2× Glasroc F 15",
    desc: "C-H stud shaftwall lined with two layers of Glasroc F 15 mm — 120 min fire, 52 dB Rw. Heights up to 8100 mm.",
    category: "shaft",
    buildUp: [
      { k: "Board type",            v: "Glasroc F" },
      { k: "Board thickness (mm)",  v: "15 (×2)" },
      { k: "Layers / Side",         v: "2 — 1" },
      { k: "Board size used",       v: "1200 × 2400" },
      { k: "Suggested stud length", v: "4.8 m" },
    ],
    perf: { weight: 32, maxHeight: 8100, studCentres: 600, fire: 120, rw: 52 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Gypframe C-H Stud (4.8m)":            { qty: 0.50, unit: "lengths" },
      "Gypframe J-Track (3.6m)":             { qty: 0.16, unit: "lengths" },
      "Glasroc F 15":                        { qty: 3.10, unit: "m²" },
      "Jointing":                            { qty: 1.60, unit: "kg" },
      "Sealant":                             { qty: 12.5, unit: "ml" },
    },
  },
  {
    code: "MF-CASOLINE-1L-WB15",
    shortName: "CasoLine MF ceiling · WallBoard 15",
    desc: "Suspended MF ceiling grid lined with one layer of Gyproc WallBoard 15 mm. 30 min fire, ~37 dB Rw.",
    category: "ceilings",
    buildUp: [
      { k: "Board type",            v: "Gyproc WallBoard" },
      { k: "Board thickness (mm)",  v: "15" },
      { k: "Grid",                  v: "MF5 / MF6 / MF7" },
      { k: "Board size used",       v: "1200 × 2400" },
    ],
    perf: { weight: 12, maxHeight: 0, studCentres: 400, fire: 30, rw: 37 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Gypframe MF5 Ceiling Section (3.6m)": { qty: 0.30, unit: "lengths" },
      "Gypframe MF6 Perimeter Channel (3.6m)": { qty: 0.10, unit: "lengths" },
      "Gypframe MF7 Primary Channel (3.6m)": { qty: 0.12, unit: "lengths" },
      "Hangers & soffit cleats":             { qty: 1.40, unit: "no." },
      "Gyproc WallBoard 15":                 { qty: 1.05, unit: "m²" },
      "Jointing":                            { qty: 0.50, unit: "kg" },
    },
  },
  {
    code: "FP-BEAM-2L-FL15",
    shortName: "Steel beam encasement · 2× FireLine 15",
    desc: "Three-sided beam encasement using two layers of Gyproc FireLine 15 mm — 90 min structural fire protection.",
    category: "steel",
    buildUp: [
      { k: "Board type",            v: "Gyproc FireLine" },
      { k: "Board thickness (mm)",  v: "15 (×2)" },
      { k: "Detail",                v: "3-sided box, screw-fixed" },
    ],
    perf: { weight: 24, maxHeight: 0, studCentres: 0, fire: 90, rw: 0 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Gyproc FireLine 15":                  { qty: 2.10, unit: "m²" },
      "Drywall screws (38mm/55mm)":          { qty: 18.0, unit: "no." },
      "Jointing":                            { qty: 1.10, unit: "kg" },
    },
  },
  {
    code: "FF-GYVLOC-65-FB",
    shortName: "Gyvlon floating floor · 65 mm screed",
    desc: "Acoustic floating floor: 25 mm Isover Floorboard + 65 mm Gyvlon screed. 18 dB ΔLw impact reduction.",
    category: "floors",
    buildUp: [
      { k: "Screed",                v: "Gyvlon 65 mm" },
      { k: "Resilient layer",       v: "Isover Floorboard 25 mm" },
      { k: "DPM",                   v: "Polythene 500g" },
    ],
    perf: { weight: 145, maxHeight: 0, studCentres: 0, fire: 0, rw: 0 },
    totalsPerM2: {
      "Gyvlon screed":                       { qty: 0.065, unit: "m³" },
      "Isover Floorboard 25":                { qty: 1.02, unit: "m²" },
      "Edge strip (10mm × 100mm)":           { qty: 0.50, unit: "lm" },
      "Polythene DPM 500g":                  { qty: 1.10, unit: "m²" },
    },
  },
  {
    code: "EXT-GYPLYNER-90-WS",
    shortName: "External wall · GypLyner Universal + WeatherShield",
    desc: "Lightweight external wall lining: GypLyner 90 framework, Weather Defence sheathing, single layer of Gyproc WallBoard internally.",
    category: "external",
    buildUp: [
      { k: "External sheathing",    v: "Glasroc X 12.5" },
      { k: "Framework",             v: "GypLyner 90" },
      { k: "Insulation",            v: "Isover RD Mineral Wool 90" },
      { k: "Internal board",        v: "Gyproc WallBoard 15" },
    ],
    perf: { weight: 38, maxHeight: 5400, studCentres: 600, fire: 60, rw: 47 },
    availableBoards: ["1200 × 2400", "1200 × 3000"],
    totalsPerM2: {
      "Glasroc X 12.5":                      { qty: 1.05, unit: "m²" },
      "GypLyner 90 framework":               { qty: 0.45, unit: "lengths" },
      "Isover RD 90":                        { qty: 1.00, unit: "m²" },
      "Gyproc WallBoard 15":                 { qty: 1.05, unit: "m²" },
      "Jointing":                            { qty: 0.80, unit: "kg" },
    },
  },
  {
    code: "PL-THISTLE-MF-2C",
    shortName: "Thistle MultiFinish · 2-coat skim",
    desc: "Two-coat plaster finish over plasterboard: Thistle Bond-It primer + Thistle MultiFinish skim, ~3 mm total.",
    category: "plasters",
    buildUp: [
      { k: "Primer",                v: "Thistle Bond-It" },
      { k: "Finish coat",           v: "Thistle MultiFinish ~3mm" },
    ],
    perf: { weight: 4, maxHeight: 0, studCentres: 0, fire: 0, rw: 0 },
    totalsPerM2: {
      "Thistle Bond-It":                     { qty: 0.30, unit: "kg" },
      "Thistle MultiFinish":                 { qty: 3.20, unit: "kg" },
      "Scrim tape":                          { qty: 1.20, unit: "lm" },
    },
  },
];

export function findSystem(code: string): SystemDef | undefined {
  return LIBRARY.find(s => s.code === code);
}

export function scaledTotals(sys: SystemDef, area: number, wasteFactor: number) {
  return Object.entries(sys.totalsPerM2).map(([item, { qty, unit }]) => ({
    item,
    unit,
    qty: qty * area * wasteFactor,
  }));
}
