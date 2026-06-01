import { useEffect, useState } from "react";

// ============================================================================
// Per-project settings for the auto call-off generator. Rules the user can
// tune from the banner's gear button. Drafts only — `acceptProposals` still
// requires explicit confirmation in the review dialog.
// ============================================================================

export type CallOffSettings = {
  /** Lead time used when a BoQ line has none of its own. */
  defaultLeadDays: number;
  /** Extra safety margin added on top of lead time when computing `sendBy`. */
  bufferDays: number;
  /** Needs to the same supplier within this many days are batched together. */
  coalesceWindowDays: number;
  /** sendBy ≤ today+N → "imminent" urgency badge. */
  urgencyImminentDays: number;
  /**
   * Reorder point: skip proposals whose summed qty stays below this many units.
   * 0 disables the filter. Applied per proposal, not per line.
   */
  minBatchQty: number;
  /** Per-material lead time overrides, keyed by exact material name. */
  perMaterialLeadDays: Record<string, number>;
};

export const DEFAULT_SETTINGS: CallOffSettings = {
  defaultLeadDays: 5,
  bufferDays: 2,
  coalesceWindowDays: 5,
  urgencyImminentDays: 3,
  minBatchQty: 0,
  perMaterialLeadDays: {},
};

const KEY = (pid: string) => `qp-calloff-settings-${pid}`;
const EVT = "qp-calloff-settings-change";

function read(pid: string): CallOffSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY(pid));
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function write(pid: string, s: CallOffSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid), JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

export function getCallOffSettings(pid: string): CallOffSettings {
  return read(pid);
}

export function saveCallOffSettings(pid: string, s: CallOffSettings) {
  write(pid, s);
}

export function resetCallOffSettings(pid: string) {
  write(pid, DEFAULT_SETTINGS);
}

export function useCallOffSettings(pid: string): CallOffSettings {
  const [s, setS] = useState<CallOffSettings>(() => read(pid));
  useEffect(() => {
    setS(read(pid));
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!d || d.projectId === pid) setS(read(pid));
    };
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", on);
    };
  }, [pid]);
  return s;
}