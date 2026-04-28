import { useEffect, useState } from "react";
import { team } from "./mockData";

// ============================================================================
// Labour — global role rates, per-member rate, project assignments, invites.
// localStorage-backed (mock).
// ============================================================================

export type LabourRole = {
  id: string;
  name: string;
  defaultRate: number; // £/h
};

export type MemberRate = {
  memberId: string;
  roleId?: string;
  rate: number; // £/h
};

export type ProjectAssignment = {
  id: string;
  projectId: string;
  memberId: string;
  projectRole?: string;     // free-text role on this project (e.g. "Drylining L4")
  crewName?: string;        // e.g. "Marcin's Crew"
  rateOverride?: number;    // overrides member.rate for this project only
  createdAt: number;
};

export type Invite = {
  id: string;
  email: string;
  name?: string;
  roleId?: string;
  rate: number;
  tier: "Admin" | "Pro Control" | "Pro" | "Site User" | "Operative";
  projectId?: string;
  status: "pending" | "accepted";
  createdAt: number;
};

const ROLES_KEY = "qp-labour-roles";
const MEMBER_RATES_KEY = "qp-labour-member-rates";
const ASSIGN_KEY = "qp-labour-assignments";
const INVITES_KEY = "qp-labour-invites";
const SEED_KEY = "qp-labour-seeded-v1";
const EVT = "qp-labour-change";
const PW_KEY = (pid: string) => `qp-pw-rates-${pid}`;
const PW_SEED_KEY = (pid: string) => `qp-pw-rates-seeded-${pid}`;
const PW_EVT = "qp-pw-rates-change";

// ---------- price-work rates ----------
export type PriceWorkUnit = "lump" | "m2" | "lm" | "nr";

export type PriceWorkRate = {
  id: string;
  projectId: string;
  code: string;            // "PW-1FIX-L5"
  scope: string;           // "1st fix partitions L5"
  unit: PriceWorkUnit;
  rate: number;            // £ per unit (or lump £ if unit="lump")
  boqLineId?: string;
  taskId?: string;
  createdAt: number;
};

const PW_DEFAULTS: Record<string, Omit<PriceWorkRate, "id" | "createdAt" | "projectId">[]> = {
  fitzrovia: [
    { code: "PW-1FIX-L5",  scope: "1st fix partitions — L5",   unit: "m2", rate: 8.5,  boqLineId: "BOQ-L5-PART", taskId: "T-003" },
    { code: "PW-2FIX-L5",  scope: "2nd fix boarding — L5",     unit: "m2", rate: 6.5,  boqLineId: "BOQ-L5-PART" },
    { code: "PW-TJ-L4",    scope: "Tape & joint — L4",         unit: "m2", rate: 4.25, boqLineId: "BOQ-TJ" },
    { code: "PW-MF-L5",    scope: "MF ceiling grid — L5",      unit: "m2", rate: 12.0, boqLineId: "BOQ-L5-CLG", taskId: "T-004" },
    { code: "PW-LOBBY-VO", scope: "Lobby bulkheads (VO-002)",  unit: "lump", rate: 3200 },
  ],
};

function ensurePwSeed(pid: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(PW_SEED_KEY(pid))) return;
  const defs = PW_DEFAULTS[pid];
  if (defs && !localStorage.getItem(PW_KEY(pid))) {
    const seeded: PriceWorkRate[] = defs.map((d, i) => ({
      ...d,
      id: `pw-seed-${pid}-${i}`,
      projectId: pid,
      createdAt: Date.now() - (defs.length - i) * 1000,
    }));
    localStorage.setItem(PW_KEY(pid), JSON.stringify(seeded));
  }
  localStorage.setItem(PW_SEED_KEY(pid), "1");
}

export function getPriceWorkRates(projectId: string): PriceWorkRate[] {
  if (typeof window === "undefined") return [];
  ensurePwSeed(projectId);
  try {
    const raw = localStorage.getItem(PW_KEY(projectId));
    return raw ? (JSON.parse(raw) as PriceWorkRate[]) : [];
  } catch {
    return [];
  }
}

function writePw(projectId: string, list: PriceWorkRate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PW_KEY(projectId), JSON.stringify(list));
  window.dispatchEvent(new Event(PW_EVT));
}

