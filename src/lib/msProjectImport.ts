import {
  addDays,
  addTask,
  deleteTask,
  isoDate,
  PLANNER_TODAY,
  updateTask,
  type PlannerTask,
} from "./planner";

// ============================================================================
// MSProject import — simulation layer.
// Generates a deterministic mock .mpp/.xml payload per project that mirrors
// a typical drylining schedule, then exposes mapping helpers used by the
// Planner import dialog. No real file parsing — the connector is stubbed but
// the data shape matches what an Asta/MSP feed would deliver.
// ============================================================================

export type MspTaskRow = {
  uid: number;              // MSProject UID
  outline: string;          // "1.2.3"
  name: string;
  start: string;            // ISO yyyy-mm-dd
  finish: string;
  durationDays: number;
  workHours: number;        // total man-hours
  resourceNames: string;    // free-text
  pctComplete: number;      // 0..100
};

export type MspBundle = {
  fileName: string;
  baselineName: string;
  exportedAt: string;       // ISO
  rows: MspTaskRow[];
};

const TASK_TEMPLATES: { name: string; days: number; hours: number; resource: string }[] = [
  { name: "Mobilisation & site setup", days: 3, hours: 48, resource: "Site team" },
  { name: "Track & stud installation — L4", days: 8, hours: 320, resource: "Drylining crew A" },
  { name: "MEP first fix coordination — L4", days: 5, hours: 80, resource: "MEP sub" },
  { name: "Plasterboard Side A — L4", days: 6, hours: 240, resource: "Drylining crew A" },
  { name: "Insulation install — L4", days: 4, hours: 96, resource: "Drylining crew B" },
  { name: "Plasterboard Side B — L4", days: 6, hours: 240, resource: "Drylining crew A" },
  { name: "Acoustic seal & detailing — L4", days: 3, hours: 72, resource: "Acoustic sub" },
  { name: "Track & stud installation — L5", days: 8, hours: 320, resource: "Drylining crew B" },
  { name: "Plasterboard L5 (both sides)", days: 10, hours: 400, resource: "Drylining crew B" },
  { name: "Ceiling MF grid — Lobby", days: 5, hours: 150, resource: "Ceiling crew" },
  { name: "Snagging & handover — L4", days: 4, hours: 96, resource: "Site team" },
];

/**
 * Build a deterministic mock MSP export for any project. The same project
 * always produces the same rows, so the preview is stable across opens.
 */
export function simulateMspBundle(projectId: string, startDate: string = isoDate(PLANNER_TODAY)): MspBundle {
  let cursor = startDate;
  const rows: MspTaskRow[] = TASK_TEMPLATES.map((tpl, i) => {
    const start = cursor;
    const finish = addDays(start, Math.max(0, tpl.days - 1));
    // overlap: next task starts 60% through current
    const overlap = Math.max(1, Math.floor(tpl.days * 0.6));
    cursor = addDays(start, overlap);
    return {
      uid: 1000 + i,
      outline: `1.${i + 1}`,
      name: tpl.name,
      start,
      finish,
      durationDays: tpl.days,
      workHours: tpl.hours,
      resourceNames: tpl.resource,
      pctComplete: 0,
    };
  });
  return {
    fileName: `${projectId}-programme.mpp`,
    baselineName: "Baseline 1 — Contractor programme",
    exportedAt: new Date().toISOString(),
    rows,
  };
}

// ---------------------------------------------------------------------------
// Fuzzy matching MSP row ↔ existing Planner task
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenScore(a: string, b: string): number {
  const at = new Set(normalize(a).split(" ").filter((w) => w.length > 2));
  const bt = new Set(normalize(b).split(" ").filter((w) => w.length > 2));
  if (at.size === 0 || bt.size === 0) return 0;
  let hits = 0;
  for (const w of at) if (bt.has(w)) hits += 1;
  return hits / Math.max(at.size, bt.size);
}

export type MspMappingAction = "create" | "update" | "skip";

export type MspMappingRow = {
  msp: MspTaskRow;
  action: MspMappingAction;
  matchedTaskId?: string;
  matchScore: number; // 0..1
};

