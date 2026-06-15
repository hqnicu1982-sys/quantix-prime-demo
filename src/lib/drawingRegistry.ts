import { useEffect, useState } from "react";
import { MAX_FILE_BYTES, formatBytes, fileToDataUrl } from "@/lib/systemDetails";

// ============================================================================
// Project drawings registry. Tracks revisions per drawing-number, with a
// tender baseline that can be locked (read-only) and an approval workflow for
// post-tender revisions. localStorage-backed mock backend.
// ============================================================================

export type DrawingDiscipline = "Architect" | "Structural" | "MEP" | "Fire" | "Other";
export const DRAWING_DISCIPLINES: DrawingDiscipline[] = [
  "Architect", "Structural", "MEP", "Fire", "Other",
];

export type DrawingRevisionStatus = "pending" | "current" | "superseded" | "rejected";

export type DrawingRevision = {
  id: string;
  drawingNumber: string;
  revisionCode: string;
  isTender: boolean;
  status: DrawingRevisionStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;            // empty for seed entries (sample, no download)
  title?: string;
  discipline: DrawingDiscipline;
  changeNotes?: string;
  affectedAreas?: string[];
  uploadedBy: string;
  uploadedAt: number;
  approvedBy?: string;
  approvedAt?: number;
  rejectedBy?: string;
  rejectedAt?: number;
  rejectedReason?: string;
  seed?: boolean;
};

export type DrawingsState = {
  tenderLocked: boolean;
  tenderIssuedAt?: number;
  tenderIssuedBy?: string;
  revisions: DrawingRevision[];
};

export const MAX_REVISIONS_PER_PROJECT = 200;
export const DRAWING_NUMBER_REGEX = /^[A-Z]{1,3}-\d{2,4}[A-Z]?$/;
export { MAX_FILE_BYTES, formatBytes, fileToDataUrl };

const KEY = (projectId: string) => `qp-drawings-${projectId}`;
const EVT = "qp-drawings-change";

// --- Seed: only project "camden" gets a populated set so demo shows lock + approval flow.
function seedFor(projectId: string): DrawingsState {
  if (projectId !== "camden") return { tenderLocked: false, revisions: [] };
  const t = Date.parse("2026-04-18");
  const mk = (i: number, dn: string, rev: string, title: string, discipline: DrawingDiscipline, isTender: boolean, status: DrawingRevisionStatus, extra: Partial<DrawingRevision> = {}): DrawingRevision => ({
    id: `seed-${i}`,
    drawingNumber: dn,
    revisionCode: rev,
    isTender,
    status,
    fileName: `${dn}-${rev}.pdf`,
    fileSize: 1_200_000 + i * 31_000,
    mimeType: "application/pdf",
    dataUrl: "",
    title,
    discipline,
    uploadedBy: "Architect team",
    uploadedAt: t - i * 86_400_000,
    seed: true,
    ...(isTender ? { approvedBy: "Sarah Klein", approvedAt: t } : {}),
    ...extra,
  });
  return {
    tenderLocked: true,
    tenderIssuedAt: t,
    tenderIssuedBy: "Sarah Klein",
    revisions: [
      mk(1, "A-100", "T1", "Site plan",            "Architect",  true,  "current"),
      mk(2, "A-201", "T1", "Level 04 GA",          "Architect",  true,  "superseded"),
      mk(3, "A-202", "T1", "Level 05 GA",          "Architect",  true,  "current"),
      mk(4, "A-203", "T1", "Level 06 GA",          "Architect",  true,  "current"),
      mk(5, "A-410", "T1", "Bedroom typical",      "Architect",  true,  "current"),
      mk(6, "S-101", "T1", "Foundation layout",    "Structural", true,  "current"),
      mk(7, "M-110", "T1", "MEP riser zones",      "MEP",        true,  "superseded"),
      mk(8, "F-001", "T1", "Fire strategy plan",   "Fire",       true,  "current"),
      // post-tender revisions
      mk(9, "A-201", "C1", "Level 04 GA",          "Architect",  false, "pending", {
        uploadedBy: "Marco Reyes",
        uploadedAt: Date.parse("2026-06-02"),
        changeNotes: "Bedroom layout revised on rooms 4.12–4.18 — partition realigned 200mm into corridor.",
        affectedAreas: ["L4 corridor", "Bedrooms 4.12–4.18"],
      }),
      mk(10, "M-110", "C2", "MEP riser zones",     "MEP",        false, "pending", {
        uploadedBy: "Priya Shah",
        uploadedAt: Date.parse("2026-06-08"),
        changeNotes: "Riser shaft size increased — shaft wall spec may need uplift to 120 min fire rating.",
        affectedAreas: ["Lift & service shafts"],
      }),
    ],
  };
}

