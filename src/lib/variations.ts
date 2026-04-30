import { useEffect, useState } from "react";

// ============================================================================
// Project variations (VOs) — client/contractor-driven changes against baseline.
// localStorage-backed, mock. Per project.
// ============================================================================

export type VariationStatus = "draft" | "submitted" | "approved" | "rejected";

export type VariationRaisedBy = "client" | "contractor" | "designer" | "site";

export type VariationChangeOp =
  | "add_system"
  | "modify_system"
  | "remove_line"
  | "add_line"
  | "adjust_qty";

export type VariationChange = {
  id: string;
  op: VariationChangeOp;
  description: string;
  qty?: number;
  unit?: string;
  ratePerUnit?: number;
  lineTotal: number; // signed (negative for removals/credits)
};

export type VariationAttachment = { name: string };

export type ProjectVariation = {
  id: string;            // VO-001, VO-002, ...
  title: string;
  reason: string;
  raisedBy: VariationRaisedBy;
  raisedDate: string;    // ISO yyyy-mm-dd
  status: VariationStatus;
  changes: VariationChange[];
  costImpact: number;    // sum of changes (signed)
  timeImpactDays: number;
  approvedValue?: number;
  approvedDate?: string;
  rejectedReason?: string;
  attachments: VariationAttachment[];
  createdAt: number;
  updatedAt: number;
};

const KEY = (pid: string) => `qp-project-variations-${pid}`;
const SEED_KEY = (pid: string) => `qp-project-variations-seeded-${pid}`;
const EVT = "qp-project-variations-change";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function read(pid: string): ProjectVariation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(pid));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ProjectVariation[]) : [];
  } catch {
    return [];
  }
}

function write(pid: string, list: ProjectVariation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid), JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

