import { useSyncExternalStore } from "react";
import { currentUser } from "./mockData";
import type { CallOffState } from "./mockData";

// ============================================================================
// Call-off action registry — persists Submit / Approve / Reject / Send PO /
// Log GRN decisions and turns them into audit events + an effective workflow
// state override. Mirrors invoiceActions.ts.
// ============================================================================

export type CallOffActionKind =
  | "submit"
  | "approve"
  | "reject"
  | "send-po"
  | "log-grn"
  | "close";

export type CallOffAction = {
  id: string;
  ref: string;
  kind: CallOffActionKind;
  ts: string;
  actor: string;
  reason?: string;
  note?: string;
  grnQty?: string;
  grnPartial?: boolean;
  poRef?: string;
  stateAfter: CallOffState;
};

const KEY = "qp-calloff-actions";
const EVT = "qp-calloff-actions-change";

function read(): CallOffAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CallOffAction[]) : [];
  } catch {
    return [];
  }
}

function write(rows: CallOffAction[]) {
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

let _snap: CallOffAction[] = read();
function snapshot(): CallOffAction[] {
  const fresh = read();
  if (fresh.length !== _snap.length || fresh[0]?.id !== _snap[0]?.id) {
    _snap = fresh;
  }
  return _snap;
}

export function useCallOffActions(ref?: string): CallOffAction[] {
  const all = useSyncExternalStore(subscribe, () => snapshot(), () => snapshot());
  return ref ? all.filter((a) => a.ref === ref) : all;
}

export function recordCallOffAction(input: Omit<CallOffAction, "id" | "ts" | "actor">) {
  const all = read();
  const next: CallOffAction = {
    ...input,
    id: `${input.ref}-${input.kind}-${Date.now()}`,
    ts: new Date().toISOString(),
    actor: currentUser.name,
  };
  write([next, ...all]);
  return next;
}

export function latestCallOffAction(ref: string, all?: CallOffAction[]): CallOffAction | undefined {
  return (all ?? read()).find((a) => a.ref === ref);
}

/** Compose effective workflow state given recorded actions. */
export function effectiveState(ref: string, fallback: CallOffState, all?: CallOffAction[]): CallOffState {
  const a = latestCallOffAction(ref, all);
  return a?.stateAfter ?? fallback;
}

export const KIND_LABEL: Record<CallOffActionKind, string> = {
  submit:    "Submitted for QS",
  approve:   "Approved",
  reject:    "Rejected",
  "send-po": "PO sent",
  "log-grn": "GRN logged",
  close:     "Closed",
};

export const REJECT_REASONS: { code: string; label: string }[] = [
  { code: "price",    label: "Price above framework" },
  { code: "boq",      label: "Outside BoQ allocation" },
  { code: "spec",     label: "Wrong material / spec" },
  { code: "supplier", label: "Use alternative supplier" },
  { code: "qty",      label: "Quantity needs review" },
  { code: "other",    label: "Other (specify)" },
];