function read(projectId: string): DrawingsState {
  if (typeof window === "undefined") return seedFor(projectId);
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return seedFor(projectId);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.revisions)) {
      return parsed as DrawingsState;
    }
    return seedFor(projectId);
  } catch {
    return seedFor(projectId);
  }
}

function write(projectId: string, state: DrawingsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

function uid() {
  return `dr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ----- Reads ---------------------------------------------------------------

export function getDrawings(projectId: string): DrawingsState {
  return read(projectId);
}

export function useDrawings(projectId: string): DrawingsState {
  const [state, setState] = useState<DrawingsState>(() => read(projectId));
  useEffect(() => {
    setState(read(projectId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) setState(read(projectId));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId]);
  return state;
}

export type DrawingGroup = {
  drawingNumber: string;
  title?: string;
  discipline: DrawingDiscipline;
  current?: DrawingRevision;
  tender?: DrawingRevision;
  pendingCount: number;
  history: DrawingRevision[]; // all revisions, newest first
};

export function groupByDrawing(state: DrawingsState): DrawingGroup[] {
  const map = new Map<string, DrawingRevision[]>();
  for (const r of state.revisions) {
    if (!map.has(r.drawingNumber)) map.set(r.drawingNumber, []);
    map.get(r.drawingNumber)!.push(r);
  }
  const groups: DrawingGroup[] = [];
  for (const [drawingNumber, revs] of map.entries()) {
    const sorted = [...revs].sort((a, b) => b.uploadedAt - a.uploadedAt);
    const current = sorted.find((r) => r.status === "current");
    const tender  = sorted.find((r) => r.isTender);
    const meta    = current ?? tender ?? sorted[0];
    groups.push({
      drawingNumber,
      title: meta?.title,
      discipline: meta?.discipline ?? "Other",
      current,
      tender,
      pendingCount: sorted.filter((r) => r.status === "pending").length,
      history: sorted,
    });
  }
  return groups.sort((a, b) => a.drawingNumber.localeCompare(b.drawingNumber));
}

// ----- Mutations -----------------------------------------------------------

export type AddRevisionInput = {
  drawingNumber: string;
  revisionCode: string;
  isTender: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  title?: string;
  discipline: DrawingDiscipline;
  changeNotes?: string;
  affectedAreas?: string[];
  uploadedBy: string;
};

export type AddRevisionResult =
  | { ok: true; revision: DrawingRevision }
  | { ok: false; error: "too-large" | "limit-reached" | "tender-locked" | "invalid-number" | "duplicate-revision" | "post-tender-needs-notes" };

export function addRevision(projectId: string, input: AddRevisionInput): AddRevisionResult {
  if (!DRAWING_NUMBER_REGEX.test(input.drawingNumber)) return { ok: false, error: "invalid-number" };
  if (input.fileSize > MAX_FILE_BYTES) return { ok: false, error: "too-large" };

  const state = read(projectId);
  if (state.revisions.length >= MAX_REVISIONS_PER_PROJECT) return { ok: false, error: "limit-reached" };
  if (state.tenderLocked && input.isTender) return { ok: false, error: "tender-locked" };
  if (state.tenderLocked && !input.changeNotes?.trim()) return { ok: false, error: "post-tender-needs-notes" };

  // Duplicate guard: same drawing+revisionCode (case-insensitive)
  const dupe = state.revisions.find(
    (r) => r.drawingNumber === input.drawingNumber &&
           r.revisionCode.toUpperCase() === input.revisionCode.toUpperCase(),
  );
  if (dupe) return { ok: false, error: "duplicate-revision" };

  const goesPending = state.tenderLocked && !input.isTender;
  const rev: DrawingRevision = {
    id: uid(),
    drawingNumber: input.drawingNumber,
    revisionCode: input.revisionCode.toUpperCase(),
    isTender: input.isTender,
    status: goesPending ? "pending" : "current",
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    dataUrl: input.dataUrl,
    title: input.title,
    discipline: input.discipline,
    changeNotes: input.changeNotes,
    affectedAreas: input.affectedAreas,
    uploadedBy: input.uploadedBy,
    uploadedAt: Date.now(),
  };

  let next = [rev, ...state.revisions];
  // If new rev is current, supersede any previous current for the same drawing.
  if (rev.status === "current") {
    next = next.map((r) =>
      r.id !== rev.id && r.drawingNumber === rev.drawingNumber && r.status === "current"
        ? { ...r, status: "superseded" }
        : r,
    );
  }
  write(projectId, { ...state, revisions: next });
  return { ok: true, revision: rev };
}

export function approveRevision(projectId: string, revId: string, approver: string) {
  const state = read(projectId);
  const target = state.revisions.find((r) => r.id === revId);
  if (!target || target.status !== "pending") return;
  const next = state.revisions.map((r) => {
    if (r.id === revId) {
      return { ...r, status: "current" as const, approvedBy: approver, approvedAt: Date.now() };
    }
    if (r.drawingNumber === target.drawingNumber && r.status === "current") {
      return { ...r, status: "superseded" as const };
    }
    return r;
  });
  write(projectId, { ...state, revisions: next });
}

export function rejectRevision(projectId: string, revId: string, rejector: string, reason: string) {
  const state = read(projectId);
  const next = state.revisions.map((r) =>
    r.id === revId && r.status === "pending"
      ? { ...r, status: "rejected" as const, rejectedBy: rejector, rejectedAt: Date.now(), rejectedReason: reason }
      : r,
  );
  write(projectId, { ...state, revisions: next });
}

export type RemoveRevisionResult = { ok: true } | { ok: false; error: "tender-locked" };

export function removeRevision(projectId: string, revId: string): RemoveRevisionResult {
  const state = read(projectId);
  const target = state.revisions.find((r) => r.id === revId);
  if (!target) return { ok: true };
  // Cannot remove a tender revision after tender is locked.
  if (state.tenderLocked && target.isTender) return { ok: false, error: "tender-locked" };
  const next = state.revisions.filter((r) => r.id !== revId);
  write(projectId, { ...state, revisions: next });
  return { ok: true };
}

export type IssueTenderResult = { ok: true } | { ok: false; error: "already-locked" | "no-tender-revisions" };

export function issueTenderSet(projectId: string, issuer: string): IssueTenderResult {
  const state = read(projectId);
  if (state.tenderLocked) return { ok: false, error: "already-locked" };
  const tenderRevs = state.revisions.filter((r) => r.isTender);
  if (tenderRevs.length === 0) return { ok: false, error: "no-tender-revisions" };
  const now = Date.now();
  write(projectId, {
    ...state,
    tenderLocked: true,
    tenderIssuedAt: now,
    tenderIssuedBy: issuer,
    revisions: state.revisions.map((r) =>
      r.isTender && !r.approvedBy ? { ...r, approvedBy: issuer, approvedAt: now } : r,
    ),
  });
  return { ok: true };
}

// ----- Utilities -----------------------------------------------------------

export function statusTone(status: DrawingRevisionStatus): "info" | "neutral" | "danger" | "success" | "warning" {
  switch (status) {
    case "current":   return "success";
    case "pending":   return "warning";
    case "rejected":  return "danger";
    case "superseded":return "neutral";
  }
}

export function isPreviewable(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}

// Reset helper (used by tests).
export function __resetForTests(projectId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY(projectId));
}