import { useEffect, useState } from "react";

export type UrgentMode = "scroll" | "collapsible" | "top2" | "bell";

const KEY = "qp.sidebar.urgent.mode";
const DEFAULT: UrgentMode = "scroll";
const VALID: UrgentMode[] = ["scroll", "collapsible", "top2", "bell"];

type Listener = (m: UrgentMode) => void;
const listeners = new Set<Listener>();

function read(): UrgentMode {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY) as UrgentMode | null;
  return v && VALID.includes(v) ? v : DEFAULT;
}

export function setUrgentMode(m: UrgentMode) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, m);
  listeners.forEach((l) => l(m));
}

export function useUrgentMode(): UrgentMode {
  const [mode, setMode] = useState<UrgentMode>(DEFAULT);
  useEffect(() => {
    setMode(read());
    const l: Listener = (m) => setMode(m);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return mode;
}