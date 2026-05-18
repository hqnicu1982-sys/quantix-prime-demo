import type { CallOffState } from "./mockData";

export type CallOffStep = {
  id: CallOffState | "delivered";
  label: string;
  description: string;
  actor: string;
  capability: string;
};

/**
 * Canonical 7-step call-off lifecycle. Mirrors `callOffStateMachine` in
 * mockData but adds copy that explains *who* does the action and *what*
 * happens next — used in every workflow strip across the module.
 */
export const CALL_OFF_STEPS: CallOffStep[] = [
  {
    id: "draft",
    label: "Draft",
    description: "Site Manager builds the request against a BoQ line and selected supplier.",
    actor: "Site Manager",
    capability: "create.calloffs",
  },
  {
    id: "submitted",
    label: "Submitted",
    description: "Request locked and sent to Commercial for governance review.",
    actor: "Site Manager",
    capability: "create.calloffs",
  },
  {
    id: "reviewed",
    label: "QS reviewed",
    description: "QS checks price, BoQ allocation, and contract risk.",
    actor: "Commercial QS",
    capability: "approve.calloffs",
  },
  {
    id: "approved",
    label: "Approved",
    description: "Approved against rev. of BoQ — PO is queued.",
    actor: "Commercial QS",
    capability: "approve.calloffs",
  },
  {
    id: "po-sent",
    label: "PO sent",
    description: "Purchase order fired to supplier; supplier confirms ETA.",
    actor: "System / Buyer",
    capability: "approve.calloffs",
  },
  {
    id: "in-delivery",
    label: "In delivery",
    description: "Goods inbound — site logs partial / full delivery on GRN.",
    actor: "Site team",
    capability: "create.calloffs",
  },
  {
    id: "closed",
    label: "Closed",
    description: "GRN reconciled with invoice, value locked into actuals.",
    actor: "Commercial QS",
    capability: "approve.calloffs",
  },
];

export const STATE_LABEL: Record<CallOffState, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "QS reviewed",
  approved: "Approved",
  "po-sent": "PO sent",
  "in-delivery": "In delivery",
  closed: "Closed",
  "review-needed": "Needs QS review",
};

export const STATE_TONE: Record<
  CallOffState,
  "success" | "info" | "warning" | "neutral"
> = {
  draft: "neutral",
  submitted: "info",
  reviewed: "info",
  approved: "success",
  "po-sent": "info",
  "in-delivery": "info",
  closed: "neutral",
  "review-needed": "warning",
};

/** Index of a state within the canonical 7-step pipeline. */
export function stepIndex(state: CallOffState): number {
  if (state === "review-needed") return 2; // sits at QS review
  const idx = CALL_OFF_STEPS.findIndex((s) => s.id === state);
  return idx === -1 ? 0 : idx;
}

/** Audit log entries shared by the audit page + detail timeline. */
export type AuditEvent = {
  ts: string;
  ref: string;
  actor: string;
  action: string;
  detail: string;
};

export const auditLog: AuditEvent[] = [
  { ts: "today 09:14", ref: "CO-247", actor: "Sarah M", action: "Approved",        detail: "Approved against BoQ rev 3.2 line 14 — £7,252 committed" },
  { ts: "today 09:02", ref: "CO-247", actor: "Sarah M", action: "Price-checked",   detail: "Variance −2.1% vs framework, within tolerance" },
  { ts: "yest 16:48",  ref: "CO-246", actor: "System",  action: "Flagged review",  detail: "Acoustic infill — quantity exceeds remaining BoQ allocation by 12%" },
  { ts: "yest 14:28",  ref: "CO-245", actor: "Sarah M", action: "Reviewed",        detail: "QS sign-off, forwarded for approval" },
  { ts: "yest 11:02",  ref: "CO-247", actor: "Nick A",  action: "Submitted",       detail: "Submitted from Daily Site Report → Materials" },
  { ts: "yest 09:14",  ref: "CO-247", actor: "Nick A",  action: "Draft created",   detail: "Auto-linked to BoQ rev 3.2 · supplier Minster (framework)" },
  { ts: "2d 13:10",    ref: "CO-243", actor: "System",  action: "PO sent",         detail: "PO-882431 → CCF · ETA 26 Apr" },
  { ts: "2d 10:00",    ref: "CO-243", actor: "Sarah M", action: "Approved",        detail: "MF ceiling kit · L2 grid" },
];

/** Mock deliveries / GRN entries. */
export type Delivery = {
  ref: string;
  callOff: string;
  supplier: string;
  eta: string;
  status: "scheduled" | "in-transit" | "partial" | "received";
  qty: string;
  grnBy?: string;
};

export const deliveries: Delivery[] = [
  { ref: "DEL-9921", callOff: "CO-247", supplier: "Minster", eta: "24 Apr · AM",  status: "scheduled",  qty: "1,850 m² boards" },
  { ref: "DEL-9920", callOff: "CO-245", supplier: "CCF",     eta: "21 Apr · PM",  status: "partial",    qty: "820 / 1,200 m studs", grnBy: "PW · partial GRN" },
  { ref: "DEL-9919", callOff: "CO-243", supplier: "CCF",     eta: "26 Apr",       status: "in-transit", qty: "420 m² MF kit" },
  { ts: "", ref: "DEL-9918", callOff: "CO-241", supplier: "Minster", eta: "19 Apr", status: "received", qty: "180 boards", grnBy: "PW · 19 Apr 11:20" } as unknown as Delivery,
];