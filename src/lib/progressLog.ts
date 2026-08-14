import { useEffect, useState } from "react";
import { getCurrentUser } from "./currentUser";
import {
  PLANNER_TODAY,
  addDays,
  daysBetween,
  isoDate,
  parseISO,
  type PlannerTask,
} from "./planner";

// ============================================================================
// Progress log — an append-only history of everything that happens to a task
// in the planner: date moves, duration changes, progress updates, status
// changes and free-text site comments. This is what turns a live programme
// into a defensible progress & delay report for the main contractor.
// localStorage-backed (mock), same pattern as the other registries.
// ============================================================================

export type ProgressEventKind =
  | "created"
  | "dates"
  | "duration"
  | "progress"
  | "status"
  | "comment";

export type DelayCause =
  | "material"
  | "labour"
  | "design"
  | "predecessor"
  | "variation"
  | "access"
  | "weather"
  | "other";

export const DELAY_CAUSE_LABEL: Record<DelayCause, string> = {
  material: "Material / procurement",
  labour: "Labour availability",
  design: "Design / information",
  predecessor: "Preceding trade",
  variation: "Variation pending",
  access: "Access / possession",
  weather: "Weather",
  other: "Other",
};

export type ProgressEvent = {
  id: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  kind: ProgressEventKind;
  at: number;              // epoch ms
  author: string;          // person name
  from?: string;           // previous value (display form)
  to?: string;             // new value (display form)
  days?: number;           // schedule impact in days (+ slip, - pull forward)
  cause?: DelayCause;
  reason?: string;         // free text explanation / comment body
};

const KEY = (pid: string) => `qp-progress-log-${pid}`;
const SEED_KEY = (pid: string) => `qp-progress-log-seeded-${pid}`;
const EVT = "qp-progress-log-change";

