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
