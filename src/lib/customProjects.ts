import { useEffect, useState } from "react";
import type { Project, Health } from "./mockData";
import { clearPaymentCycle } from "./paymentCycle";
import { clearProjectVariations } from "./variations";
import { deleteInvoicesByProject } from "./invoiceRegistry";

const KEY = "qp-custom-projects";
const EVT = "qp-custom-projects-change";
const OVERRIDES_KEY = "qp-project-overrides";
const HIDDEN_KEY = "qp-hidden-projects";

export type ProjectExtras = {
  specsFileName?: string;
  plannerTemplate?: "drylining-standard" | "fitout-standard" | "custom";
  plannerFileName?: string;
};

const EXTRAS_KEY = (id: string) => `qp-project-extras-${id}`;

export function saveProjectExtras(id: string, extras: ProjectExtras) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXTRAS_KEY(id), JSON.stringify(extras));
}

export function readProjectExtras(id: string): ProjectExtras {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EXTRAS_KEY(id));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function read(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Project[]) : [];
  } catch {
    return [];
  }
}

function write(list: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function addCustomProject(p: Omit<Project, "id" | "hasFullData"> & { id?: string }): Project {
  const id =
    p.id ??
    p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
  const project: Project = { ...p, id, hasFullData: false };
  const next = [project, ...read()];
  write(next);
  return project;
}

export function deleteCustomProject(id: string): boolean {
  const list = read();
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) return false;
  write(next);
  if (typeof window !== "undefined") {
    // Best-effort cleanup of any per-project extras.
    try { localStorage.removeItem(EXTRAS_KEY(id)); } catch { /* noop */ }
    // Cascade: clear payment cycle, variations, and any invoices belonging to this project.
    try { clearPaymentCycle(id); } catch { /* noop */ }
    try { clearProjectVariations(id); } catch { /* noop */ }
    try { deleteInvoicesByProject(id); } catch { /* noop */ }
  }
  return true;
}

export function isCustomProject(id: string): boolean {
  return read().some((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Edit / hide support for ANY project (custom or seeded mock).
// Custom projects are mutated in-place. Seeded mocks get an override layer
// stored in localStorage and a soft-hide list for "deletion".
// ---------------------------------------------------------------------------

export type ProjectPatch = Partial<Pick<Project,
  "name" | "subtitle" | "mainContractor" | "contractValue" |
  "margin" | "progress" | "health" | "startDate" | "endDate"
>>;

function readOverrides(): Record<string, ProjectPatch> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}"); } catch { return {}; }
}
function writeOverrides(o: Record<string, ProjectPatch>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
  window.dispatchEvent(new CustomEvent(EVT));
}

function readHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeHidden(list: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function getProjectOverrides(): Record<string, ProjectPatch> {
  return readOverrides();
}

export function getHiddenProjectIds(): string[] {
  return readHidden();
}

/** Update a project. Works for custom AND seeded mocks (via override layer). */
export function updateProject(id: string, patch: ProjectPatch) {
  const list = read();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    write(next);
    return;
  }
  const overrides = readOverrides();
  overrides[id] = { ...(overrides[id] ?? {}), ...patch };
  writeOverrides(overrides);
}

/** Delete (custom) or hide (seeded) a project. */
export function removeProject(id: string) {
  if (deleteCustomProject(id)) return;
  const hidden = readHidden();
  if (!hidden.includes(id)) writeHidden([...hidden, id]);
  const overrides = readOverrides();
  if (overrides[id]) {
    delete overrides[id];
    writeOverrides(overrides);
  }
}

export function useProjectOverrides(): Record<string, ProjectPatch> {
  const [o, setO] = useState<Record<string, ProjectPatch>>({});
  useEffect(() => {
    setO(readOverrides());
    const onChange = () => setO(readOverrides());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return o;
}

export function useHiddenProjectIds(): string[] {
  const [h, setH] = useState<string[]>([]);
  useEffect(() => {
    setH(readHidden());
    const onChange = () => setH(readHidden());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return h;
}

export function useCustomProjects(): Project[] {
  const [list, setList] = useState<Project[]>([]);
  useEffect(() => {
    setList(read());
    const onChange = () => setList(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return list;
}

export function inferHealth(margin: number, progress: number): Health {
  if (progress < 10) return "starting";
  if (margin < 12) return "risk";
  if (margin < 18) return "watch";
  return "healthy";
}