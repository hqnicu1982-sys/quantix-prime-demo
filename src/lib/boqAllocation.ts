import { useEffect, useState } from "react";
import type { ProjectBoqLine, ProjectSystem } from "./projectData";
import { useProjectData } from "./projectData";

// ============================================================================
// BoQ allocation engine
// ----------------------------------------------------------------------------
// The estimator's BoQ is the budget. Site-manager call-offs reserve / commit
// quantities against individual BoQ lines. This module owns the math + the
// (mock, localStorage) reservation store. Pure selectors + a tiny hook so
// the Materials page, wizard and call-off detail page all share one source.
// ============================================================================

export type AllocState = "pending" | "committed" | "delivered";

export type AllocEntry = {
  id: string;
  callOffId: string;
  lineId: string;
  qty: number;
  state: AllocState;
  ts: number;
};

export type LineAllocation = {
  line: ProjectBoqLine;
  approved: number;
  pending: number;     // submitted / reviewed
  ordered: number;     // approved+ → reduces remaining
  delivered: number;   // closed (GRN reconciled)
  remaining: number;   // approved − pending − ordered
};

export type SystemAllocation = {
  system: ProjectSystem;
  lines: LineAllocation[];
  approvedTotal: number;
  orderedTotal: number;
  remainingTotal: number;
  pctOrdered: number;  // 0..100
};

const KEY = (projectId: string) => `qp-boq-alloc-${projectId}`;
const EVT = "qp-boq-alloc-change";

function read(projectId: string): AllocEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY(projectId)) ?? "[]") as AllocEntry[];
  } catch {
    return [];
  }
}

function write(projectId: string, entries: AllocEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

const uid = () => `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function getLineAllocation(
  line: ProjectBoqLine,
  entries: AllocEntry[],
): LineAllocation {
  const mine = entries.filter((e) => e.lineId === line.id);
  const pending   = mine.filter((e) => e.state === "pending").reduce((a, e) => a + e.qty, 0);
  const ordered   = mine.filter((e) => e.state === "committed").reduce((a, e) => a + e.qty, 0);
  const delivered = mine.filter((e) => e.state === "delivered").reduce((a, e) => a + e.qty, 0);
  const approved = line.qty;
  const remaining = Math.max(0, approved - pending - ordered);
  return { line, approved, pending, ordered, delivered, remaining };
}

export function getSystemAllocations(
  systems: ProjectSystem[],
  lines: ProjectBoqLine[],
  entries: AllocEntry[],
): SystemAllocation[] {
  return systems.map((sys) => {
    const sysLines = lines
      .filter((l) => l.systemId === sys.id)
      .map((l) => getLineAllocation(l, entries));
    const approvedTotal  = sysLines.reduce((a, l) => a + l.approved, 0);
    const orderedTotal   = sysLines.reduce((a, l) => a + l.ordered + l.delivered, 0);
    const remainingTotal = sysLines.reduce((a, l) => a + l.remaining, 0);
    const pctOrdered = approvedTotal === 0
      ? 0
      : Math.round(((orderedTotal) / approvedTotal) * 100);
    return { system: sys, lines: sysLines, approvedTotal, orderedTotal, remainingTotal, pctOrdered };
  });
}

export function canOrder(
  line: ProjectBoqLine,
  entries: AllocEntry[],
  qty: number,
): { ok: boolean; remaining: number; reason?: string } {
  const { remaining } = getLineAllocation(line, entries);
  if (qty <= 0) return { ok: false, remaining, reason: "Quantity must be greater than zero" };
  if (qty > remaining) {
    return { ok: false, remaining, reason: `Exceeds remaining (${remaining.toLocaleString()} ${line.unit})` };
  }
  return { ok: true, remaining };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function reserve(
  projectId: string,
  callOffId: string,
  lineId: string,
  qty: number,
): AllocEntry {
  const entries = read(projectId);
  const entry: AllocEntry = { id: uid(), callOffId, lineId, qty, state: "pending", ts: Date.now() };
  write(projectId, [entry, ...entries]);
  return entry;
}

export function commit(projectId: string, callOffId: string) {
  const entries = read(projectId).map((e) =>
    e.callOffId === callOffId && e.state === "pending" ? { ...e, state: "committed" as const } : e,
  );
  write(projectId, entries);
}

export function release(projectId: string, callOffId: string) {
  const entries = read(projectId).filter((e) => !(e.callOffId === callOffId && e.state === "pending"));
  write(projectId, entries);
}

export function markDelivered(projectId: string, callOffId: string) {
  const entries = read(projectId).map((e) =>
    e.callOffId === callOffId && e.state === "committed" ? { ...e, state: "delivered" as const } : e,
  );
  write(projectId, entries);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useBoqAllocation(projectId: string) {
  const data = useProjectData(projectId);
  const [entries, setEntries] = useState<AllocEntry[]>(() => read(projectId));
  useEffect(() => {
    setEntries(read(projectId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) setEntries(read(projectId));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId]);

  const systems = getSystemAllocations(data.systems, data.boqLines, entries);
  const totals = systems.reduce(
    (a, s) => ({
      approved:  a.approved + s.approvedTotal,
      ordered:   a.ordered + s.orderedTotal,
      remaining: a.remaining + s.remainingTotal,
    }),
    { approved: 0, ordered: 0, remaining: 0 },
  );
  const linesFullyConsumed = systems.flatMap((s) => s.lines).filter((l) => l.remaining === 0 && l.approved > 0).length;

  return {
    raw: data,
    entries,
    systems,
    totals,
    linesFullyConsumed,
    canOrder: (lineId: string, qty: number) => {
      const line = data.boqLines.find((l) => l.id === lineId);
      if (!line) return { ok: false, remaining: 0, reason: "Line not found" };
      return canOrder(line, entries, qty);
    },
  };
}