export function getNextVoNumber(pid: string): string {
  const list = read(pid);
  const max = list.reduce((m, v) => {
    const n = parseInt(v.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `VO-${String(max + 1).padStart(3, "0")}`;
}

export function sumChanges(changes: VariationChange[]): number {
  return changes.reduce((s, c) => s + (Number(c.lineTotal) || 0), 0);
}

export type NewVariationInput = Omit<
  ProjectVariation,
  "id" | "createdAt" | "updatedAt" | "costImpact"
> & { id?: string };

export function addVariation(pid: string, input: NewVariationInput): ProjectVariation {
  const list = read(pid);
  const v: ProjectVariation = {
    ...input,
    id: input.id ?? getNextVoNumber(pid),
    costImpact: sumChanges(input.changes),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write(pid, [v, ...list]);
  return v;
}

export function updateVariation(
  pid: string,
  id: string,
  patch: Partial<Omit<ProjectVariation, "id" | "createdAt">>,
) {
  const list = read(pid);
  const next = list.map((v) => {
    if (v.id !== id) return v;
    const merged: ProjectVariation = { ...v, ...patch, updatedAt: Date.now() };
    if (patch.changes) merged.costImpact = sumChanges(patch.changes);
    return merged;
  });
  write(pid, next);
}

export function setStatus(
  pid: string,
  id: string,
  status: VariationStatus,
  extra?: { approvedValue?: number; rejectedReason?: string },
) {
  const list = read(pid);
  const next = list.map((v) => {
    if (v.id !== id) return v;
    const merged: ProjectVariation = { ...v, status, updatedAt: Date.now() };
    if (status === "approved") {
      merged.approvedValue = extra?.approvedValue ?? v.costImpact;
      merged.approvedDate = new Date().toISOString().slice(0, 10);
      merged.rejectedReason = undefined;
    } else if (status === "rejected") {
      merged.rejectedReason = extra?.rejectedReason;
      merged.approvedValue = undefined;
      merged.approvedDate = undefined;
    } else {
      merged.approvedValue = undefined;
      merged.approvedDate = undefined;
      merged.rejectedReason = undefined;
    }
    return merged;
  });
  write(pid, next);
}

export function deleteVariation(pid: string, id: string) {
  write(pid, read(pid).filter((v) => v.id !== id));
}

/** Non-reactive read of all variations for a project. Safe to call from other libs. */
export function getProjectVariations(pid: string): ProjectVariation[] {
  return read(pid);
}

/** Wipe variations storage for a project (used on project delete). */
export function clearProjectVariations(pid: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(pid));
    localStorage.removeItem(SEED_KEY(pid));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
  } catch { /* noop */ }
}

export type VariationsSummary = {
  approvedValue: number;
  pendingValue: number;
  rejectedValue: number;
  totalImpact: number;        // approved + pending (signed)
  approvedDays: number;
  pendingDays: number;
  count: { all: number; draft: number; submitted: number; approved: number; rejected: number };
};

export function summarize(list: ProjectVariation[]): VariationsSummary {
  const s: VariationsSummary = {
    approvedValue: 0,
    pendingValue: 0,
    rejectedValue: 0,
    totalImpact: 0,
    approvedDays: 0,
    pendingDays: 0,
    count: { all: list.length, draft: 0, submitted: 0, approved: 0, rejected: 0 },
  };
  for (const v of list) {
    s.count[v.status] += 1;
    if (v.status === "approved") {
      s.approvedValue += v.approvedValue ?? v.costImpact;
      s.approvedDays += v.timeImpactDays;
    } else if (v.status === "submitted" || v.status === "draft") {
      s.pendingValue += v.costImpact;
      s.pendingDays += v.timeImpactDays;
    } else if (v.status === "rejected") {
      s.rejectedValue += v.costImpact;
    }
  }
  s.totalImpact = s.approvedValue + s.pendingValue;
  return s;
}

// ---------------------------------------------------------------------------
// Seed mock data for Fitzrovia
// ---------------------------------------------------------------------------

function seedFitzroviaIfEmpty() {
  if (typeof window === "undefined") return;
  const pid = "fitzrovia";
  if (localStorage.getItem(SEED_KEY(pid))) return;
  if (read(pid).length > 0) {
    localStorage.setItem(SEED_KEY(pid), "1");
    return;
  }
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const minus = (days: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() - days);
    return iso(x);
  };

  const seeds: ProjectVariation[] = [
    {
      id: "VO-001",
      title: "Upgrade acoustic spec — bedrooms L3-L5",
      reason: "Client request: meet 58dB Rw between adjoining bedrooms (originally 52dB).",
      raisedBy: "client",
      raisedDate: minus(34),
      status: "approved",
      approvedValue: 8400,
      approvedDate: minus(21),
      timeImpactDays: 4,
      attachments: [{ name: "Acoustic-instruction-AI-014.pdf" }],
      changes: [
        {
          id: uid("chg"),
          op: "modify_system",
          description: "Add 1 extra layer Soundbloc 15mm to Side B (132 walls)",
          qty: 612,
          unit: "m²",
          ratePerUnit: 11.4,
          lineTotal: 6976.8,
        },
        {
          id: uid("chg"),
          op: "add_line",
          description: "Acoustic sealant + perimeter detailing kit",
          qty: 1,
          unit: "lot",
          ratePerUnit: 1423.2,
          lineTotal: 1423.2,
        },
      ],
      costImpact: 8400,
      createdAt: Date.now() - 34 * 864e5,
      updatedAt: Date.now() - 21 * 864e5,
    },
    {
      id: "VO-002",
      title: "Add bulkheads in lobby — service zones",
      reason: "MEP coordination: drop ceiling bulkheads to conceal AHU run.",
      raisedBy: "designer",
      raisedDate: minus(12),
      status: "submitted",
      timeImpactDays: 3,
      attachments: [{ name: "RFI-087-bulkhead-sketch.pdf" }, { name: "Sketch-SK-22.dwg" }],
      changes: [
        {
          id: uid("chg"),
          op: "add_system",
          description: "MF ceiling bulkheads — 3 No. runs @ 8.5m",
          qty: 25.5,
          unit: "lm",
          ratePerUnit: 125.5,
          lineTotal: 3200.25,
        },
      ],
      costImpact: 3200.25,
      createdAt: Date.now() - 12 * 864e5,
      updatedAt: Date.now() - 12 * 864e5,
    },
    {
      id: "VO-003",
      title: "Omit partition — meeting room M-04",
      reason: "Client opted for open-plan layout in meeting suite.",
      raisedBy: "client",
      raisedDate: minus(4),
      status: "draft",
      timeImpactDays: -2,
      attachments: [],
      changes: [
        {
          id: uid("chg"),
          op: "remove_line",
          description: "Remove 100mm metal stud partition L2 — 18 lm × 3.2m",
          qty: 57.6,
          unit: "m²",
          ratePerUnit: -19.1,
          lineTotal: -1100,
        },
      ],
      costImpact: -1100,
      createdAt: Date.now() - 4 * 864e5,
      updatedAt: Date.now() - 4 * 864e5,
    },
  ];
  localStorage.setItem(KEY(pid), JSON.stringify(seeds));
  localStorage.setItem(SEED_KEY(pid), "1");
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useProjectVariations(pid: string): ProjectVariation[] {
  const [list, setList] = useState<ProjectVariation[]>(() => {
    if (pid === "fitzrovia") seedFitzroviaIfEmpty();
    return read(pid);
  });
  useEffect(() => {
    if (pid === "fitzrovia") seedFitzroviaIfEmpty();
    setList(read(pid));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === pid) setList(read(pid));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [pid]);
  return list;
}

export function newChange(partial?: Partial<VariationChange>): VariationChange {
  return {
    id: uid("chg"),
    op: "add_line",
    description: "",
    qty: 0,
    unit: "m²",
    ratePerUnit: 0,
    lineTotal: 0,
    ...partial,
  };
}

export const RAISED_BY_OPTIONS: { value: VariationRaisedBy; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "contractor", label: "Main contractor" },
  { value: "designer", label: "Designer / MEP" },
  { value: "site", label: "Site team" },
];

export const OP_OPTIONS: { value: VariationChangeOp; label: string }[] = [
  { value: "add_system", label: "Add system" },
  { value: "modify_system", label: "Modify system" },
  { value: "add_line", label: "Add line" },
  { value: "remove_line", label: "Remove line" },
  { value: "adjust_qty", label: "Adjust qty" },
];