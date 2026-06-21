import { useEffect, useState } from "react";

// ============================================================================
// Shared project-scoped data layer (localStorage-backed, mock).
// Connects Calculator → BoQ → Call-offs for any project (custom or built-in).
// ============================================================================

export type ProjectSystem = {
  id: string;
  addedAt: number;          // epoch ms
  systemCode: string;       // e.g. "GIWL-146-I-80-1L-DL15 (B)"
  systemName: string;       // short label
  lengthM: number;
  heightM: number;
  areaM2: number;
  wastePct: number;
  boardSize: string;
  notes?: string;
};

export type ProjectBoqLine = {
  id: string;
  systemId: string;         // links back to ProjectSystem
  material: string;         // e.g. "Gyproc WallBoard 12.5"
  qty: number;
  unit: string;
  ratePerUnit?: number;
  selectedSupplier?: string;
  leadTimeDays?: number;    // supplier lead time; falls back to DEFAULT_LEAD_DAYS
};

export type ProjectCallOff = {
  id: string;
  createdAt: number;
  supplier: string;
  lineIds: string[];
  status: "draft" | "sent" | "delivered";
};

export type ProjectData = {
  systems: ProjectSystem[];
  boqLines: ProjectBoqLine[];
  callOffs: ProjectCallOff[];
  supplierChoices: Record<string, string>; // material → supplier
};

const KEY = (projectId: string) => `qp-project-data-${projectId}`;
const EVT = "qp-project-data-change";
const SEED_KEY = (projectId: string) => `qp-project-data-seed-${projectId}`;
const ALLOC_KEY = (projectId: string) => `qp-boq-alloc-${projectId}`;
const ALLOC_EVT = "qp-boq-alloc-change";

const empty: ProjectData = {
  systems: [],
  boqLines: [],
  callOffs: [],
  supplierChoices: {},
};

function read(projectId: string): ProjectData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return { ...empty, supplierChoices: {} };
    const parsed = JSON.parse(raw);
    return {
      systems: parsed.systems ?? [],
      boqLines: parsed.boqLines ?? [],
      callOffs: parsed.callOffs ?? [],
      supplierChoices: parsed.supplierChoices ?? {},
    };
  } catch {
    return { ...empty, supplierChoices: {} };
  }
}

