import { useEffect, useState } from "react";
import { effectiveRate } from "./labour";

// ============================================================================
// Planner — schedule of works per project.
// localStorage-backed (mock). Designed to integrate with BoQ, Call-offs,
// Variations and Labour. Core unit: PlannerTask with real ISO dates and
// referential links to other domains (no free-text crew names).
// ============================================================================

export type TaskStatus =
  | "scheduled"
  | "starting"
  | "on-track"
  | "behind"
  | "blocked"
  | "done";

export type TaskBlocker = {
  type: "material" | "labour" | "design" | "sub" | "predecessor" | "variation";
  note: string;
};

export type PlannerTask = {
  id: string;            // T-001
  projectId: string;
  title: string;
  level: string;         // L4 / L5 / Lobby / All ...
  area?: string;
  crewId?: string;       // refs team[].id
  start: string;         // ISO yyyy-mm-dd
  end: string;           // ISO yyyy-mm-dd
  progress: number;      // 0..100
  status: TaskStatus;
  boqLineIds: string[];
  calloffIds: string[];
  variationId?: string;
  dependsOn: string[];   // other task ids (FS)
  notes?: string;
  isMilestone?: boolean;
  plannedHours?: number; // total man-hours estimated for the task
  createdAt: number;
  updatedAt: number;
};

const KEY = (pid: string) => `qp-planner-${pid}`;
const SEED_KEY = (pid: string) => `qp-planner-seeded-${pid}`;
const EVT = "qp-planner-change";

// Demo "today" anchor — keeps the gantt visually centred on the demo data.
// Falls back to real today if user is exploring far from the seed window.
export const PLANNER_TODAY = new Date(2026, 3, 28); // 28 Apr 2026

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === "string" ? parseISO(a) : a;
  const db = typeof b === "string" ? parseISO(b) : b;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function addDays(s: string, days: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function durationDays(t: PlannerTask): number {
  return Math.max(1, daysBetween(t.start, t.end) + 1);
}

function read(pid: string): PlannerTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(pid));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as PlannerTask[]) : [];
  } catch {
    return [];
  }
}

function write(pid: string, list: PlannerTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid), JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

