import { useEffect, useState } from "react";

// ============================================================================
// Award baseline — immutable snapshot taken the moment a tender is awarded.
// All future variations & profit-forecast tracking measure against this.
// localStorage-backed (mock).
// ============================================================================

export type AwardBaseline = {
  projectId: string;
  frozenAt: number;              // epoch ms
  frozenBy: string;              // display name
  contractValue: number;         // £ contract value at award
  estimatedMargin: number;       // % as recorded on the tender
  boqLineCount: number;          // rows of BoQ frozen
  systemCount: number;
  drawingRevisionIds: string[];  // tender drawings promoted to C0
  notes?: string;
};

const KEY = "qp-award-baselines";
const EVT = "qp-award-baseline-change";

function read(): AwardBaseline[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AwardBaseline[]) : [];
  } catch { return []; }
}

function write(rows: AwardBaseline[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function getBaseline(projectId: string): AwardBaseline | undefined {
  return read().find((b) => b.projectId === projectId);
}

export function freezeBaseline(b: AwardBaseline): AwardBaseline {
  const rows = read().filter((r) => r.projectId !== b.projectId);
  write([b, ...rows]);
  return b;
}

export function useAwardBaseline(projectId: string): AwardBaseline | undefined {
  const [state, setState] = useState<AwardBaseline | undefined>(() => getBaseline(projectId));
  useEffect(() => {
    const refresh = () => setState(getBaseline(projectId));
    refresh();
    window.addEventListener(EVT, refresh);
    return () => window.removeEventListener(EVT, refresh);
  }, [projectId]);
  return state;
}