function uid() {
  return `PE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function read(pid: string): ProgressEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(pid));
    return raw ? (JSON.parse(raw) as ProgressEvent[]) : [];
  } catch {
    return [];
  }
}

function write(pid: string, list: ProgressEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid), JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

export function getProgressLog(pid: string): ProgressEvent[] {
  seedIfEmpty(pid);
  return read(pid).sort((a, b) => b.at - a.at);
}

export function logProgressEvent(
  pid: string,
  e: Omit<ProgressEvent, "id" | "projectId" | "at" | "author"> &
    Partial<Pick<ProgressEvent, "at" | "author">>,
) {
  if (typeof window === "undefined") return;
  const author = e.author ?? getCurrentUser().name;
  const event: ProgressEvent = {
    ...e,
    id: uid(),
    projectId: pid,
    at: e.at ?? Date.now(),
    author,
  };
  write(pid, [...read(pid), event]);
  return event;
}

/**
 * Diff an update against the previous task state and append the resulting
 * events. Called from planner.updateTask so every edit path is captured.
 */
export function logTaskDiff(
  pid: string,
  before: PlannerTask,
  patch: Partial<PlannerTask>,
  meta?: { reason?: string; cause?: DelayCause; author?: string },
) {
  const title = (patch.title ?? before.title) as string;
  const base = { taskId: before.id, taskTitle: title, ...meta };

  const startChanged = patch.start !== undefined && patch.start !== before.start;
  const endChanged = patch.end !== undefined && patch.end !== before.end;

  if (startChanged || endChanged) {
    const nextStart = patch.start ?? before.start;
    const nextEnd = patch.end ?? before.end;
    const startShift = daysBetween(before.start, nextStart);
    const endShift = daysBetween(before.end, nextEnd);
    const moved = startShift !== 0 && startShift === endShift;
    logProgressEvent(pid, {
      ...base,
      kind: moved ? "dates" : "duration",
      from: `${before.start} → ${before.end}`,
      to: `${nextStart} → ${nextEnd}`,
      days: moved ? startShift : endShift - startShift,
    });
  }

  if (patch.progress !== undefined && patch.progress !== before.progress) {
    logProgressEvent(pid, {
      ...base,
      kind: "progress",
      from: `${before.progress}%`,
      to: `${patch.progress}%`,
    });
  }

  if (patch.status !== undefined && patch.status !== before.status) {
    logProgressEvent(pid, {
      ...base,
      kind: "status",
      from: before.status,
      to: patch.status,
    });
  }

  const notesChanged =
    patch.notes !== undefined && (patch.notes ?? "") !== (before.notes ?? "");
  if (notesChanged && (patch.notes ?? "").trim()) {
    logProgressEvent(pid, { ...base, kind: "comment", reason: patch.notes });
  }
}

export function useProgressLog(pid: string): ProgressEvent[] {
  const [list, setList] = useState<ProgressEvent[]>([]);
  useEffect(() => {
    const refresh = () => setList(getProgressLog(pid));
    refresh();
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!d?.projectId || d.projectId === pid) refresh();
    };
    window.addEventListener(EVT, h as EventListener);
    return () => window.removeEventListener(EVT, h as EventListener);
  }, [pid]);
  return list;
}

// ---------------------------------------------------------------------------
// Report periods
// ---------------------------------------------------------------------------

export type ReportPeriod = "week" | "fortnight" | "month" | "all";

export const PERIOD_LABEL: Record<ReportPeriod, string> = {
  week: "This week",
  fortnight: "Last 2 weeks",
  month: "This month",
  all: "Whole programme",
};

export function periodStartIso(period: ReportPeriod, today = PLANNER_TODAY): string {
  const t = isoDate(today);
  if (period === "all") return "1970-01-01";
  const back = period === "week" ? 7 : period === "fortnight" ? 14 : 30;
  return addDays(t, -back);
}

// ---------------------------------------------------------------------------
// Delay register — derived from the event log
// ---------------------------------------------------------------------------

export type DelayRow = {
  taskId: string;
  taskTitle: string;
  originalStart: string;
  originalEnd: string;
  currentStart: string;
  currentEnd: string;
  daysLost: number;
  cause: DelayCause;
  explanation: string;
  recordedBy: string;
  recordedAt: number;
};

/** Baseline dates for a task = the earliest "from" recorded in the log. */
export function baselineDates(
  task: PlannerTask,
  events: ProgressEvent[],
): { start: string; end: string } {
  const dateEvents = events
    .filter((e) => e.taskId === task.id && (e.kind === "dates" || e.kind === "duration") && e.from)
    .sort((a, b) => a.at - b.at);
  const first = dateEvents[0];
  if (!first?.from) return { start: task.start, end: task.end };
  const [s, e] = first.from.split(" → ");
  return { start: s ?? task.start, end: e ?? task.end };
}

export function buildDelayRegister(
  tasks: PlannerTask[],
  events: ProgressEvent[],
  sinceIso: string,
): DelayRow[] {
  const rows: DelayRow[] = [];
  for (const t of tasks) {
    const slips = events.filter(
      (e) =>
        e.taskId === t.id &&
        (e.kind === "dates" || e.kind === "duration") &&
        (e.days ?? 0) > 0 &&
        isoDate(new Date(e.at)) >= sinceIso,
    );
    if (slips.length === 0) continue;
    const daysLost = slips.reduce((s, e) => s + (e.days ?? 0), 0);
    const last = slips.sort((a, b) => b.at - a.at)[0];
    const base = baselineDates(t, events);
    const notes = [
      ...slips.map((e) => e.reason).filter(Boolean),
      t.notes,
    ].filter(Boolean) as string[];
    rows.push({
      taskId: t.id,
      taskTitle: t.title,
      originalStart: base.start,
      originalEnd: base.end,
      currentStart: t.start,
      currentEnd: t.end,
      daysLost,
      cause: last.cause ?? inferCause(t, notes.join(" ")),
      explanation: notes.length ? Array.from(new Set(notes)).join(" · ") : "No reason recorded against the change.",
      recordedBy: last.author,
      recordedAt: last.at,
    });
  }
  return rows.sort((a, b) => b.daysLost - a.daysLost);
}

function inferCause(task: PlannerTask, text: string): DelayCause {
  const s = text.toLowerCase();
  if (/call-?off|deliver|material|supplier|stock/.test(s)) return "material";
  if (/crew|labour|operative|manpower|sub-?contractor|subcontractor/.test(s)) return "labour";
  if (/drawing|rfi|design|detail|revision/.test(s)) return "design";
  if (/variation|vo\b|instruction/.test(s)) return "variation";
  if (/access|possession|scaffold|lift/.test(s)) return "access";
  if (/weather|rain|frost|wind/.test(s)) return "weather";
  if (task.dependsOn.length) return "predecessor";
  return "other";
}

// ---------------------------------------------------------------------------
// Progress rows
// ---------------------------------------------------------------------------

export type ProgressRow = {
  taskId: string;
  title: string;
  level: string;
  crew: string;
  plannedStart: string;
  plannedEnd: string;
  currentStart: string;
  currentEnd: string;
  progress: number;
  expected: number;
  status: PlannerTask["status"];
  varianceDays: number;
};

export function expectedProgress(t: PlannerTask, today = PLANNER_TODAY): number {
  const total = Math.max(1, daysBetween(t.start, t.end) + 1);
  const elapsed = daysBetween(t.start, isoDate(today)) + 1;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export function buildProgressRows(
  tasks: PlannerTask[],
  events: ProgressEvent[],
  crewName: (t: PlannerTask) => string,
  today = PLANNER_TODAY,
): ProgressRow[] {
  return tasks
    .slice()
    .sort((a, b) => (parseISO(a.start) < parseISO(b.start) ? -1 : 1))
    .map((t) => {
      const base = baselineDates(t, events);
      return {
        taskId: t.id,
        title: t.title,
        level: t.area ? `${t.level} / ${t.area}` : t.level,
        crew: crewName(t),
        plannedStart: base.start,
        plannedEnd: base.end,
        currentStart: t.start,
        currentEnd: t.end,
        progress: t.progress,
        expected: t.status === "done" ? 100 : expectedProgress(t, today),
        status: t.status,
        varianceDays: -daysBetween(base.end, t.end),
      };
    });
}

// ---------------------------------------------------------------------------
// Report commentary (persisted per project + period)
// ---------------------------------------------------------------------------

const COMMENTARY_KEY = (pid: string) => `qp-progress-commentary-${pid}`;

export function getCommentary(pid: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(COMMENTARY_KEY(pid)) ?? "";
}

export function setCommentary(pid: string, text: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMENTARY_KEY(pid), text);
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

// ---------------------------------------------------------------------------
// Demo seed — gives the report real history to summarise.
// ---------------------------------------------------------------------------

const DAY = 86_400_000;

function seedIfEmpty(pid: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY(pid))) return;
  if (read(pid).length > 0) {
    localStorage.setItem(SEED_KEY(pid), "1");
    return;
  }
  let seeds: ProgressEvent[] = [];
  const anchor = PLANNER_TODAY.getTime();
  const mk = (
    daysAgo: number,
    taskId: string,
    taskTitle: string,
    e: Partial<ProgressEvent>,
  ): ProgressEvent => ({
    id: uid() + Math.random().toString(36).slice(2, 5),
    projectId: pid,
    taskId,
    taskTitle,
    kind: "comment",
    at: anchor - daysAgo * DAY,
    author: "Nick Aldea",
    ...e,
  });

  if (pid === "fitzrovia") {
    seeds = [
      mk(11, "T-004", "L5 Boarding — Zone A", {
        kind: "dates",
        from: "2026-04-20 → 2026-05-01",
        to: "2026-04-24 → 2026-05-05",
        days: 4,
        cause: "material",
        reason:
          "Plasterboard call-off CO-248 still in draft — supplier could not confirm delivery. Crew redeployed to L4 to avoid idle time.",
      }),
      mk(9, "T-004", "L5 Boarding — Zone A", {
        kind: "comment",
        author: "Paweł Wilkowski",
        reason: "Confirmed with supplier: delivery booked, 2 pallets short of full order.",
      }),
      mk(7, "T-006", "L4 MF Ceilings", {
        kind: "dates",
        from: "2026-04-22 → 2026-05-06",
        to: "2026-04-24 → 2026-05-08",
        days: 2,
        cause: "design",
        reason:
          "Drawing A-201 reissued P18 after tender set — ceiling zone re-detailed, QS review raised 3 findings.",
      }),
      mk(5, "T-006", "L4 MF Ceilings", { kind: "progress", from: "10%", to: "35%" }),
      mk(4, "T-002", "L4 Metal Stud Partitions", { kind: "progress", from: "60%", to: "85%" }),
      mk(3, "T-009", "Lobby Feature Wall", {
        kind: "dates",
        from: "2026-05-04 → 2026-05-15",
        to: "2026-05-07 → 2026-05-18",
        days: 3,
        cause: "access",
        reason:
          "Main contractor had not released the lobby — scaffold from the façade trade still in place.",
      }),
      mk(2, "T-002", "L4 Metal Stud Partitions", {
        kind: "comment",
        author: "Piu Piu Chick",
        reason: "Two-hour stand-down: hoist unavailable for board distribution.",
      }),
      mk(1, "T-004", "L5 Boarding — Zone A", { kind: "status", from: "blocked", to: "on-track" }),
    ];
  } else if (pid === "camden") {
    seeds = [
      mk(8, "T-003", "L2 Partitions", {
        kind: "dates",
        from: "2026-04-21 → 2026-05-02",
        to: "2026-04-23 → 2026-05-04",
        days: 2,
        cause: "labour",
        reason: "Two operatives moved to Fitzrovia to recover L5 boarding — programme re-sequenced.",
      }),
      mk(4, "T-003", "L2 Partitions", { kind: "progress", from: "25%", to: "45%" }),
      mk(2, "T-005", "L2 Tape & Joint", {
        kind: "comment",
        reason: "Preceding M&E first fix not signed off — holding start until sign-off received.",
      }),
    ];
  }
  if (seeds.length) write(pid, seeds);
  localStorage.setItem(SEED_KEY(pid), "1");
}
