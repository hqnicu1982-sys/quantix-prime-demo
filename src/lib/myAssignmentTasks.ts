import { useEffect, useState } from "react";

// ============================================================================
// Assignment tasks — cross-project "You've been assigned to <Project>" alerts.
// Written by awardProject() (and any future manual re-assignment). Read by
// HeaderAssignmentBell so a PM sees new work the moment a bid is awarded.
// localStorage-backed (mock backend).
// ============================================================================

export type AssignmentTaskRole = "Project Manager" | "Commercial QS" | "Site Lead";

export type AssignmentTask = {
  id: string;
  memberId: string;          // recipient (team member id)
  projectId: string;
  projectName: string;
  role: AssignmentTaskRole;
  assignedBy: string;        // display name of the actor who awarded
  createdAt: number;         // epoch ms
  ackAt?: number;            // dismissed timestamp
  contractValue?: number;
};

const KEY = "qp-assignment-tasks";
const EVT = "qp-assignment-tasks-change";

function read(): AssignmentTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AssignmentTask[]) : [];
  } catch { return []; }
}

function write(rows: AssignmentTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

function uid() {
  return `at-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function logAssignmentTask(input: Omit<AssignmentTask, "id" | "createdAt">): AssignmentTask {
  const task: AssignmentTask = { id: uid(), createdAt: Date.now(), ...input };
  // De-dupe: same member+project+role, still unacked → skip.
  const existing = read();
  const dupe = existing.find(
    (t) => !t.ackAt && t.memberId === task.memberId && t.projectId === task.projectId && t.role === task.role,
  );
  if (dupe) return dupe;
  write([task, ...existing].slice(0, 200));
  return task;
}

export function ackAssignmentTask(id: string) {
  const rows = read().map((t) => (t.id === id ? { ...t, ackAt: Date.now() } : t));
  write(rows);
}

export function ackAllForMember(memberId: string) {
  const rows = read().map((t) =>
    t.memberId === memberId && !t.ackAt ? { ...t, ackAt: Date.now() } : t,
  );
  write(rows);
}

export function getAssignmentTasks(memberId: string): AssignmentTask[] {
  return read()
    .filter((t) => t.memberId === memberId && !t.ackAt)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function useMyAssignmentTasks(memberId: string): AssignmentTask[] {
  const [rows, setRows] = useState<AssignmentTask[]>(() => getAssignmentTasks(memberId));
  useEffect(() => {
    const refresh = () => setRows(getAssignmentTasks(memberId));
    refresh();
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [memberId]);
  return rows;
}