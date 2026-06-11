import { useSyncExternalStore } from "react";
import { currentUser } from "./mockData";

// Per-project, per-date daily-report submission registry. Backs the
// "Submit to Kier" button so once submitted, the report is locked.

export type DailyReportSubmission = {
  id: string;
  projectId: string;
  date: string;        // YYYY-MM-DD
  mainContractor: string;
  ts: string;
  actor: string;
  note?: string;
};

const KEY = "qp-daily-submissions";
const EVT = "qp-daily-submissions-change";

function read(): DailyReportSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DailyReportSubmission[]) : [];
  } catch {
    return [];
  }
}

function write(rows: DailyReportSubmission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
  };
}

let _snap: DailyReportSubmission[] = read();
function snapshot(): DailyReportSubmission[] {
  const fresh = read();
  if (fresh.length !== _snap.length || fresh[0]?.id !== _snap[0]?.id) _snap = fresh;
  return _snap;
}

export function useDailyReportSubmission(projectId: string, date: string): DailyReportSubmission | undefined {
  const all = useSyncExternalStore(subscribe, () => snapshot(), () => snapshot());
  return all.find((s) => s.projectId === projectId && s.date === date);
}

export function useProjectDailyReports(projectId: string): DailyReportSubmission[] {
  const all = useSyncExternalStore(subscribe, () => snapshot(), () => snapshot());
  return all
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
}

export function recordDailyReportSubmission(input: Omit<DailyReportSubmission, "id" | "ts" | "actor">) {
  const all = read();
  const dup = all.find((s) => s.projectId === input.projectId && s.date === input.date);
  if (dup) return dup;
  const next: DailyReportSubmission = {
    ...input,
    id: `${input.projectId}-${input.date}-${Date.now()}`,
    ts: new Date().toISOString(),
    actor: currentUser.name,
  };
  write([next, ...all]);
  return next;
}
