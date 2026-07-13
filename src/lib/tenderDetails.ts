import { useSyncExternalStore } from "react";
import { team, daysSince, type Project } from "./mockData";

/** Deterministic non-negative hash of a string (for stable pseudo-random picks). */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The three team members who could own a tender bid. */
const ESTIMATOR_POOL = team.filter((m) =>
  ["Estimator", "Commercial QS", "Managing Director"].includes(m.role),
);

export function getAssignedEstimator(p: Project) {
  const pool = ESTIMATOR_POOL.length ? ESTIMATOR_POOL : team.slice(0, 1);
  return pool[hash(p.id) % pool.length];
}

/** Derive a plausible scope summary from project name + contract value. */
export function getTenderScope(p: Project): {
  summary: string;
  areas: string[];
  systems: string[];
  programme: string;
} {
  const name = p.name.toLowerCase();
  const isHotel = name.includes("hotel") || name.includes("fitzrovia");
  const isTower = name.includes("tower") || name.includes("wharf") || name.includes("cross");
  const isRetail = name.includes("retail") || name.includes("market") || name.includes("square") || name.includes("sq");
  const isFitout = name.includes("fit-out") || name.includes("cat b");
  const isResi = name.includes("lofts") || name.includes("place") || name.includes("peninsula");

  let summary = "Drylining package — partitions, wall linings, MF ceilings and acoustic detailing.";
  const areas: string[] = [];
  const systems: string[] = [];

  if (isHotel) {
    summary = "Full drylining package to guestrooms, corridors and back-of-house — acoustic-rated partitions and MF ceilings throughout.";
    areas.push("Guestrooms (all floors)", "Corridors & lift lobbies", "BOH / plant rooms");
    systems.push("60min FR party walls (British Gypsum GypWall Robust)", "MF5 ceilings", "Shaftwall to risers");
  } else if (isTower) {
    summary = "Cat A/B drylining to office floors — partitions, linings, MF ceilings and riser shaftwall.";
    areas.push("Office floors", "Core linings", "WC pods");
    systems.push("Knauf Metal Stud partitions", "Rigitone perforated ceilings", "Siniat GTEC Shaftwall");
  } else if (isRetail) {
    summary = "Retail unit fit-out drylining — shopfront linings, tenant partitions, MF ceilings.";
    areas.push("Retail units (GF/L1)", "Common mall areas");
    systems.push("Steel-framed partitions", "Moisture-resistant board to WCs", "MF plasterboard ceilings");
  } else if (isFitout) {
    summary = "Cat B fit-out drylining — meeting rooms, breakouts, teapoints and acoustic pods.";
    areas.push("Meeting rooms", "Open-plan breakout", "Executive floor");
    systems.push("Double-boarded acoustic partitions (55dB Rw)", "Rockfon Mono ceilings");
  } else if (isResi) {
    summary = "Residential drylining — party walls, compartment linings, acoustic ceilings to Building Regs Part E.";
    areas.push("Apartments (all blocks)", "Communal corridors");
    systems.push("Part E-compliant party walls", "Resilient bar acoustic ceilings");
  } else {
    areas.push("All floors", "Core linings");
    systems.push("Metal-stud partitions", "MF ceilings");
  }

  const weeks = Math.max(8, Math.round(p.contractValue / 55000));
  const programme = `~${weeks} weeks on site — 2 gangs (boarders + tapers) + 1 ceiling fixer.`;
  return { summary, areas, systems, programme };
}

export type FollowUpEntry = {
  id: string;               // stable id: "derived-*" for filler, ManualFollowUp.id otherwise
  date: string;              // dd/mm/yyyy
  daysAgo: number;
  channel: "email" | "call" | "meeting" | "system";
  by: string;                // team member name
  note: string;
  outcome?: FollowUpOutcome;
  manual?: boolean;          // true when user-logged via the drawer
  isoDate?: string;          // ISO for manual entries (used to prefill edit)
  nextReminderDate?: string; // dd/mm/yyyy — auto-computed follow-up target
};

export type FollowUpOutcome =
  | "no-response" | "acknowledged" | "pricing-review" | "decision-pending"
  | "won" | "lost"
  | "informed" | "waiting-approval" | "escalated" | "resolved";

