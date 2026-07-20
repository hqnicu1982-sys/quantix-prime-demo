import { useEffect, useState } from "react";

// ============================================================================
// QS Findings — per (project, target-revision) list of QS-recorded changes
// observed when comparing a revision against the tender baseline. The QS
// types the findings; Quantix never invents quantities.
// ============================================================================

export type FindingType = "added" | "removed" | "substituted" | "extent" | "note";

export const FINDING_TYPES: {
  value: FindingType; label: string;
  tone: "success" | "danger" | "warning" | "info" | "neutral";
}[] = [
  { value: "added",        label: "Added",          tone: "success" },
  { value: "removed",      label: "Removed",        tone: "danger" },
  { value: "substituted",  label: "Substituted",    tone: "warning" },
  { value: "extent",       label: "Extent changed", tone: "info" },
  { value: "note",         label: "Note",           tone: "neutral" },
];

export type QsFinding = {
  id: string;
  type: FindingType;
  systemFrom?: string;   // for substituted
  systemTo?: string;     // for substituted
  system?: string;       // for added / removed / extent / note
  location?: string;
  qty?: string;          // free-text, muted (e.g. "~45 m²")
  note?: string;
  createdAt: number;
};

export type QsReviewStatus = "open" | "reviewed-no-impact" | "reviewed-variation";

export type QsReview = {
  status: QsReviewStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  variationId?: string;
  findings: QsFinding[];
};

const KEY = (pid: string, revId: string) => `qp-qs-findings-${pid}-${revId}`;
const EVT = "qp-qs-findings-change";

const empty: QsReview = { status: "open", findings: [] };

// Preloaded findings for the Fitzrovia demo (revision P18 against P14).
function seedFor(pid: string, revId: string): QsReview {
  if (pid === "fitzrovia" && revId === "seed-fz-3") {
    const now = Date.parse("2026-06-06");
    return {
      status: "open",
      findings: [
        {
          id: "seed-f-1", type: "substituted",
          systemFrom: "WL4", systemTo: "WL1",
          location: "Internal wall linings, Cinema",
          qty: "~38 m²",
          createdAt: now,
        },
        {
          id: "seed-f-2", type: "substituted",
          systemFrom: "SW21", systemTo: "SW1",
          location: "Specialist partitions, dry room",
          createdAt: now + 60_000,
        },
        {
          id: "seed-f-3", type: "removed",
          system: "MF ceiling",
          location: "Lounge 3",
          note: "Ceiling omitted entirely in P18",
          createdAt: now + 120_000,
        },
      ],
    };
  }
  return empty;
}

function read(pid: string, revId: string): QsReview {
  if (typeof window === "undefined") return seedFor(pid, revId);
  try {
    const raw = localStorage.getItem(KEY(pid, revId));
    if (!raw) return seedFor(pid, revId);
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.findings)) return parsed as QsReview;
    return seedFor(pid, revId);
  } catch { return seedFor(pid, revId); }
}

function write(pid: string, revId: string, r: QsReview) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid, revId), JSON.stringify(r));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { pid, revId } }));
}

function uid() { return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

export function useQsReview(pid: string, revId: string): QsReview {
  const [r, setR] = useState<QsReview>(() => read(pid, revId));
  useEffect(() => {
    setR(read(pid, revId));
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { pid?: string; revId?: string } | undefined;
      if (!d || (d.pid === pid && d.revId === revId)) setR(read(pid, revId));
    };
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", on);
    };
  }, [pid, revId]);
  return r;
}

export function addFinding(pid: string, revId: string, f: Omit<QsFinding, "id" | "createdAt">) {
  const r = read(pid, revId);
  const nf: QsFinding = { ...f, id: uid(), createdAt: Date.now() };
  write(pid, revId, { ...r, findings: [...r.findings, nf] });
  return nf;
}

export function updateFinding(pid: string, revId: string, id: string, patch: Partial<QsFinding>) {
  const r = read(pid, revId);
  write(pid, revId, {
    ...r,
    findings: r.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  });
}

export function removeFinding(pid: string, revId: string, id: string) {
  const r = read(pid, revId);
  write(pid, revId, { ...r, findings: r.findings.filter((f) => f.id !== id) });
}

export function markReviewedNoImpact(pid: string, revId: string, by: string) {
  const r = read(pid, revId);
  write(pid, revId, { ...r, status: "reviewed-no-impact", reviewedAt: Date.now(), reviewedBy: by, variationId: undefined });
}

export function markReviewedWithVariation(pid: string, revId: string, by: string, variationId: string) {
  const r = read(pid, revId);
  write(pid, revId, { ...r, status: "reviewed-variation", reviewedAt: Date.now(), reviewedBy: by, variationId });
}

export function reopenReview(pid: string, revId: string) {
  const r = read(pid, revId);
  write(pid, revId, { ...r, status: "open", reviewedAt: undefined, reviewedBy: undefined, variationId: undefined });
}

export function findingTypeMeta(t: FindingType) {
  return FINDING_TYPES.find((f) => f.value === t)!;
}