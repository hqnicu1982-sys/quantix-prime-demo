import { useEffect, useState } from "react";

// ============================================================================
// Recent projects — MRU list of project ids the user has visited.
// localStorage-backed, used to populate the sidebar for users who can see
// all projects (Pro/Admin). Site Users / Operatives use assignments instead.
// ============================================================================

const KEY = "qp-recent-projects";
const EVT = "qp-recent-projects-change";
const MAX = 8;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  window.dispatchEvent(new Event(EVT));
}

export function pushRecentProject(id: string) {
  if (!id) return;
  const current = read();
  if (current[0] === id) return; // already MRU
  const next = [id, ...current.filter((x) => x !== id)];
  write(next);
}

export function getRecentProjects(): string[] {
  return read();
}

export function useRecentProjects(): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const refresh = () => setIds(read());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return ids;
}