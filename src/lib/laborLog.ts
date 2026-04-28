import { useEffect, useState } from "react";
import { effectiveRate, getPriceWorkRate } from "./labour";

// ============================================================================
// Labour Log — persistent record of hours worked per member per day.
// localStorage-backed (mock). Feeds Labour KPIs and task actuals.
// ============================================================================

export type LabourLogEntry = {
  id: string;
  projectId: string;
  date: string;          // ISO yyyy-mm-dd
  memberId: string;      // refs team[].id / assignment.memberId
  taskId?: string;       // optional planner task link
  inTime: string;        // "07:00"
  outTime: string;       // "16:30"
  hours: number;         // computed at write time
  work: string;
  late?: boolean;
  createdAt: number;
  status?: LabourLogStatus; // approval workflow — defaults to 'submitted'
  approvedBy?: string;       // member id of approver
  approvedAt?: number;       // ms timestamp
  rejectionReason?: string;
  // Pay mode — defaults to "hourly". When "pw", cost is driven by PW rate × qty
  // rather than hours × £/h. Hours remain attendance info.
  payMode?: "hourly" | "pw";
  pwRateId?: string;
  pwQty?: number;
  pwAmount?: number; // snapshot at write time
};

export type LabourLogStatus = "submitted" | "approved" | "rejected";

// ---------- cost helpers ----------
/**
 * Returns the cost (in £) of a single labour log entry, respecting its pay mode.
 * - hourly (default): hours × effectiveRate(memberId, projectId)
 * - pw: snapshot pwAmount, or recomputed qty × rate from the live PW catalog
 */
export function computeEntryCost(entry: LabourLogEntry): number {
  if (entry.payMode === "pw") {
    if (typeof entry.pwAmount === "number") return entry.pwAmount;
    if (entry.pwRateId) {
      const r = getPriceWorkRate(entry.projectId, entry.pwRateId);
      if (r) {
        const qty = entry.pwQty ?? (r.unit === "lump" ? 1 : 0);
        return qty * r.rate;
      }
    }
    return 0;
  }
  return entry.hours * effectiveRate(entry.memberId, entry.projectId);
}

const KEY = "qp-labour-log";
const SEED_KEY = "qp-labour-log-seeded-v1";
const EVT = "qp-labour-log-change";

function read(): LabourLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as LabourLogEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: LabourLogEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function uid() {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function computeHours(inTime: string, outTime: string): number {
  const [ih, im] = inTime.split(":").map(Number);
  const [oh, om] = outTime.split(":").map(Number);
  if ([ih, im, oh, om].some((n) => Number.isNaN(n))) return 0;
  const mins = oh * 60 + om - (ih * 60 + im);
  return Math.max(0, Math.round((mins / 60) * 10) / 10);
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  // Seed with the dailyReport mock so KPIs are populated on first run.
  // Use today's date to keep things relevant across time.
  const today = new Date().toISOString().slice(0, 10);
  const seeds: Omit<LabourLogEntry, "id" | "createdAt">[] = [
    { projectId: "fitzrovia", date: today, memberId: "mk", inTime: "07:12", outTime: "16:30", hours: 9.3, work: "L4 + L5 boarding" },
    { projectId: "fitzrovia", date: today, memberId: "aj", inTime: "07:05", outTime: "16:30", hours: 9.4, work: "L4 taping & jointing" },
    { projectId: "fitzrovia", date: today, memberId: "pw", inTime: "08:14", outTime: "16:30", hours: 8.3, work: "L6 framing setup", late: true },
    // a few prior days to give "MTD" some weight
    ...Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1));
      const iso = d.toISOString().slice(0, 10);
      return [
        { projectId: "fitzrovia", date: iso, memberId: "mk", inTime: "07:00", outTime: "16:30", hours: 9.5, work: "Drylining" },
        { projectId: "fitzrovia", date: iso, memberId: "aj", inTime: "07:00", outTime: "16:00", hours: 9.0, work: "Tape & joint" },
        { projectId: "fitzrovia", date: iso, memberId: "pw", inTime: "07:30", outTime: "16:30", hours: 9.0, work: "Framing" },
      ];
    }).flat(),
  ];
  const list: LabourLogEntry[] = seeds.map((s, i) => ({
    ...s,
    id: `log-seed-${i}`,
    createdAt: Date.now() - i * 1000,
    status: "approved",
    approvedBy: "sm",
    approvedAt: Date.now() - i * 1000,
  }));
  write(list);
  localStorage.setItem(SEED_KEY, "1");
}

// ---------- queries ----------

export function getLabourLogs(projectId?: string): LabourLogEntry[] {
  ensureSeed();
  const all = read();
  return projectId ? all.filter((e) => e.projectId === projectId) : all;
}

export function getLabourLogsForDate(projectId: string, date: string): LabourLogEntry[] {
  return getLabourLogs(projectId).filter((e) => e.date === date);
}

export function getActualHours(projectId: string, memberId: string): number {
  return getLabourLogs(projectId)
    .filter((e) => e.memberId === memberId && (e.status ?? "submitted") === "approved")
    .reduce((s, e) => s + e.hours, 0);
}

export function getActualHoursForTask(projectId: string, taskId: string): number {
  return getLabourLogs(projectId)
    .filter((e) => e.taskId === taskId && (e.status ?? "submitted") === "approved")
    .reduce((s, e) => s + e.hours, 0);
}

export function getPendingHours(projectId: string, memberId?: string): number {
  return getLabourLogs(projectId)
    .filter((e) => (e.status ?? "submitted") === "submitted" && (!memberId || e.memberId === memberId))
    .reduce((s, e) => s + e.hours, 0);
}

export function getPendingLogs(projectId: string): LabourLogEntry[] {
  return getLabourLogs(projectId).filter((e) => (e.status ?? "submitted") === "submitted");
}

export function getLastLogDate(projectId: string, memberId: string): string | undefined {
  const list = getLabourLogs(projectId)
    .filter((e) => e.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return list[0]?.date;
}

// ---------- mutations ----------

export function addLabourLog(
  entry: Omit<LabourLogEntry, "id" | "createdAt" | "hours"> & { hours?: number },
): LabourLogEntry {
  const list = getLabourLogs();
  const hours = entry.hours ?? computeHours(entry.inTime, entry.outTime);
  const next: LabourLogEntry = {
    ...entry,
    hours,
    status: entry.status ?? "submitted",
    id: uid(),
    createdAt: Date.now(),
  };
  write([...list, next]);
  return next;
}

export function deleteLabourLog(id: string) {
  write(read().filter((e) => e.id !== id));
}

export function approveLabourLog(id: string, approverId: string) {
  write(
    read().map((e) =>
      e.id === id ? { ...e, status: "approved", approvedBy: approverId, approvedAt: Date.now(), rejectionReason: undefined } : e,
    ),
  );
}

export function rejectLabourLog(id: string, approverId: string, reason?: string) {
  write(
    read().map((e) =>
      e.id === id ? { ...e, status: "rejected", approvedBy: approverId, approvedAt: Date.now(), rejectionReason: reason } : e,
    ),
  );
}

// ---------- React hooks ----------

function useStore<T>(reader: () => T): T {
  const [state, setState] = useState<T>(() => reader());
  useEffect(() => {
    const refresh = () => setState(reader());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export function useLabourLogs(projectId: string) {
  return useStore(() => getLabourLogs(projectId));
}

export function useLabourLogsForDate(projectId: string, date: string) {
  return useStore(() => getLabourLogsForDate(projectId, date));
}