export function addPriceWorkRate(
  input: Omit<PriceWorkRate, "id" | "createdAt">,
): PriceWorkRate {
  const list = getPriceWorkRates(input.projectId);
  const next: PriceWorkRate = {
    ...input,
    id: uid("pw"),
    createdAt: Date.now(),
  };
  writePw(input.projectId, [...list, next]);
  return next;
}

export function updatePriceWorkRate(
  projectId: string,
  id: string,
  patch: Partial<Omit<PriceWorkRate, "id" | "projectId" | "createdAt">>,
) {
  const list = getPriceWorkRates(projectId);
  writePw(projectId, list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function removePriceWorkRate(projectId: string, id: string) {
  writePw(projectId, getPriceWorkRates(projectId).filter((r) => r.id !== id));
}

export function getPriceWorkRate(projectId: string, id: string): PriceWorkRate | undefined {
  return getPriceWorkRates(projectId).find((r) => r.id === id);
}

// ---------- defaults / seed ----------
const DEFAULT_ROLES: LabourRole[] = [
  { id: "r-lead-dryliner", name: "Lead Dryliner", defaultRate: 26.0 },
  { id: "r-dryliner",      name: "Dryliner",      defaultRate: 24.5 },
  { id: "r-lead-taper",    name: "Lead Taper",    defaultRate: 24.0 },
  { id: "r-taper",         name: "Taper",         defaultRate: 22.0 },
  { id: "r-mf-fixer",      name: "MF Fixer",      defaultRate: 23.0 },
  { id: "r-foreman",       name: "Foreman",       defaultRate: 28.0 },
  { id: "r-apprentice",    name: "Apprentice",    defaultRate: 14.5 },
  { id: "r-pm",            name: "Project Manager", defaultRate: 42.0 },
  { id: "r-qs",            name: "Quantity Surveyor", defaultRate: 45.0 },
];

const DEFAULT_MEMBER_RATES: MemberRate[] = [
  { memberId: "mk", roleId: "r-lead-dryliner", rate: 26.0 },
  { memberId: "aj", roleId: "r-lead-taper",    rate: 24.0 },
  { memberId: "pw", roleId: "r-foreman",       rate: 28.0 },
  { memberId: "na", roleId: "r-pm",            rate: 42.0 },
  { memberId: "sm", roleId: "r-qs",            rate: 45.0 },
  { memberId: "ro", roleId: "r-qs",            rate: 38.0 },
  { memberId: "dp", rate: 0 },
];

const DEFAULT_ASSIGNMENTS: Omit<ProjectAssignment, "id" | "createdAt">[] = [
  { projectId: "fitzrovia", memberId: "mk", projectRole: "Drylining L4", crewName: "Marcin's Crew" },
  { projectId: "fitzrovia", memberId: "pw", projectRole: "Drylining L5", crewName: "Paweł's Crew" },
  { projectId: "fitzrovia", memberId: "aj", projectRole: "Tape & joint", crewName: "Andy's Tapers" },
  { projectId: "fitzrovia", memberId: "na", projectRole: "Site Manager" },
  { projectId: "fitzrovia", memberId: "sm", projectRole: "Commercial QS" },
];

const DEFAULT_INVITES: Omit<Invite, "id" | "createdAt">[] = [
  { email: "ben@drywallcrew.co.uk", name: "Ben (Drywall Crew)", roleId: "r-dryliner", rate: 24.5, tier: "Operative", projectId: "fitzrovia", status: "pending" },
];

// ---------- storage helpers ----------
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}
function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  if (!localStorage.getItem(ROLES_KEY)) write(ROLES_KEY, DEFAULT_ROLES);
  if (!localStorage.getItem(MEMBER_RATES_KEY)) write(MEMBER_RATES_KEY, DEFAULT_MEMBER_RATES);
  if (!localStorage.getItem(ASSIGN_KEY)) {
    const seeded: ProjectAssignment[] = DEFAULT_ASSIGNMENTS.map((a, i) => ({
      ...a,
      id: `asg-seed-${i}`,
      createdAt: Date.now(),
    }));
    write(ASSIGN_KEY, seeded);
  }
  if (!localStorage.getItem(INVITES_KEY)) {
    const seeded: Invite[] = DEFAULT_INVITES.map((inv, i) => ({
      ...inv,
      id: `inv-seed-${i}`,
      createdAt: Date.now(),
    }));
    write(INVITES_KEY, seeded);
  }
  localStorage.setItem(SEED_KEY, "1");
}

