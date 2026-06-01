import { useSyncExternalStore } from "react";
import type { PlannerTask } from "./planner";

// ============================================================================
// MSProject bidirectional sync — outbound change tracking.
// After an MSProject pull (import) we snapshot every task's MSP-relevant
// fields (title, dates, work hours, crew, progress, status). Any local edit
// after that snapshot becomes a "pending change" that the Push to MSProject
// action will flush back. The real connector is stubbed: pushing simulates
// network latency, refreshes the snapshot, and stamps the IntegrationConnection
// with lastPush / push counters. Diff is recomputed live so UI shows pending
// counts the moment the planner store changes.
// ============================================================================

export type MspTaskShadow = {
  title: string;
  start: string;
  end: string;
  plannedHours?: number;
  crewId?: string;
  progress: number;
  status: string;
};

export type MspBaseline = {
  projectId: string;
  syncedAt: string; // ISO
  // map of plannerTaskId → shadow
  tasks: Record<string, MspTaskShadow>;
};

export type PendingChange =
  | { kind: "added"; taskId: string; current: MspTaskShadow; reason: string }
  | { kind: "updated"; taskId: string; before: MspTaskShadow; after: MspTaskShadow; fields: string[] }
  | { kind: "deleted"; taskId: string; before: MspTaskShadow };

const KEY = (pid: string) => `qp-msp-baseline-${pid}`;
const EVT = "qp-msp-baseline-change";

function shadowOf(t: PlannerTask): MspTaskShadow {
  return {
    title: t.title,
    start: t.start,
    end: t.end,
    plannedHours: t.plannedHours,
    crewId: t.crewId,
    progress: t.progress,
    status: t.status,
  };
}

function read(pid: string): MspBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY(pid));
    return raw ? (JSON.parse(raw) as MspBaseline) : null;
  } catch {
    return null;
  }
}

function write(pid: string, b: MspBaseline | null) {
  if (typeof window === "undefined") return;
  if (b) localStorage.setItem(KEY(pid), JSON.stringify(b));
  else localStorage.removeItem(KEY(pid));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

/**
 * Snapshot every current planner task as the new "in-sync with MSProject"
 * reference. Called after a successful inbound import or outbound push.
 */
export function recordBaseline(pid: string, tasks: PlannerTask[]) {
  const shadow: Record<string, MspTaskShadow> = {};
  for (const t of tasks) shadow[t.id] = shadowOf(t);
  write(pid, { projectId: pid, syncedAt: new Date().toISOString(), tasks: shadow });
}

export function clearBaseline(pid: string) {
  write(pid, null);
}

export function getBaseline(pid: string): MspBaseline | null {
  return read(pid);
}

function diffShadow(a: MspTaskShadow, b: MspTaskShadow): string[] {
  const f: string[] = [];
  if (a.title !== b.title) f.push("title");
  if (a.start !== b.start) f.push("start");
  if (a.end !== b.end) f.push("end");
  if ((a.plannedHours ?? 0) !== (b.plannedHours ?? 0)) f.push("hours");
  if ((a.crewId ?? "") !== (b.crewId ?? "")) f.push("crew");
  if (a.progress !== b.progress) f.push("progress");
  if (a.status !== b.status) f.push("status");
  return f;
}

export function computePendingChanges(
  baseline: MspBaseline | null,
  tasks: PlannerTask[],
): PendingChange[] {
  if (!baseline) return [];
  const out: PendingChange[] = [];
  const seen = new Set<string>();
  for (const t of tasks) {
    seen.add(t.id);
    const before = baseline.tasks[t.id];
    const after = shadowOf(t);
    if (!before) {
      out.push({ kind: "added", taskId: t.id, current: after, reason: "created after last sync" });
      continue;
    }
    const fields = diffShadow(before, after);
    if (fields.length > 0) out.push({ kind: "updated", taskId: t.id, before, after, fields });
  }
  for (const id of Object.keys(baseline.tasks)) {
    if (!seen.has(id)) out.push({ kind: "deleted", taskId: id, before: baseline.tasks[id] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// React subscription
// ---------------------------------------------------------------------------

function subscribe(pid: string, cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => {
    const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
    if (!detail?.projectId || detail.projectId === pid) cb();
  };
  const storage = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", storage);
  };
}

const snapCache = new Map<string, MspBaseline | null>();
function snap(pid: string): MspBaseline | null {
  const fresh = read(pid);
  const prev = snapCache.get(pid);
  if (JSON.stringify(prev) !== JSON.stringify(fresh)) snapCache.set(pid, fresh);
  return snapCache.get(pid) ?? null;
}

export function useMspBaseline(pid: string): MspBaseline | null {
  return useSyncExternalStore(
    (cb) => subscribe(pid, cb),
    () => snap(pid),
    () => snap(pid),
  );
}

// ---------------------------------------------------------------------------
// Outbound push (simulated). Mirrors a real connector call: round-trip delay,
// then "MSProject accepted the deltas" — we just refresh our baseline.
// ---------------------------------------------------------------------------

export type PushResult = {
  pushedAt: string;
  added: number;
  updated: number;
  deleted: number;
};

export function pushToMsp(pid: string, tasks: PlannerTask[], changes: PendingChange[]): Promise<PushResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      recordBaseline(pid, tasks);
      resolve({
        pushedAt: new Date().toISOString(),
        added: changes.filter((c) => c.kind === "added").length,
        updated: changes.filter((c) => c.kind === "updated").length,
        deleted: changes.filter((c) => c.kind === "deleted").length,
      });
    }, 900);
  });
}

export function summarizeChange(c: PendingChange): string {
  if (c.kind === "added") return `+ ${c.taskId} · ${c.current.title}`;
  if (c.kind === "deleted") return `– ${c.taskId} · ${c.before.title}`;
  return `~ ${c.taskId} · ${c.after.title} (${c.fields.join(", ")})`;
}