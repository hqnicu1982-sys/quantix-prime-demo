import { useEffect, useState } from "react";
import { deliveries as mockDeliveries } from "./callOffWorkflow";
import { invoices as mockInvoices } from "./mockData";
import { matchLines } from "./invoiceWorkflow";

// ============================================================================
// GRN Registry — persistent ledger of Goods Received Notes.
// Single source of truth for both the deliveries list and the GRN detail
// page. Seeds from mock deliveries + mock invoices so legacy URLs
// (`/grn/CCF-10821`) still resolve, and accepts new entries written by
// LogGrnDialog against live call-offs (`co-...`).
// localStorage-backed (mock).
// ============================================================================

export type GrnStatus = "scheduled" | "in-transit" | "partial" | "received";

export type GrnLine = {
  material: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
};

export type GrnRecord = {
  id: string;               // canonical id, e.g. "GRN-CO-247" or "GRN-co-abc123"
  callOffRef: string;       // the call-off this delivery serves
  projectId?: string;       // present for user-logged GRNs on a live project
  supplier: string;
  status: GrnStatus;
  qty: string;              // human-readable summary, e.g. "1,200 m² boards"
  eta?: string;             // free-text ETA when not yet received
  signedBy?: string;
  signedAt?: string;        // ISO or human date string for seeds
  partial?: boolean;
  note?: string;
  lines?: GrnLine[];        // line-level GRN detail when available
  sourceInvoiceId?: string; // seeded GRNs derived from an invoice
  createdAt: number;
  // Full sign-off form additions (optional — legacy seeds remain valid).
  signature?: string;       // data URL captured from SignaturePad
  photos?: string[];        // data URLs from PhotoDropzone
  deliveryNoteRef?: string; // supplier's delivery note reference
  driverName?: string;
};

const KEY = "qp-grn-registry";
const SEED_KEY = "qp-grn-registry-seeded-v1";
const EVT = "qp-grn-registry-change";

function read(): GrnRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as GrnRecord[]) : [];
  } catch {
    return [];
  }
}

function write(list: GrnRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function uid(callOffRef: string) {
  return `GRN-${callOffRef}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;

  const seeds: GrnRecord[] = [];

  // From mock deliveries — preserves the call-off → delivery view.
  for (const d of mockDeliveries) {
    seeds.push({
      id: `GRN-${d.callOff}`,
      callOffRef: d.callOff,
      supplier: d.supplier,
      status: d.status,
      qty: d.qty,
      eta: d.eta,
      signedBy: d.grnBy,
      signedAt: d.status === "received" || d.status === "partial" ? d.eta : undefined,
      partial: d.status === "partial",
      createdAt: Date.now(),
    });
  }

  // From mock invoices — preserves legacy `/grn/<invoiceId>` deep links.
  for (const inv of mockInvoices) {
    const lines = (matchLines[inv.id] ?? []).map((l) => ({
      material: l.material,
      unit: l.unit,
      orderedQty: l.poQty,
      receivedQty: l.grnQty,
    }));
    const partial = lines.some((l) => l.receivedQty !== l.orderedQty);
    seeds.push({
      id: `GRN-${inv.id}`,
      callOffRef: inv.callOffRef,
      supplier: inv.supplier,
      status: partial ? "partial" : "received",
      qty: lines.map((l) => `${l.receivedQty} ${l.unit}`).join(" · ") || inv.lineDetail,
      signedBy: inv.supplier === "Minster" ? "Tom B (foreman)" : "Sarah M (site QS)",
      signedAt: inv.received,
      partial,
      lines,
      sourceInvoiceId: inv.id,
      createdAt: Date.now(),
    });
  }

  write(seeds);
  localStorage.setItem(SEED_KEY, "1");
}

// ---------- queries ----------

export function getGrns(filter?: { projectId?: string; callOffRef?: string }): GrnRecord[] {
  ensureSeed();
  let list = read();
  if (filter?.projectId) list = list.filter((g) => g.projectId === filter.projectId);
  if (filter?.callOffRef) list = list.filter((g) => g.callOffRef === filter.callOffRef);
  return list;
}

/**
 * Resolve a GRN by any of the deep-link shapes used across the app:
 *   - canonical id ("GRN-CO-247-…")
 *   - bare call-off ref ("CO-247", "co-abc123")
 *   - "GRN-<callOffRef>" shortcut
 *   - source invoice id ("CCF-10821")
 */
export function findGrn(ref: string): GrnRecord | undefined {
  ensureSeed();
  const list = read();
  const stripped = ref.startsWith("GRN-") ? ref.slice(4) : ref;
  return (
    list.find((g) => g.id === ref) ??
    list.find((g) => g.id === `GRN-${stripped}`) ??
    list.find((g) => g.callOffRef === stripped) ??
    list.find((g) => g.sourceInvoiceId === stripped)
  );
}

// ---------- mutations ----------

export type LogGrnInput = {
  callOffRef: string;
  projectId?: string;
  supplier: string;
  qty: string;
  partial?: boolean;
  note?: string;
  signedBy: string;
  signedAt?: string;
  lines?: GrnLine[];
  signature?: string;
  photos?: string[];
  deliveryNoteRef?: string;
  driverName?: string;
};

export function logGrn(input: LogGrnInput): GrnRecord {
  ensureSeed();
  const list = read();
  const record: GrnRecord = {
    id: uid(input.callOffRef),
    callOffRef: input.callOffRef,
    projectId: input.projectId,
    supplier: input.supplier,
    status: input.partial ? "partial" : "received",
    qty: input.qty,
    signedBy: input.signedBy,
    signedAt: input.signedAt ?? new Date().toISOString(),
    partial: !!input.partial,
    note: input.note,
    lines: input.lines,
    createdAt: Date.now(),
    signature: input.signature,
    photos: input.photos,
    deliveryNoteRef: input.deliveryNoteRef,
    driverName: input.driverName,
  };
  write([record, ...list]);
  return record;
}

export function deleteGrn(id: string) {
  write(read().filter((g) => g.id !== id));
}

export function clearGrnRegistry() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(SEED_KEY);
  window.dispatchEvent(new Event(EVT));
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

export function useGrns(filter?: { projectId?: string; callOffRef?: string }) {
  return useStore(() => getGrns(filter));
}

export function useGrn(ref: string | undefined) {
  return useStore(() => (ref ? findGrn(ref) : undefined));
}