export function buildInitialMapping(rows: MspTaskRow[], tasks: PlannerTask[]): MspMappingRow[] {
  return rows.map((msp) => {
    let best: { id: string; score: number } | null = null;
    for (const t of tasks) {
      const s = tokenScore(msp.name, t.title);
      if (!best || s > best.score) best = { id: t.id, score: s };
    }
    if (best && best.score >= 0.5) {
      return { msp, action: "update" as const, matchedTaskId: best.id, matchScore: best.score };
    }
    return { msp, action: "create" as const, matchScore: best?.score ?? 0 };
  });
}

export type MspApplySummary = {
  created: number;
  updated: number;
  skipped: number;
  totalHours: number;
};

export function summarizeMapping(mapping: MspMappingRow[]): MspApplySummary {
  return mapping.reduce<MspApplySummary>(
    (acc, m) => {
      if (m.action === "create") acc.created += 1;
      else if (m.action === "update") acc.updated += 1;
      else acc.skipped += 1;
      if (m.action !== "skip") acc.totalHours += m.msp.workHours;
      return acc;
    },
    { created: 0, updated: 0, skipped: 0, totalHours: 0 },
  );
}

// ---------------------------------------------------------------------------
// Apply a bundle to a project in one shot.
// - "merge": keep existing crews/calloffs on matched tasks, fuzzy create the rest.
// - "replace": wipe existing tasks for this project, recreate all from bundle.
// ---------------------------------------------------------------------------

function levelFromName(name: string): string {
  const m = name.match(/L\d+/i);
  return m ? m[0].toUpperCase() : "All";
}

export type ApplyMode = "merge" | "replace";

export type ApplyResult = {
  created: number;
  updated: number;
  removed: number;
  totalHours: number;
};

export function applyBundleToProject(
  projectId: string,
  bundle: MspBundle,
  existing: PlannerTask[],
  mapping: MspMappingRow[],
  options: { mode: ApplyMode; defaultCrewId?: string },
): ApplyResult {
  const { mode, defaultCrewId } = options;
  let created = 0;
  let updated = 0;
  let removed = 0;
  let totalHours = 0;

  if (mode === "replace") {
    for (const t of existing) deleteTask(projectId, t.id);
    removed = existing.length;
    for (const r of bundle.rows) {
      const newTask: Omit<PlannerTask, "id" | "createdAt" | "updatedAt"> = {
        projectId,
        title: r.name,
        level: levelFromName(r.name),
        crewId: defaultCrewId,
        start: r.start,
        end: r.finish,
        progress: r.pctComplete,
        status: "scheduled",
        boqLineIds: [],
        calloffIds: [],
        dependsOn: [],
        plannedHours: r.workHours,
        notes: `Synced from ${bundle.fileName} · UID ${r.uid}`,
      };
      addTask(projectId, newTask);
      created += 1;
      totalHours += r.workHours;
    }
    return { created, updated, removed, totalHours };
  }

  for (const m of mapping) {
    if (m.action === "skip") continue;
    if (m.action === "update" && m.matchedTaskId) {
      const e = existing.find((t) => t.id === m.matchedTaskId);
      updateTask(projectId, m.matchedTaskId, {
        title: m.msp.name,
        start: m.msp.start,
        end: m.msp.finish,
        plannedHours: m.msp.workHours,
        crewId: e?.crewId ?? defaultCrewId,
        notes: `Synced from ${bundle.fileName} · UID ${m.msp.uid}`,
      });
      updated += 1;
      totalHours += m.msp.workHours;
    } else if (m.action === "create") {
      const newTask: Omit<PlannerTask, "id" | "createdAt" | "updatedAt"> = {
        projectId,
        title: m.msp.name,
        level: levelFromName(m.msp.name),
        crewId: defaultCrewId,
        start: m.msp.start,
        end: m.msp.finish,
        progress: m.msp.pctComplete,
        status: "scheduled",
        boqLineIds: [],
        calloffIds: [],
        dependsOn: [],
        plannedHours: m.msp.workHours,
        notes: `Imported from ${bundle.fileName} · UID ${m.msp.uid} · ${m.msp.resourceNames}`,
      };
      addTask(projectId, newTask);
      created += 1;
      totalHours += m.msp.workHours;
    }
  }
  return { created, updated, removed, totalHours };
}