import { useSyncExternalStore } from "react";
import { currentUser } from "./mockData";

// ============================================================================
// Integration connection registry — persists Connect / Sync / Disconnect /
// Settings decisions in localStorage so the Integrations page reflects the
// user's actual setup, not the mock seed.
// ============================================================================

export type SyncFrequency = "manual" | "15m" | "hourly" | "daily";

export type IntegrationConnection = {
  id: string;                  // matches integrations[].id
  connectedAt: string;         // ISO
  connectedBy: string;
  account: string;             // e.g. workspace name or email
  apiKey: string;              // mock masked key
  scope: string;               // free-text scope description
  frequency: SyncFrequency;
  notifyOnError: boolean;
  lastSync?: string;           // ISO
  syncs: number;               // counter
  errors: number;
  lastPush?: string;           // ISO — last outbound write back to the system
  pushes?: number;             // outbound counter (bidirectional sync)
};

const KEY = "qp-integration-connections";
const EVT = "qp-integration-connections-change";

function read(): IntegrationConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IntegrationConnection[]) : [];
  } catch {
    return [];
  }
}

function write(rows: IntegrationConnection[]) {
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

let _snap: IntegrationConnection[] = read();
function snapshot(): IntegrationConnection[] {
  const fresh = read();
  if (fresh.length !== _snap.length || JSON.stringify(fresh) !== JSON.stringify(_snap)) {
    _snap = fresh;
  }
  return _snap;
}

export function useIntegrationConnections(): IntegrationConnection[] {
  return useSyncExternalStore(subscribe, () => snapshot(), () => snapshot());
}

export function useIntegrationConnection(id: string): IntegrationConnection | undefined {
  return useIntegrationConnections().find((c) => c.id === id);
}

export function connectIntegration(input: Omit<IntegrationConnection, "connectedAt" | "connectedBy" | "syncs" | "errors" | "lastSync">) {
  const all = read().filter((c) => c.id !== input.id);
  const next: IntegrationConnection = {
    ...input,
    connectedAt: new Date().toISOString(),
    connectedBy: currentUser.name,
    syncs: 0,
    errors: 0,
  };
  write([next, ...all]);
  return next;
}

export function syncIntegration(id: string) {
  const all = read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], lastSync: new Date().toISOString(), syncs: all[idx].syncs + 1 };
  write(all);
}

/**
 * Stamp an outbound (push) operation. Used by bidirectional sync flows that
 * write local changes back to the connected system (e.g. MSProject).
 */
export function recordIntegrationPush(id: string) {
  const all = read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    lastPush: new Date().toISOString(),
    pushes: (all[idx].pushes ?? 0) + 1,
  };
  write(all);
}

export function updateIntegrationSettings(id: string, patch: Partial<Pick<IntegrationConnection, "frequency" | "notifyOnError" | "scope" | "account">>) {
  const all = read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  write(all);
}

export function disconnectIntegration(id: string) {
  write(read().filter((c) => c.id !== id));
}

export const SYNC_FREQUENCIES: { code: SyncFrequency; label: string }[] = [
  { code: "manual",  label: "Manual only" },
  { code: "15m",     label: "Every 15 minutes" },
  { code: "hourly",  label: "Every hour" },
  { code: "daily",   label: "Daily at 06:00" },
];

export function formatRelative(iso?: string): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
