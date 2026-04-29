import { useEffect, useState } from "react";

// ============================================================================
// Per-project, per-system documentation & attachments.
// localStorage-backed (mock backend), aligned with bespokeSystems / projectData.
// Keyed by `systemKey` (the display name used in fitzroviaSystems / similar).
// ============================================================================

export type AttachmentCategory =
  | "datasheet"
  | "certificate"
  | "drawing"
  | "test-report"
  | "photo"
  | "other";

export const ATTACHMENT_CATEGORIES: { value: AttachmentCategory; label: string }[] = [
  { value: "datasheet",   label: "Datasheet" },
  { value: "certificate", label: "Certificate" },
  { value: "drawing",     label: "Drawing" },
  { value: "test-report", label: "Test report" },
  { value: "photo",       label: "Site photo" },
  { value: "other",       label: "Other" },
];

export type SystemAttachment = {
  id: string;
  fileName: string;
  fileSize: number;     // bytes
  mimeType: string;
  dataUrl: string;      // base64 data URL
  category: AttachmentCategory;
  uploadedBy: string;
  uploadedAt: number;
  notes?: string;
};

export type SystemDetails = {
  systemKey: string;
  description?: string;
  installerNotes?: string;
  attachments: SystemAttachment[];
};

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ATTACHMENTS = 20;

const KEY = (projectId: string) => `qp-system-details-${projectId}`;
const EVT = "qp-system-details-change";

type Store = Record<string, SystemDetails>;

function read(projectId: string): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function write(projectId: string, store: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(projectId), JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId } }));
}

function uid() {
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function ensure(store: Store, systemKey: string): SystemDetails {
  return store[systemKey] ?? { systemKey, attachments: [] };
}

// ----- Reads ---------------------------------------------------------------

export function getSystemDetails(projectId: string, systemKey: string): SystemDetails {
  return ensure(read(projectId), systemKey);
}

export function getAllSystemDetails(projectId: string): Store {
  return read(projectId);
}

// ----- Mutations -----------------------------------------------------------

export function updateNotes(
  projectId: string,
  systemKey: string,
  patch: { description?: string; installerNotes?: string },
) {
  const store = read(projectId);
  const current = ensure(store, systemKey);
  store[systemKey] = { ...current, ...patch };
  write(projectId, store);
}

export type AddAttachmentInput = Omit<SystemAttachment, "id" | "uploadedAt">;

export type AddAttachmentResult =
  | { ok: true; attachment: SystemAttachment }
  | { ok: false; error: "too-large" | "limit-reached" };

export function addAttachment(
  projectId: string,
  systemKey: string,
  input: AddAttachmentInput,
): AddAttachmentResult {
  if (input.fileSize > MAX_FILE_BYTES) return { ok: false, error: "too-large" };
  const store = read(projectId);
  const current = ensure(store, systemKey);
  if (current.attachments.length >= MAX_ATTACHMENTS) return { ok: false, error: "limit-reached" };
  const att: SystemAttachment = { ...input, id: uid(), uploadedAt: Date.now() };
  store[systemKey] = { ...current, attachments: [att, ...current.attachments] };
  write(projectId, store);
  return { ok: true, attachment: att };
}

export function removeAttachment(projectId: string, systemKey: string, attachmentId: string) {
  const store = read(projectId);
  const current = ensure(store, systemKey);
  store[systemKey] = {
    ...current,
    attachments: current.attachments.filter((a) => a.id !== attachmentId),
  };
  write(projectId, store);
}

// ----- Hooks ---------------------------------------------------------------

export function useSystemDetails(projectId: string, systemKey: string): SystemDetails {
  const [data, setData] = useState<SystemDetails>(() => getSystemDetails(projectId, systemKey));
  useEffect(() => {
    setData(getSystemDetails(projectId, systemKey));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) {
        setData(getSystemDetails(projectId, systemKey));
      }
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId, systemKey]);
  return data;
}

export function useAllSystemDetails(projectId: string): Store {
  const [store, setStore] = useState<Store>(() => read(projectId));
  useEffect(() => {
    setStore(read(projectId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === projectId) setStore(read(projectId));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [projectId]);
  return store;
}

// ----- Utilities -----------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}