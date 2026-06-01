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

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useProjectData(projectId: string): ProjectData {
  const [data, setData] = useState<ProjectData>(() => read(projectId));
  useEffect(() => {
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