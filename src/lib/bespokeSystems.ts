import { useEffect, useState } from "react";

// ============================================================================
// Bespoke wall systems — per project, fork of a BG library system.
// We keep performance numbers OFF by design (Rw / fire / max height) because
// any change in build-up invalidates BG SpecSure ratings. Only the build-up
// description and the materials totals are recalculated.
// ============================================================================

export type BoardChoice =
  | "Gyproc WallBoard 12.5"
  | "Gyproc WallBoard 15"
  | "Gyproc SoundBloc 12.5"
  | "Gyproc SoundBloc 15"
  | "Gyproc DuraLine 15"
  | "Gyproc FireLine 12.5"
  | "Gyproc FireLine 15"
  | "Glasroc F FireCase 20";

export const BOARD_CHOICES: BoardChoice[] = [
  "Gyproc WallBoard 12.5",
  "Gyproc WallBoard 15",
  "Gyproc SoundBloc 12.5",
  "Gyproc SoundBloc 15",
  "Gyproc DuraLine 15",
  "Gyproc FireLine 12.5",
  "Gyproc FireLine 15",
  "Glasroc F FireCase 20",
];

export type StudType = "C-Stud" | "I-Stud";
export type StudSize = 48 | 70 | 92 | 146;
export type StudCentres = 400 | 600;

export type Insulation =
  | { kind: "none" }
  | { kind: "isover-apr"; thicknessMm: 25 | 50 | 75 }
  | { kind: "rockwool-rw3"; thicknessMm: 50 | 75 | 100 };

export type BespokeBuildUp = {
  // Side A faces the room. B side may be empty (lining) or symmetrical (partition).
  sideA: BoardChoice[]; // ordered outermost -> frame
  sideB: BoardChoice[]; // empty array = lining only
  studType: StudType;
  studSize: StudSize;
  studCentres: StudCentres;
  insulation: Insulation;
  resilientBars: boolean;
  notes?: string;
};

export type BespokeSystem = {
  id: string;             // BSP-xxxxx
  parentCode: string;     // original BG code we forked from
  parentShortName: string;
  name: string;           // user-given label
  createdAt: number;
  buildUp: BespokeBuildUp;
};

const KEY = (projectId: string) => `qp-bespoke-systems-${projectId}`;
const EVT = "qp-bespoke-change";

function read(projectId: string): BespokeSystem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function write(projectId: string, systems: BespokeSystem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(systems));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

function uid() {
  return `BSP-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

export function saveBespoke(projectId: string, sys: Omit<BespokeSystem, "id" | "createdAt"> & { id?: string }): BespokeSystem {
  const list = read(projectId);
  if (sys.id) {
    const updated: BespokeSystem = { ...(list.find(s => s.id === sys.id) ?? { createdAt: Date.now() } as BespokeSystem), ...sys, id: sys.id, createdAt: list.find(s => s.id === sys.id)?.createdAt ?? Date.now() };
    write(projectId, list.map(s => s.id === sys.id ? updated : s));
    return updated;
  }
  const created: BespokeSystem = { ...sys, id: uid(), createdAt: Date.now() };
  write(projectId, [created, ...list]);
  return created;
}

export function deleteBespoke(projectId: string, id: string) {
  write(projectId, read(projectId).filter(s => s.id !== id));
}

export function useBespokeSystems(projectId: string): BespokeSystem[] {
  const [list, setList] = useState<BespokeSystem[]>(() => read(projectId));
  useEffect(() => {
    setList(read(projectId));
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!d || d.projectId === projectId) setList(read(projectId));
    };
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [projectId]);
  return list;
}

// ---------------------------------------------------------------------------
// Build-up → materials per m² of wall.
// Heuristic, transparent: numbers come from typical BG details and scale with
// layer counts. Not certified — purely estimating call-off quantities.
// ---------------------------------------------------------------------------

export type MaterialQty = { item: string; qty: number; unit: string };

function studLengthLabel(centres: StudCentres) {
  // lengths/m² of wall = 1 / (centres in m). 600 c/c → 1.67 lm/m²; 400 c/c → 2.5 lm/m².
  return centres === 400 ? 2.5 : 1.67;
}

function insulationItem(ins: Insulation): MaterialQty | null {
  if (ins.kind === "none") return null;
  if (ins.kind === "isover-apr") return { item: `Isover Acoustic Partition Roll ${ins.thicknessMm}mm`, qty: 1.0, unit: "m²" };
  return { item: `Rockwool RW3 ${ins.thicknessMm}mm`, qty: 1.0, unit: "m²" };
}

export function buildUpToMaterials(buildUp: BespokeBuildUp): MaterialQty[] {
  const layersA = buildUp.sideA.length;
  const layersB = buildUp.sideB.length;
  const totalBoardLayers = layersA + layersB;
  const items: MaterialQty[] = [];

  // Each board layer = 1 m² of board per m² of wall (before waste; waste applied in calculator)
  const allLayers = [...buildUp.sideA, ...buildUp.sideB];
  const grouped = new Map<BoardChoice, number>();
  for (const b of allLayers) grouped.set(b, (grouped.get(b) ?? 0) + 1);
  for (const [board, count] of grouped) {
    items.push({ item: board, qty: 1.0 * count, unit: "m²" });
  }

  // Frame: studs + head/floor channels
  const studLm = studLengthLabel(buildUp.studCentres);
  items.push({ item: `Gypframe ${buildUp.studSize === 146 ? "I-Stud" : "C-Stud"} ${buildUp.studSize} (3.0m)`, qty: studLm / 3.0, unit: "lengths" });
  items.push({ item: `Gypframe Floor & Ceiling Channel ${buildUp.studSize} (3.6m)`, qty: 0.14, unit: "lengths" });

  // Resilient bars (one face only typically)
  if (buildUp.resilientBars) {
    items.push({ item: "Gypframe Resilient Bar (3.6m)", qty: 0.42, unit: "lengths" });
  }

  // Insulation
  const ins = insulationItem(buildUp.insulation);
  if (ins) items.push(ins);

  // Jointing & ancillaries — scale with total board layers
  items.push({ item: "Jointing compound", qty: 0.42 * totalBoardLayers, unit: "kg" });
  items.push({ item: "Joint tape", qty: 1.4 * totalBoardLayers, unit: "m" });
  items.push({ item: "Drywall screws (1000-pack)", qty: 0.012 * totalBoardLayers, unit: "pack" });
  items.push({ item: "Sealant (intumescent acoustic)", qty: 12.5, unit: "ml" });
  items.push({ item: "Gypframe GFS1 fixings", qty: 0.5, unit: "lm" });

  return items;
}

export function describeBuildUp(b: BespokeBuildUp): string {
  const a = b.sideA.length === 0 ? "—" : b.sideA.map(boardShort).join(" + ");
  const sb = b.sideB.length === 0 ? "lining" : b.sideB.map(boardShort).join(" + ");
  const ins = b.insulation.kind === "none" ? "no insulation" : b.insulation.kind === "isover-apr" ? `Isover APR ${b.insulation.thicknessMm}mm` : `Rockwool RW3 ${b.insulation.thicknessMm}mm`;
  return `Side A: ${a} · Frame: ${b.studType} ${b.studSize} @ ${b.studCentres} c/c · ${ins} · Side B: ${sb}${b.resilientBars ? " · resilient bars" : ""}`;
}

function boardShort(b: BoardChoice) {
  return b.replace("Gyproc ", "").replace("Glasroc F ", "");
}