export function getNextTaskId(pid: string): string {
  const list = read(pid);
  const max = list.reduce((m, t) => {
    const n = parseInt(t.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `T-${String(max + 1).padStart(3, "0")}`;
}

export type NewTaskInput = Omit<PlannerTask, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export function addTask(pid: string, input: NewTaskInput): PlannerTask {
  const list = read(pid);
  const t: PlannerTask = {
    ...input,
    id: input.id ?? getNextTaskId(pid),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write(pid, [...list, t]);
  return t;
}

export function updateTask(
  pid: string,
  id: string,
  patch: Partial<Omit<PlannerTask, "id" | "createdAt" | "projectId">>,
) {
  const list = read(pid);
  write(
    pid,
    list.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
  );
}

export function moveTask(pid: string, id: string, deltaDays: number) {
  const list = read(pid);
  const t = list.find((x) => x.id === id);
  if (!t) return;
  updateTask(pid, id, {
    start: addDays(t.start, deltaDays),
    end: addDays(t.end, deltaDays),
  });
}

export function resizeTask(
  pid: string,
  id: string,
  edge: "start" | "end",
  deltaDays: number,
) {
  const list = read(pid);
  const t = list.find((x) => x.id === id);
  if (!t) return;
  if (edge === "start") {
    const nextStart = addDays(t.start, deltaDays);
    if (parseISO(nextStart) > parseISO(t.end)) return;
    updateTask(pid, id, { start: nextStart });
  } else {
    const nextEnd = addDays(t.end, deltaDays);
    if (parseISO(nextEnd) < parseISO(t.start)) return;
    updateTask(pid, id, { end: nextEnd });
  }
}

export function deleteTask(pid: string, id: string) {
  write(pid, read(pid).filter((t) => t.id !== id));
}

/**
 * Imperative read of the persisted task list for a project. Use inside
 * event handlers / async flows where the React snapshot is stale (e.g.
 * immediately after a bulk import or sync operation).
 */
export function getProjectTasks(pid: string): PlannerTask[] {
  return read(pid);
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export type PlannerKpis = {
  total: number;
  active: number;          // started but not done
  scheduled: number;
  blocked: number;
  done: number;
  varianceDays: number;    // sum of (today - end) for behind tasks (approx)
  crewsOnSite: number;
  startingThisWeek: number;
};

export function computeKpis(list: PlannerTask[], today: Date = PLANNER_TODAY): PlannerKpis {
  const k: PlannerKpis = {
    total: list.length,
    active: 0,
    scheduled: 0,
    blocked: 0,
    done: 0,
    varianceDays: 0,
    crewsOnSite: 0,
    startingThisWeek: 0,
  };
  const crewSet = new Set<string>();
  let behindDays = 0;
  let aheadDays = 0;
  for (const t of list) {
    if (t.status === "done") k.done++;
    else if (t.status === "blocked") k.blocked++;
    else if (t.progress > 0 && t.progress < 100) k.active++;
    else k.scheduled++;

    const start = parseISO(t.start);
    const end = parseISO(t.end);
    if (start <= today && end >= today && t.crewId && t.status !== "done") {
      crewSet.add(t.crewId);
    }
    const inWeek = daysBetween(today, start);
    if (inWeek >= 0 && inWeek <= 7 && t.status !== "done") k.startingThisWeek++;

    if (t.status === "behind") behindDays += Math.max(0, daysBetween(end, today));
    if (t.status === "on-track" && t.progress < 100) {
      // simple ahead estimate: progress ahead of elapsed
      const elapsed = Math.max(1, daysBetween(t.start, today));
      const total = Math.max(1, daysBetween(t.start, t.end));
      const expected = (elapsed / total) * 100;
      if (t.progress > expected) aheadDays += 1;
    }
  }
  k.crewsOnSite = crewSet.size;
  k.varianceDays = aheadDays - behindDays;
  return k;
}

// ---------------------------------------------------------------------------
// Constraint awareness — readiness gates
// ---------------------------------------------------------------------------

export type CalloffStatusLite = "draft" | "pending" | "approved" | "delivered";
export type ReadinessInput = {
  callOffs: { id: string; status: CalloffStatusLite }[];
  approvedVariationIds: string[];
  today?: Date;
};

export type Readiness = {
  ready: boolean;
  blockers: TaskBlocker[];
  suggestedStart?: string;
};

export function computeReadiness(
  task: PlannerTask,
  allTasks: PlannerTask[],
  ctx: ReadinessInput,
): Readiness {
  const today = ctx.today ?? PLANNER_TODAY;
  const blockers: TaskBlocker[] = [];

  // 1. Material gate
  for (const cid of task.calloffIds) {
    const co = ctx.callOffs.find((c) => c.id === cid);
    if (!co) {
      blockers.push({ type: "material", note: `Call-off ${cid} not raised yet` });
    } else if (co.status === "draft" || co.status === "pending") {
      blockers.push({ type: "material", note: `${cid} ${co.status} — confirm before start` });
    }
  }

  // 2. Predecessor gate
  for (const pid of task.dependsOn) {
    const pre = allTasks.find((t) => t.id === pid);
    if (!pre) continue;
    if (pre.progress < 100) {
      blockers.push({
        type: "predecessor",
        note: `Waiting on ${pre.id} (${pre.progress}%)`,
      });
    }
  }

  // 3. Labour gate — crew double-booked in same window
  if (task.crewId) {
    const overlap = allTasks.find(
      (o) =>
        o.id !== task.id &&
        o.crewId === task.crewId &&
        o.status !== "done" &&
        !(parseISO(o.end) < parseISO(task.start) || parseISO(o.start) > parseISO(task.end)),
    );
    if (overlap) {
      blockers.push({
        type: "labour",
        note: `Crew also on ${overlap.id} (${overlap.title})`,
      });
    }
  }

  // 4. Variation gate
  if (task.variationId && !ctx.approvedVariationIds.includes(task.variationId)) {
    blockers.push({
      type: "variation",
      note: `${task.variationId} not yet approved`,
    });
  }

  // suggested start = max(today, latest predecessor end + 1)
  let suggested = task.start;
  for (const pid of task.dependsOn) {
    const pre = allTasks.find((t) => t.id === pid);
    if (!pre) continue;
    const after = addDays(pre.end, 1);
    if (parseISO(after) > parseISO(suggested)) suggested = after;
  }
  const todayIso = isoDate(today);
  if (parseISO(todayIso) > parseISO(suggested)) suggested = todayIso;

  return { ready: blockers.length === 0, blockers, suggestedStart: suggested };
}

// ---------------------------------------------------------------------------
// Seed: convert legacy ganttRows into real-date tasks for Fitzrovia.
// Anchor: PLANNER_TODAY = 28 Apr 2026.
// ---------------------------------------------------------------------------

function seedFitzroviaIfEmpty() {
  if (typeof window === "undefined") return;
  const pid = "fitzrovia";
  if (localStorage.getItem(SEED_KEY(pid))) return;
  if (read(pid).length > 0) {
    localStorage.setItem(SEED_KEY(pid), "1");
    return;
  }

  const anchor = new Date(2026, 3, 8); // 8 Apr 2026 = day 0
  const at = (offset: number) => isoDate(addDaysDate(anchor, offset));

  const seeds: PlannerTask[] = [
    {
      id: "T-001", projectId: pid, title: "L4 Bedroom partitions", level: "L4", area: "Bedrooms",
      crewId: "mk", start: at(0), end: at(16), progress: 76, status: "behind",
      boqLineIds: ["BOQ-L4-PART"], calloffIds: ["CO-246", "CO-245"], dependsOn: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-002", projectId: pid, title: "L4 Corridor robust walls", level: "L4", area: "Corridor",
      crewId: "mk", start: at(12), end: at(24), progress: 35, status: "on-track",
      boqLineIds: ["BOQ-L4-COR"], calloffIds: ["CO-247"], dependsOn: ["T-001"],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-003", projectId: pid, title: "L5 Bedroom partitions", level: "L5", area: "Bedrooms",
      crewId: "pw", start: at(14), end: at(32), progress: 12, status: "starting",
      boqLineIds: ["BOQ-L5-PART"], calloffIds: ["CO-247"], dependsOn: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-004", projectId: pid, title: "L5 Ceiling MF grid", level: "L5", area: "Ceilings",
      crewId: "aj", start: at(20), end: at(37), progress: 0, status: "scheduled",
      boqLineIds: ["BOQ-L5-CLG"], calloffIds: [], dependsOn: ["T-003"],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-005", projectId: pid, title: "L6 Shaft walls", level: "L6", area: "Shaft cores",
      crewId: undefined, start: at(27), end: at(42), progress: 0, status: "blocked",
      boqLineIds: ["BOQ-L6-SHF"], calloffIds: ["CO-248"], dependsOn: [],
      notes: "Awaiting subcontractor confirmation",
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-006", projectId: pid, title: "Tape & joint — all levels", level: "All", area: "Finishing",
      crewId: "aj", start: at(34), end: at(61), progress: 0, status: "scheduled",
      boqLineIds: ["BOQ-TJ"], calloffIds: ["CO-249"], dependsOn: ["T-002", "T-003"],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-007", projectId: pid, title: "L4 handover milestone", level: "L4", area: "Milestone",
      crewId: undefined, start: at(25), end: at(25), progress: 0, status: "scheduled",
      boqLineIds: [], calloffIds: [], dependsOn: ["T-001", "T-002"], isMilestone: true,
      createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: "T-008", projectId: pid, title: "Lobby bulkheads (VO-002)", level: "Lobby", area: "MEP zones",
      crewId: "mk", start: at(30), end: at(36), progress: 0, status: "scheduled",
      boqLineIds: [], calloffIds: [], variationId: "VO-002", dependsOn: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    },
  ];
  localStorage.setItem(KEY(pid), JSON.stringify(seeds));
  localStorage.setItem(SEED_KEY(pid), "1");
}

function addDaysDate(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useProjectTasks(pid: string): PlannerTask[] {
  const [list, setList] = useState<PlannerTask[]>(() => {
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

export const STATUS_LABEL: Record<TaskStatus, string> = {
  scheduled: "Scheduled",
  starting: "Starting",
  "on-track": "On track",
  behind: "Behind",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_TONE: Record<TaskStatus, string> = {
  scheduled: "bg-[var(--ink-50)] text-[var(--ink-500)]",
  starting: "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  "on-track": "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  behind: "bg-[var(--red-500)]/10 text-[var(--red-500)]",
  blocked: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
  done: "bg-[var(--ink-200)] text-[var(--ink-700)]",
};

export const STATUS_BAR: Record<TaskStatus, string> = {
  scheduled: "var(--ink-500)",
  starting: "var(--accent-500)",
  "on-track": "var(--accent-500)",
  behind: "var(--red-500)",
  blocked: "var(--amber-500)",
  done: "var(--green-600)",
};

// ---------------------------------------------------------------------------
// Cost helpers — bridge planner ↔ labour rates
// ---------------------------------------------------------------------------

export function taskPlannedCost(task: PlannerTask, projectId: string): number {
  if (!task.plannedHours || !task.crewId) return 0;
  return task.plannedHours * effectiveRate(task.crewId, projectId);
}

export function taskActualCost(
  task: PlannerTask,
  projectId: string,
  actualHours: number,
): number {
  if (!task.crewId || actualHours <= 0) return 0;
  return actualHours * effectiveRate(task.crewId, projectId);
}

export function totalPlannedCost(tasks: PlannerTask[], projectId: string): number {
  return tasks
    .filter((t) => t.status !== "done")
    .reduce((s, t) => s + taskPlannedCost(t, projectId), 0);
}