function write(projectId: string, data: ProjectData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function addSystemToBoQ(
  projectId: string,
  input: {
    systemCode: string;
    systemName: string;
    lengthM: number;
    heightM: number;
    wastePct: number;
    boardSize: string;
    materials: { name: string; qty: number; unit: string }[];
  },
): ProjectSystem {
  const data = read(projectId);
  const sysId = uid("sys");
  const areaM2 = input.lengthM * input.heightM;
  const system: ProjectSystem = {
    id: sysId,
    addedAt: Date.now(),
    systemCode: input.systemCode,
    systemName: input.systemName,
    lengthM: input.lengthM,
    heightM: input.heightM,
    areaM2,
    wastePct: input.wastePct,
    boardSize: input.boardSize,
  };
  const lines: ProjectBoqLine[] = input.materials.map((m) => ({
    id: uid("line"),
    systemId: sysId,
    material: m.name,
    qty: m.qty,
    unit: m.unit,
  }));
  write(projectId, {
    ...data,
    systems: [system, ...data.systems],
    boqLines: [...lines, ...data.boqLines],
  });
  return system;
}

export function removeSystem(projectId: string, systemId: string) {
  const data = read(projectId);
  write(projectId, {
    ...data,
    systems: data.systems.filter((s) => s.id !== systemId),
    boqLines: data.boqLines.filter((l) => l.systemId !== systemId),
  });
}

export function selectSupplier(projectId: string, material: string, supplier: string) {
  const data = read(projectId);
  write(projectId, {
    ...data,
    supplierChoices: { ...data.supplierChoices, [material]: supplier },
  });
}

/**
 * Append a new call-off to the project. Used by the auto-propose flow
 * after the user confirms a suggested batch in the review dialog.
 */
export function addCallOff(
  projectId: string,
  input: { supplier: string; lineIds: string[]; status?: ProjectCallOff["status"] },
): ProjectCallOff {
  const data = read(projectId);
  const co: ProjectCallOff = {
    id: uid("co"),
    createdAt: Date.now(),
    supplier: input.supplier,
    lineIds: input.lineIds,
    status: input.status ?? "draft",
  };
  write(projectId, { ...data, callOffs: [co, ...data.callOffs] });
  return co;
}

export function clearProjectData(projectId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY(projectId));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

/**
 * Update a call-off's status (e.g. draft → sent after QS approval,
 * sent → delivered after GRN log).
 */
export function updateCallOffStatus(
  projectId: string,
  id: string,
  status: ProjectCallOff["status"],
) {
  const data = read(projectId);
  const callOffs = data.callOffs.map((c) => (c.id === id ? { ...c, status } : c));
  write(projectId, { ...data, callOffs });
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useProjectData(projectId: string): ProjectData {
  const [data, setData] = useState<ProjectData>(() => {
    if (projectId === "fitzrovia") seedFitzroviaIfEmpty();
    return read(projectId);
  });
  useEffect(() => {
    if (projectId === "fitzrovia") seedFitzroviaIfEmpty();
    setData(read(projectId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) setData(read(projectId));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId]);
  return data;
}

// ---------------------------------------------------------------------------
// Demo seed — Hotel Fitzrovia
// ---------------------------------------------------------------------------
// Idempotent: only runs once per browser (SEED_KEY guard). Populates 4
// realistic drylining systems with their BoQ lines, picks a supplier per
// material, and pre-loads a handful of call-off allocation entries so the
// Materials tab shows a project mid-flight (pending, committed, delivered)
// instead of an empty state.
function seedFitzroviaIfEmpty() {
  if (typeof window === "undefined") return;
  const pid = "fitzrovia";
  if (localStorage.getItem(SEED_KEY(pid))) return;
  const existing = read(pid);
  if (existing.systems.length > 0 || existing.boqLines.length > 0) {
    localStorage.setItem(SEED_KEY(pid), "1");
    return;
  }

  const now = Date.now();
  const DAY = 864e5;

  const systems: ProjectSystem[] = [
    {
      id: "fitz-sys-1",
      addedAt: now - 30 * DAY,
      systemCode: "GypWall CLASSIC C-48/70",
      systemName: "Bedroom partitions L3–L5",
      lengthM: 887,
      heightM: 3.2,
      areaM2: 2840,
      wastePct: 7,
      boardSize: "2400×1200",
    },
    {
      id: "fitz-sys-2",
      addedAt: now - 28 * DAY,
      systemCode: "CasoLine MF",
      systemName: "Corridor & lobby ceilings",
      lengthM: 0,
      heightM: 2.7,
      areaM2: 4120,
      wastePct: 8,
      boardSize: "2400×1200",
    },
    {
      id: "fitz-sys-3",
      addedAt: now - 21 * DAY,
      systemCode: "Knauf ShaftWall",
      systemName: "Lift / riser shafts",
      lengthM: 128,
      heightM: 3.2,
      areaM2: 410,
      wastePct: 10,
      boardSize: "2400×1200",
    },
    {
      id: "fitz-sys-4",
      addedAt: now - 14 * DAY,
      systemCode: "GypWall ROBUST",
      systemName: "Back-of-house impact walls",
      lengthM: 106,
      heightM: 3.2,
      areaM2: 340,
      wastePct: 7,
      boardSize: "2400×1200",
    },
  ];

  const boqLines: ProjectBoqLine[] = [
    // System 1 — GypWall CLASSIC
    { id: "fitz-l-1a", systemId: "fitz-sys-1", material: "Gyproc WallBoard 15mm", qty: 3040, unit: "m²", ratePerUnit: 6.8, selectedSupplier: "Minster", leadTimeDays: 3 },
    { id: "fitz-l-1b", systemId: "fitz-sys-1", material: "Gypframe 70 S 50 stud", qty: 950, unit: "lm", ratePerUnit: 3.2, selectedSupplier: "Minster", leadTimeDays: 3 },
    { id: "fitz-l-1c", systemId: "fitz-sys-1", material: "Gypframe 72 U 50 track", qty: 620, unit: "lm", ratePerUnit: 2.9, selectedSupplier: "Minster", leadTimeDays: 3 },
    { id: "fitz-l-1d", systemId: "fitz-sys-1", material: "Isover APR 1200 insulation 50mm", qty: 2840, unit: "m²", ratePerUnit: 4.1, selectedSupplier: "SIG", leadTimeDays: 5 },
    // System 2 — MF ceilings
    { id: "fitz-l-2a", systemId: "fitz-sys-2", material: "Gyproc WallBoard 12.5mm", qty: 4450, unit: "m²", ratePerUnit: 5.6, selectedSupplier: "Minster", leadTimeDays: 3 },
    { id: "fitz-l-2b", systemId: "fitz-sys-2", material: "MF5 primary channel", qty: 1380, unit: "lm", ratePerUnit: 2.4, selectedSupplier: "CCF", leadTimeDays: 4 },
    { id: "fitz-l-2c", systemId: "fitz-sys-2", material: "MF7 furring", qty: 2750, unit: "lm", ratePerUnit: 1.9, selectedSupplier: "CCF", leadTimeDays: 4 },
    { id: "fitz-l-2d", systemId: "fitz-sys-2", material: "Soffit hangers + connectors", qty: 4120, unit: "ea", ratePerUnit: 0.85, selectedSupplier: "CCF", leadTimeDays: 4 },
    // System 3 — ShaftWall
    { id: "fitz-l-3a", systemId: "fitz-sys-3", material: "Knauf Coreboard 25mm", qty: 450, unit: "m²", ratePerUnit: 14.2, selectedSupplier: "Travis Perkins", leadTimeDays: 7 },
    { id: "fitz-l-3b", systemId: "fitz-sys-3", material: "Knauf Fireshield 15mm", qty: 900, unit: "m²", ratePerUnit: 11.8, selectedSupplier: "Travis Perkins", leadTimeDays: 7 },
    { id: "fitz-l-3c", systemId: "fitz-sys-3", material: "CT stud 64mm", qty: 410, unit: "lm", ratePerUnit: 5.2, selectedSupplier: "Travis Perkins", leadTimeDays: 7 },
    // System 4 — ROBUST
    { id: "fitz-l-4a", systemId: "fitz-sys-4", material: "Gyproc Habito 12.5mm", qty: 365, unit: "m²", ratePerUnit: 9.4, selectedSupplier: "Minster", leadTimeDays: 5 },
    { id: "fitz-l-4b", systemId: "fitz-sys-4", material: "Gypframe 92 S 50 stud", qty: 215, unit: "lm", ratePerUnit: 3.8, selectedSupplier: "Minster", leadTimeDays: 5 },
  ];

  const supplierChoices: Record<string, string> = {};
  for (const l of boqLines) if (l.selectedSupplier) supplierChoices[l.material] = l.selectedSupplier;

  const callOffs: ProjectCallOff[] = [
    { id: "CO-241", createdAt: now - 18 * DAY, supplier: "Minster", lineIds: ["fitz-l-1a", "fitz-l-1b"], status: "delivered" },
    { id: "CO-244", createdAt: now - 9 * DAY, supplier: "CCF", lineIds: ["fitz-l-2a", "fitz-l-2b", "fitz-l-2c"], status: "sent" },
    { id: "CO-247", createdAt: now - 2 * DAY, supplier: "Minster", lineIds: ["fitz-l-1d"], status: "draft" },
  ];

  write(pid, { systems, boqLines, callOffs, supplierChoices });

  // Seed BoQ allocation entries so % ordered isn't 0 across the page.
  const allocEntries = [
    // CO-241 fully delivered — 60% of board L3-L5 + half the studs
    { id: "a-seed-1", callOffId: "CO-241", lineId: "fitz-l-1a", qty: 1800, state: "delivered", ts: now - 18 * DAY },
    { id: "a-seed-2", callOffId: "CO-241", lineId: "fitz-l-1b", qty: 500,  state: "delivered", ts: now - 18 * DAY },
    // CO-244 sent (committed) — MF ceiling kit phase 1
    { id: "a-seed-3", callOffId: "CO-244", lineId: "fitz-l-2a", qty: 2100, state: "committed", ts: now - 9 * DAY },
    { id: "a-seed-4", callOffId: "CO-244", lineId: "fitz-l-2b", qty: 700,  state: "committed", ts: now - 9 * DAY },
    { id: "a-seed-5", callOffId: "CO-244", lineId: "fitz-l-2c", qty: 1400, state: "committed", ts: now - 9 * DAY },
    // CO-247 pending QS approval — insulation top-up
    { id: "a-seed-6", callOffId: "CO-247", lineId: "fitz-l-1d", qty: 900,  state: "pending",   ts: now - 2 * DAY },
    // Coreboard partially committed
    { id: "a-seed-7", callOffId: "CO-238", lineId: "fitz-l-3a", qty: 200,  state: "committed", ts: now - 22 * DAY },
  ];
  localStorage.setItem(ALLOC_KEY(pid), JSON.stringify(allocEntries));
  window.dispatchEvent(new CustomEvent(ALLOC_EVT, { detail: { projectId: pid } }));

  localStorage.setItem(SEED_KEY(pid), "1");
}