/** Stage where an outcome makes sense — filters the dialog dropdown per project. */
export type OutcomeStage = "pre" | "post" | "any";

export const FOLLOW_UP_OUTCOMES: {
  code: FollowUpOutcome; label: string; stage: OutcomeStage;
}[] = [
  { code: "no-response",      label: "No response",           stage: "pre"  },
  { code: "acknowledged",     label: "Acknowledged",          stage: "any"  },
  { code: "pricing-review",   label: "Pricing under review",  stage: "pre"  },
  { code: "decision-pending", label: "Decision pending",      stage: "pre"  },
  { code: "won",              label: "Won",                   stage: "pre"  },
  { code: "lost",             label: "Lost",                  stage: "pre"  },
  { code: "informed",         label: "Informed",              stage: "post" },
  { code: "waiting-approval", label: "Waiting approval",      stage: "post" },
  { code: "escalated",        label: "Escalated",             stage: "post" },
  { code: "resolved",         label: "Resolved",              stage: "post" },
];

/** Auto-suggested days until the next follow-up, keyed by outcome. */
const REMINDER_OFFSETS: Record<FollowUpOutcome, number | null> = {
  "no-response":      3,
  "acknowledged":     5,
  "pricing-review":   7,
  "decision-pending": 2,
  "won":              null,
  "lost":             null,
  "informed":         7,
  "waiting-approval": 3,
  "escalated":        1,
  "resolved":         null,
};

export function computeNextReminderOffset(outcome?: FollowUpOutcome): number | null {
  if (!outcome) return 3;
  return REMINDER_OFFSETS[outcome] ?? null;
}

/** Whether a given outcome is available for a project in the given lifecycle status. */
export function outcomesForStatus(status: Project["status"]): typeof FOLLOW_UP_OUTCOMES {
  const stage: OutcomeStage = (status === "tender" || status === "awaiting") ? "pre" : "post";
  return FOLLOW_UP_OUTCOMES.filter((o) => o.stage === "any" || o.stage === stage);
}

/**
 * Build a follow-up timeline from real project fields + deterministic filler.
 * Tenders show 1–2 entries (invite + pricing kick-off); awaiting show 3–5.
 */
export function getFollowUpHistory(p: Project): FollowUpEntry[] {
  const est = getAssignedEstimator(p);
  const entries: FollowUpEntry[] = [];
  const h = hash(p.id);

  // 1) Tender invite received
  const inviteDays = p.quoteSentDate
    ? (daysSince(p.quoteSentDate) ?? 0) + 7 + (h % 7)
    : 14 + (h % 10);
  entries.push({
    id: `derived-invite-${p.id}`,
    date: offsetToDisplay(-inviteDays),
    daysAgo: inviteDays,
    channel: "email",
    by: p.mainContractor,
    note: `Tender invitation received — RFQ pack + drawings issued (${p.name}).`,
  });

  // 2) Kick-off / pricing note
  entries.push({
    id: `derived-kickoff-${p.id}`,
    date: offsetToDisplay(-Math.max(1, inviteDays - 3 - (h % 3))),
    daysAgo: Math.max(1, inviteDays - 3 - (h % 3)),
    channel: "system",
    by: est.name,
    note: "Take-off started in Calculator; BoQ v1 drafted against tender drawings.",
  });

  // 3) Quote sent (if applicable)
  if (p.quoteSentDate) {
    const days = daysSince(p.quoteSentDate) ?? 0;
    entries.push({
      id: `derived-quote-${p.id}`,
      date: p.quoteSentDate,
      daysAgo: days,
      channel: "email",
      by: est.name,
      note: `Quotation issued to ${p.mainContractor}. Awaiting response.`,
    });

    if (p.status === "awaiting" && days >= 5) {
      entries.push({
        id: `derived-chase-${p.id}`,
        date: offsetToDisplay(-Math.max(1, days - 5)),
        daysAgo: Math.max(1, days - 5),
        channel: "call",
        by: est.name,
        note: `Chase call to ${p.mainContractor} — confirmed pack received, review in progress.`,
      });
    }
    if (p.status === "awaiting" && days >= 10) {
      entries.push({
        id: `derived-chase2-${p.id}`,
        date: offsetToDisplay(-Math.max(1, days - 10)),
        daysAgo: Math.max(1, days - 10),
        channel: "email",
        by: est.name,
        note: "Follow-up email — asked for indicative decision date.",
      });
    }
  }

  // Sort newest first
  const manual = readFollowUps().filter((r) => r.projectId === p.id).map((r) => ({
    id: r.id,
    date: r.date,
    daysAgo: Math.max(0, daysBetween(r.isoDate, new Date().toISOString())),
    channel: r.channel,
    by: r.by,
    note: r.note,
    outcome: r.outcome,
    manual: true,
    isoDate: r.isoDate,
    nextReminderDate: r.nextReminderDate,
  } satisfies FollowUpEntry));
  return [...entries, ...manual].sort((a, b) => a.daysAgo - b.daysAgo);
}

