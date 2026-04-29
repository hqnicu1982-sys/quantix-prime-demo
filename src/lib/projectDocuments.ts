import { useEffect, useState } from "react";
import { MAX_FILE_BYTES, formatBytes, fileToDataUrl } from "@/lib/systemDetails";

// ============================================================================
// Per-project specification documents (drawings, NBS specs, fire reports…).
// localStorage-backed mock backend, mirrors systemDetails pattern.
// ============================================================================

export type ProjectDocTag =
  | "Architect"
  | "Spec"
  | "Performance"
  | "Fire"
  | "Acoustic"
  | "Reference"
  | "Other";

export const PROJECT_DOC_TAGS: { value: ProjectDocTag; tone: "info" | "neutral" | "danger" | "success" | "warning" }[] = [
  { value: "Architect",   tone: "info" },
  { value: "Spec",        tone: "info" },
  { value: "Performance", tone: "neutral" },
  { value: "Fire",        tone: "danger" },
  { value: "Acoustic",    tone: "neutral" },
  { value: "Reference",   tone: "neutral" },
  { value: "Other",       tone: "neutral" },
];

export type ProjectDoc = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  tag: ProjectDocTag;
  uploadedBy: string;
  uploadedAt: number;
  seed?: boolean; // true for the seed/demo entries (no real dataUrl, can't download)
};

export const MAX_PROJECT_DOCS = 50;
export { MAX_FILE_BYTES, formatBytes, fileToDataUrl };

const KEY = (projectId: string) => `qp-project-docs-${projectId}`;
const EVT = "qp-project-docs-change";

// Seed data (matches the previous static list shown on Specification page).
const SEED: Omit<ProjectDoc, "id" | "uploadedAt">[] = [
  { fileName: "Architectural drawings — Rev 4.1.pdf", fileSize: 12.4 * 1024 * 1024, mimeType: "application/pdf", dataUrl: "", tag: "Architect",   uploadedBy: "Architect team", seed: true },
  { fileName: "NBS Specification — Drylining.docx",   fileSize: 842 * 1024,         mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", dataUrl: "", tag: "Spec",        uploadedBy: "Spec consultant", seed: true },
  { fileName: "Acoustic performance schedule.xlsx",   fileSize: 186 * 1024,         mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       dataUrl: "", tag: "Performance", uploadedBy: "Acoustic engineer", seed: true },
  { fileName: "Fire strategy report v3.pdf",          fileSize: 3.1 * 1024 * 1024,  mimeType: "application/pdf", dataUrl: "", tag: "Fire",        uploadedBy: "Fire engineer", seed: true },
  { fileName: "Sample BG system extracts.pdf",        fileSize: 5.8 * 1024 * 1024,  mimeType: "application/pdf", dataUrl: "", tag: "Reference",   uploadedBy: "Spec library",  seed: true },
];

function seedDocs(): ProjectDoc[] {
  // Stable seed dates (descending), purely cosmetic.
  const baseDates = [
    Date.parse("2026-04-18"),
    Date.parse("2026-04-12"),
    Date.parse("2026-04-08"),
    Date.parse("2026-04-02"),
    Date.parse("2026-03-28"),
  ];
  return SEED.map((s, i) => ({ ...s, id: `seed-${i}`, uploadedAt: baseDates[i] }));
}

function read(projectId: string): ProjectDoc[] {
  if (typeof window === "undefined") return seedDocs();
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return seedDocs();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedDocs();
  } catch {
    return seedDocs();
  }
}

function write(projectId: string, docs: ProjectDoc[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(docs));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

function uid() {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getProjectDocs(projectId: string): ProjectDoc[] {
  return read(projectId);
}

export type AddProjectDocResult =
  | { ok: true; doc: ProjectDoc }
  | { ok: false; error: "too-large" | "limit-reached" };

export function addProjectDoc(
  projectId: string,
  input: Omit<ProjectDoc, "id" | "uploadedAt" | "seed">,
): AddProjectDocResult {
  if (input.fileSize > MAX_FILE_BYTES) return { ok: false, error: "too-large" };
  const docs = read(projectId);
  if (docs.length >= MAX_PROJECT_DOCS) return { ok: false, error: "limit-reached" };
  const doc: ProjectDoc = { ...input, id: uid(), uploadedAt: Date.now() };
  write(projectId, [doc, ...docs]);
  return { ok: true, doc };
}

export function removeProjectDoc(projectId: string, docId: string) {
  const docs = read(projectId).filter((d) => d.id !== docId);
  write(projectId, docs);
}

export function useProjectDocs(projectId: string): ProjectDoc[] {
  const [docs, setDocs] = useState<ProjectDoc[]>(() => read(projectId));
  useEffect(() => {
    setDocs(read(projectId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) setDocs(read(projectId));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId]);
  return docs;
}

export function tagTone(tag: ProjectDocTag): "info" | "neutral" | "danger" | "success" | "warning" {
  return PROJECT_DOC_TAGS.find((t) => t.value === tag)?.tone ?? "neutral";
}