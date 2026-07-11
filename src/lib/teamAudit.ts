import { useEffect, useState } from "react";
import { getCurrentUser } from "./currentUser";

// ============================================================================
// Team audit log — records every mutation to team, invites, assignments,
// rates and roles. localStorage-backed. Actor derived from currentUser.
// ============================================================================

export type TeamAuditKind =
  | "invite.sent"
  | "invite.revoked"
  | "invite.accepted"
  | "assignment.added"
  | "assignment.removed"
  | "rate.changed"
  | "role.upserted"
  | "role.deleted"
  | "tier.changed";

export type TeamAuditEntry = {
  id: string;
  ts: number;
  kind: TeamAuditKind;
  actor: string;         // display name of who did it
  actorId: string;
  subject?: string;      // affected member/invite email or name
  subjectId?: string;
  projectId?: string;
  detail?: string;       // short human description
  before?: string;
  after?: string;
};

const KEY = "qp-team-audit";
const SEED_KEY = "qp-team-audit-seeded-v1";
const EVT = "qp-team-audit-change";

function read(): TeamAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TeamAuditEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: TeamAuditEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function uid() {
  return `ta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const SEED: Omit<TeamAuditEntry, "id">[] = [
  { ts: Date.now() - 1000 * 60 * 60 * 24 * 6, kind: "role.upserted", actor: "David Andrei", actorId: "dp",
    detail: "Created role 'MF Fixer' with default rate £23.00/h" },
  { ts: Date.now() - 1000 * 60 * 60 * 24 * 5, kind: "invite.sent", actor: "Piu Piu Chick", actorId: "sm",
    subject: "ben@drywallcrew.co.uk", detail: "Invited as Operative · £24.50/h · assigned to Hotel Fitzrovia",
    projectId: "fitzrovia" },
  { ts: Date.now() - 1000 * 60 * 60 * 24 * 4, kind: "assignment.added", actor: "Piu Piu Chick", actorId: "sm",
    subject: "Marcin Kowalski", subjectId: "mk", projectId: "fitzrovia",
    detail: "Assigned as Drylining L4 (Marcin's Crew)" },
  { ts: Date.now() - 1000 * 60 * 60 * 24 * 3, kind: "rate.changed", actor: "David Andrei", actorId: "dp",
    subject: "Andy Jones", subjectId: "aj", before: "£22.00", after: "£24.00",
    detail: "Rate updated after Lead Taper promotion" },
  { ts: Date.now() - 1000 * 60 * 60 * 24 * 2, kind: "assignment.added", actor: "Nick Aldea", actorId: "na",
    subject: "Paweł Wilkowski", subjectId: "pw", projectId: "fitzrovia",
    detail: "Assigned as Drylining L5 (Paweł's Crew)" },
  { ts: Date.now() - 1000 * 60 * 60 * 26, kind: "tier.changed", actor: "David Andrei", actorId: "dp",
    subject: "Rachel Okonkwo", subjectId: "ro", before: "Site User", after: "Pro",
    detail: "Promoted to Pro to unlock Calculator + BoQ read access" },
];

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  if (!localStorage.getItem(KEY)) {
    write(SEED.map((e) => ({ ...e, id: uid() })));
  }
  localStorage.setItem(SEED_KEY, "1");
}

export function getTeamAudit(): TeamAuditEntry[] {
  ensureSeed();
  // newest first
  return [...read()].sort((a, b) => b.ts - a.ts);
}

export function logTeamEvent(
  entry: Omit<TeamAuditEntry, "id" | "ts" | "actor" | "actorId"> & {
    actor?: string;
    actorId?: string;
  },
) {
  const u = typeof window !== "undefined" ? getCurrentUser() : undefined;
  const next: TeamAuditEntry = {
    id: uid(),
    ts: Date.now(),
    actor: entry.actor ?? u?.name ?? "System",
    actorId: entry.actorId ?? u?.id ?? "system",
    kind: entry.kind,
    subject: entry.subject,
    subjectId: entry.subjectId,
    projectId: entry.projectId,
    detail: entry.detail,
    before: entry.before,
    after: entry.after,
  };
  const list = read();
  write([next, ...list]);
  return next;
}

export function useTeamAudit(): TeamAuditEntry[] {
  const [state, setState] = useState<TeamAuditEntry[]>(() => getTeamAudit());
  useEffect(() => {
    const refresh = () => setState(getTeamAudit());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return state;
}

export const KIND_LABEL: Record<TeamAuditKind, string> = {
  "invite.sent":         "Invite sent",
  "invite.revoked":      "Invite revoked",
  "invite.accepted":     "Invite accepted",
  "assignment.added":    "Assigned to project",
  "assignment.removed":  "Removed from project",
  "rate.changed":        "Rate changed",
  "role.upserted":       "Role updated",
  "role.deleted":        "Role deleted",
  "tier.changed":        "Permission tier changed",
};