// ---------- roles ----------
export function getRoles(): LabourRole[] {
  ensureSeed();
  return read<LabourRole[]>(ROLES_KEY, DEFAULT_ROLES);
}
export function upsertRole(role: Omit<LabourRole, "id"> & { id?: string }) {
  const list = getRoles();
  if (role.id) {
    write(ROLES_KEY, list.map((r) => (r.id === role.id ? { ...r, ...role } as LabourRole : r)));
  } else {
    write(ROLES_KEY, [...list, { ...role, id: uid("role") } as LabourRole]);
  }
}
export function deleteRole(id: string) {
  write(ROLES_KEY, getRoles().filter((r) => r.id !== id));
}

// ---------- member rates ----------
export function getMemberRates(): MemberRate[] {
  ensureSeed();
  return read<MemberRate[]>(MEMBER_RATES_KEY, DEFAULT_MEMBER_RATES);
}
export function setMemberRate(mr: MemberRate) {
  const list = getMemberRates();
  const i = list.findIndex((x) => x.memberId === mr.memberId);
  if (i === -1) write(MEMBER_RATES_KEY, [...list, mr]);
  else { const next = [...list]; next[i] = mr; write(MEMBER_RATES_KEY, next); }
}
export function getMemberRate(memberId: string): MemberRate | undefined {
  return getMemberRates().find((m) => m.memberId === memberId);
}

// ---------- assignments ----------
export function getAssignments(projectId?: string): ProjectAssignment[] {
  ensureSeed();
  const all = read<ProjectAssignment[]>(ASSIGN_KEY, []);
  return projectId ? all.filter((a) => a.projectId === projectId) : all;
}
export function addAssignment(a: Omit<ProjectAssignment, "id" | "createdAt">) {
  const all = read<ProjectAssignment[]>(ASSIGN_KEY, []);
  const next: ProjectAssignment = { ...a, id: uid("asg"), createdAt: Date.now() };
  write(ASSIGN_KEY, [...all, next]);
  return next;
}
export function removeAssignment(id: string) {
  write(ASSIGN_KEY, read<ProjectAssignment[]>(ASSIGN_KEY, []).filter((a) => a.id !== id));
}

// ---------- invites ----------
export function getInvites(): Invite[] {
  ensureSeed();
  return read<Invite[]>(INVITES_KEY, []);
}
export function addInvite(inv: Omit<Invite, "id" | "createdAt" | "status">) {
  const list = getInvites();
  const next: Invite = { ...inv, id: uid("inv"), createdAt: Date.now(), status: "pending" };
  write(INVITES_KEY, [...list, next]);
  return next;
}
export function removeInvite(id: string) {
  write(INVITES_KEY, getInvites().filter((i) => i.id !== id));
}

// ---------- effective rate logic ----------
export function effectiveRate(memberId: string, projectId?: string): number {
  if (projectId) {
    const asg = getAssignments(projectId).find((a) => a.memberId === memberId);
    if (asg?.rateOverride !== undefined) return asg.rateOverride;
  }
  const mr = getMemberRate(memberId);
  if (mr) return mr.rate;
  return 0;
}

export type ProjectCrew = {
  assignment: ProjectAssignment;
  member: (typeof team)[number] | undefined;
  rate: number;
  crewName: string;
  projectRole: string;
};

export function getProjectCrews(projectId: string): ProjectCrew[] {
  return getAssignments(projectId).map((a) => {
    const m = team.find((t) => t.id === a.memberId);
    return {
      assignment: a,
      member: m,
      rate: effectiveRate(a.memberId, projectId),
      crewName: a.crewName ?? (m ? `${m.name.split(" ")[0]}'s crew` : "Crew"),
      projectRole: a.projectRole ?? m?.role ?? "—",
    };
  });
}

export function getMembersOnProject(projectId: string) {
  const ids = new Set(getAssignments(projectId).map((a) => a.memberId));
  return team.filter((t) => ids.has(t.id));
}

// ---------- React hooks ----------
function useStore<T>(reader: () => T): T {
  const [state, setState] = useState<T>(() => reader());
  useEffect(() => {
    const refresh = () => setState(reader());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key && e.key.startsWith("qp-labour")) refresh(); };
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

export function useRoles() { return useStore(getRoles); }
export function useMemberRates() { return useStore(getMemberRates); }
export function useAssignments(projectId?: string) { return useStore(() => getAssignments(projectId)); }
export function useProjectCrews(projectId: string) { return useStore(() => getProjectCrews(projectId)); }
export function useInvites() { return useStore(getInvites); }
