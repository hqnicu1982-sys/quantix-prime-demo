import { useSyncExternalStore } from "react";
import { currentUser } from "./mockData";
import type { InvoiceStage } from "./invoiceWorkflow";

// ============================================================================
// Invoice action registry — persists QS decisions (accept variance, dispute,
// request credit note, approve, schedule, mark paid) and turns them into
// audit events + an effective workflow stage override.
// ============================================================================

export type InvoiceActionKind =
  | "accept-variance"
  | "dispute"
  | "request-credit"
  | "approve"
  | "schedule"
  | "pay"
  | "chase"
  | "resolve-dispute";

export type InvoiceAction = {
  id: string;
  ref: string;          // invoice id
  kind: InvoiceActionKind;
  ts: string;           // ISO
  actor: string;
  reasonCode?: string;
  reason?: string;
  note?: string;
  amount?: number;
  creditAmount?: number;
  paymentBatch?: string;
  payDate?: string;
  stageAfter: InvoiceStage;
};

const KEY = "qp-invoice-actions";
const EVT = "qp-invoice-actions-change";

function read(): InvoiceAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InvoiceAction[]) : [];
  } catch {
    return [];
  }
}

function write(rows: InvoiceAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
  };
}

export function useInvoiceActions(ref?: string): InvoiceAction[] {
  const all = useSyncExternalStore(subscribe, () => snapshot(), () => snapshot());
  return ref ? all.filter((a) => a.ref === ref) : all;
}

let _snap: InvoiceAction[] = read();
function snapshot(): InvoiceAction[] {
  const fresh = read();
  if (fresh.length !== _snap.length || fresh[0]?.id !== _snap[0]?.id) {
    _snap = fresh;
  }
  return _snap;
}

export function recordInvoiceAction(input: Omit<InvoiceAction, "id" | "ts" | "actor">) {
  const all = read();
  const next: InvoiceAction = {
    ...input,
    id: `${input.ref}-${input.kind}-${Date.now()}`,
    ts: new Date().toISOString(),
    actor: currentUser.name,
  };
  write([next, ...all]);
  return next;
}

export function latestAction(ref: string, all?: InvoiceAction[]): InvoiceAction | undefined {
  return (all ?? read()).find((a) => a.ref === ref);
}

/** Compose effective workflow stage given recorded actions. */
export function effectiveStage(ref: string, fallback: InvoiceStage, all?: InvoiceAction[]): InvoiceStage {
  const a = latestAction(ref, all);
  return a?.stageAfter ?? fallback;
}

export const VARIANCE_REASONS: { code: string; label: string }[] = [
  { code: "framework-rate", label: "Framework rate not applied" },
  { code: "currency-rounding", label: "Currency / VAT rounding" },
  { code: "freight", label: "Freight or delivery surcharge agreed" },
  { code: "tolerance", label: "Within commercial tolerance" },
  { code: "other", label: "Other (specify)" },
];

export const DISPUTE_REASONS: { code: string; label: string }[] = [
  { code: "over-delivery", label: "Over-delivery — qty invoiced > GRN" },
  { code: "wrong-rate", label: "Wrong rate vs PO" },
  { code: "duplicate", label: "Duplicate invoice" },
  { code: "not-received", label: "Goods not received" },
  { code: "wrong-spec", label: "Wrong material / spec" },
  { code: "other", label: "Other (specify)" },
];

export const CREDIT_REASONS: { code: string; label: string }[] = [
  { code: "rate-correction", label: "Rate correction" },
  { code: "qty-correction", label: "Qty correction" },
  { code: "rebate", label: "Contractual rebate" },
  { code: "damaged", label: "Damaged on arrival" },
  { code: "other", label: "Other (specify)" },
];

export const CHASE_CHANNELS: { code: string; label: string }[] = [
  { code: "email", label: "Email reminder" },
  { code: "phone", label: "Phone call logged" },
  { code: "portal", label: "Supplier portal message" },
];

export const RESOLVE_OUTCOMES: { code: string; label: string; stage: InvoiceStage }[] = [
  { code: "credit-received", label: "Credit note received & applied", stage: "approved" },
  { code: "reissued",        label: "Supplier re-issued invoice",     stage: "matched" },
  { code: "written-off",     label: "Written off internally",         stage: "approved" },
  { code: "withdrawn",       label: "Dispute withdrawn",              stage: "approved" },
];