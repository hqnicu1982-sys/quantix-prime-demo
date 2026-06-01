import { useSyncExternalStore } from "react";

// ============================================================================
// Focus snooze registry — defers a dashboard focus action until a given time,
// optionally recording a rescheduled delivery date. Persisted in localStorage
// so the snooze survives a refresh and the action reappears on its own.
// ============================================================================

export type FocusSnooze = {
  id: string;            // focus action id (stringified)
  snoozedUntil: string;  // ISO timestamp
  newDeliveryDate?: string; // YYYY-MM-DD, optional reschedule
  reason?: string;
  ts: string;            // when the snooze was set
};

const KEY = "qp-focus-snooze";
const EVT = "qp-focus-snooze-change";

function read(): FocusSnooze[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FocusSnooze[]) : [];
  } catch {
    return [];
  }
}

function write(rows: FocusSnooze[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  // tick once a minute so expired snoozes drop off without a manual refresh
  const tick = window.setInterval(h, 60_000);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
    window.clearInterval(tick);
  };
}

let _snap: FocusSnooze[] = read();
function snapshot(): FocusSnooze[] {
  const fresh = read();
  if (
    fresh.length !== _snap.length ||
    fresh.some((r, i) => r.id !== _snap[i]?.id || r.snoozedUntil !== _snap[i]?.snoozedUntil)
  ) {
    _snap = fresh;
  }
  return _snap;
}

export function useFocusSnoozes(): FocusSnooze[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function activeSnooze(id: string, all?: FocusSnooze[]): FocusSnooze | undefined {
  const rows = all ?? read();
  const hit = rows.find((r) => r.id === id);
  if (!hit) return undefined;
  return new Date(hit.snoozedUntil).getTime() > Date.now() ? hit : undefined;
}

export function recordSnooze(input: Omit<FocusSnooze, "ts">) {
  const rows = read().filter((r) => r.id !== input.id);
  write([{ ...input, ts: new Date().toISOString() }, ...rows]);
}

export function clearSnooze(id: string) {
  write(read().filter((r) => r.id !== id));
}

/** Snooze preset durations, expressed as offsets from "now". */
export const SNOOZE_PRESETS: { code: string; label: string; minutes: number }[] = [
  { code: "1h",  label: "1 hour",            minutes: 60 },
  { code: "4h",  label: "4 hours",           minutes: 240 },
  { code: "tom", label: "Tomorrow 07:00",    minutes: -1 }, // computed
  { code: "48h", label: "2 days",            minutes: 2880 },
];

export function resolvePreset(code: string): Date {
  const now = new Date();
  if (code === "tom") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(7, 0, 0, 0);
    return d;
  }
  const p = SNOOZE_PRESETS.find((x) => x.code === code);
  const mins = p?.minutes ?? 60;
  return new Date(now.getTime() + mins * 60_000);
}

export function formatSnoozeRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}