function offsetToDisplay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ============================================================================
// Manual follow-up registry — user-logged emails/calls/meetings appended from
// the tender drawer. Persisted in localStorage; merged into getFollowUpHistory.
// ============================================================================

export type ManualFollowUp = {
  id: string;
  projectId: string;
  isoDate: string;                       // ISO timestamp when it happened
  date: string;                          // dd/mm/yyyy for display
  channel: "email" | "call" | "meeting";
  by: string;
  note: string;
  outcome?: FollowUpOutcome;
  nextReminderDate?: string;             // dd/mm/yyyy — auto or user-set
  ts: string;                            // when logged
};

const KEY = "qp-tender-followups";
const EVT = "qp-tender-followups-change";

function readFollowUps(): ManualFollowUp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ManualFollowUp[]) : [];
  } catch {
    return [];
  }
}

function writeFollowUps(rows: ManualFollowUp[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribeFollowUps(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
  };
}

let _snap: ManualFollowUp[] = readFollowUps();
function snapshotFollowUps(): ManualFollowUp[] {
  const fresh = readFollowUps();
  if (fresh.length !== _snap.length || fresh.some((r, i) => r.id !== _snap[i]?.id)) {
    _snap = fresh;
  }
  return _snap;
}

export function useManualFollowUps(projectId: string): ManualFollowUp[] {
  const all = useSyncExternalStore(subscribeFollowUps, snapshotFollowUps, snapshotFollowUps);
  return all.filter((r) => r.projectId === projectId);
}

/** Cross-project subscription for the /follow-ups feed. */
export function useAllManualFollowUps(): ManualFollowUp[] {
  return useSyncExternalStore(subscribeFollowUps, snapshotFollowUps, snapshotFollowUps);
}

export function logFollowUp(input: Omit<ManualFollowUp, "id" | "ts" | "date">): ManualFollowUp {
  const d = new Date(input.isoDate);
  const date = isoToDisplay(input.isoDate);
  const row: ManualFollowUp = {
    ...input,
    id: `fu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date,
    ts: new Date().toISOString(),
  };
  void d; // date-only helper; keeps signature stable
  writeFollowUps([row, ...readFollowUps()]);
  return row;
}

export function updateFollowUp(
  id: string,
  patch: Partial<Omit<ManualFollowUp, "id" | "ts" | "projectId">>,
): ManualFollowUp | undefined {
  const rows = readFollowUps();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return undefined;
  const merged: ManualFollowUp = { ...rows[idx], ...patch };
  if (patch.isoDate) merged.date = isoToDisplay(patch.isoDate);
  const next = [...rows];
  next[idx] = merged;
  writeFollowUps(next);
  return merged;
}

export function deleteFollowUp(id: string): boolean {
  const rows = readFollowUps();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  writeFollowUps(next);
  return true;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Convert an ISO date to the app's dd/mm/yyyy display format. */
export function isoToDisplay(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Convert a yyyy-mm-dd `<input type="date">` value to dd/mm/yyyy. */
export function inputDateToDisplay(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
}

/** Convert dd/mm/yyyy back to yyyy-mm-dd (for `<input type="date">`). */
export function displayToInputDate(v?: string): string {
  if (!v) return "";
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}