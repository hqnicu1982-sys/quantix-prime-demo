import { useEffect, useState } from "react";
import { deleteByReference, markPaidByReference } from "./invoiceRegistry";
import { getProjectVariations } from "./variations";

// ============================================================================
// Payment Cycle — interim payment workflow per JCT/NEC contracts.
//   Application for Payment → Payment Notice → (Pay Less Notice) → Certificate → Paid
// localStorage-backed mock. Per project.
// ============================================================================

export type PaymentLineCategory =
  | "preliminaries"
  | "measured_work"
  | "variations"
  | "materials_on_site"
  | "dayworks"
  | "other";

export const CATEGORY_LABELS: Record<PaymentLineCategory, string> = {
  preliminaries: "Preliminaries",
  measured_work: "Measured Work",
  variations: "Variations",
  materials_on_site: "Materials on Site",
  dayworks: "Dayworks",
  other: "Other",
};

export type PaymentLine = {
  id: string;
  category: PaymentLineCategory;
  description: string;
  gross: number; // £, signed
};

export type PaymentApplicationStatus =
  | "draft"
  | "submitted"
  | "noticed"      // Payment Notice issued (with or without Pay Less)
  | "certified"    // Certificate issued, awaiting payment
  | "paid"
  | "disputed";

export type PaymentApplication = {
  id: string;                     // unique
  projectId: string;
  appNumber: string;              // "AFP-014"
  periodEnd: string;              // ISO yyyy-mm-dd — work valued up to this date
  submittedAt?: string;           // ISO when status moved to submitted
  dueDateForNotice: string;       // ISO — Payment Notice must be issued by (typ. +5 days)
  finalDateForPayment: string;    // ISO — payment must be made by (typ. +14/21 days)
  lines: PaymentLine[];
  retentionPct: number;           // 0-10
  previouslyCertified: number;    // £ already certified on past apps
  // Computed (also stored for fast read):
  grossTotal: number;             // sum(lines.gross)
  retentionHeld: number;          // grossTotal * retentionPct
  netCumulative: number;          // grossTotal - retentionHeld
  netThisApplication: number;     // netCumulative - previouslyCertified
  status: PaymentApplicationStatus;
  noticeId?: string;
  payLessNoticeId?: string;
  certificateId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type PaymentNotice = {
  id: string;
  applicationId: string;
  issuedAt: string;          // ISO
  certifiedAmount: number;   // what MC certifies as due (gross of retention rules)
  notes?: string;
};

export type PayLessNotice = {
  id: string;
  applicationId: string;
  noticeId: string;          // related Payment Notice
  issuedAt: string;
  withholdingAmount: number; // £ being withheld
  reason: string;            // required justification
};

export type PaymentCertificate = {
  id: string;
  applicationId: string;
  certificateNumber: string;     // "CERT-014"
  finalAmount: number;           // amount actually due to be paid
  issuedAt: string;
  paidAt?: string;
  paymentReference?: string;
};

export type PaymentCycleStore = {
  applications: PaymentApplication[];
  notices: PaymentNotice[];
  payLess: PayLessNotice[];
  certificates: PaymentCertificate[];
};

const KEY = (pid: string) => `qp-payment-cycle-${pid}`;
const SEED_KEY = (pid: string) => `qp-payment-cycle-seeded-${pid}-v1`;
const EVT = "qp-payment-cycle-change";

const empty: PaymentCycleStore = {
  applications: [],
  notices: [],
  payLess: [],
  certificates: [],
};

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function read(pid: string): PaymentCycleStore {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY(pid));
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw);
    return {
      applications: parsed.applications ?? [],
      notices: parsed.notices ?? [],
      payLess: parsed.payLess ?? [],
      certificates: parsed.certificates ?? [],
    };
  } catch {
    return { ...empty };
  }
}

function write(pid: string, data: PaymentCycleStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(pid), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
}

// ---------------------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------------------

export function recalcApplication<T extends Pick<PaymentApplication, "lines" | "retentionPct" | "previouslyCertified">>(
  app: T,
): { grossTotal: number; retentionHeld: number; netCumulative: number; netThisApplication: number } {
  const grossTotal = app.lines.reduce((s, l) => s + (Number(l.gross) || 0), 0);
  const retentionHeld = +(grossTotal * (app.retentionPct / 100)).toFixed(2);
  const netCumulative = +(grossTotal - retentionHeld).toFixed(2);
  const netThisApplication = +(netCumulative - (Number(app.previouslyCertified) || 0)).toFixed(2);
  return { grossTotal, retentionHeld, netCumulative, netThisApplication };
}

export function getNextAppNumber(pid: string): string {
  const list = read(pid).applications;
  const max = list.reduce((m, a) => {
    const n = parseInt(a.appNumber.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `AFP-${String(max + 1).padStart(3, "0")}`;
}

export function getNextCertNumber(pid: string): string {
  const list = read(pid).certificates;
  const max = list.reduce((m, c) => {
    const n = parseInt(c.certificateNumber.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `CERT-${String(max + 1).padStart(3, "0")}`;
}

export function previouslyCertifiedTotal(pid: string): number {
  return read(pid).certificates.reduce((s, c) => s + c.finalAmount, 0);
}

// Default contract dates (UK Construction Act defaults: 5 days for notice, 14 days final)
export function computeDueDates(periodEnd: string, daysToNotice = 5, daysToPayment = 14) {
  const base = new Date(periodEnd);
  const due = new Date(base); due.setDate(due.getDate() + daysToNotice);
  const final = new Date(base); final.setDate(final.getDate() + daysToPayment);
  return {
    dueDateForNotice: due.toISOString().slice(0, 10),
    finalDateForPayment: final.toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type NewApplicationInput = {
  projectId: string;
  periodEnd: string;
  retentionPct: number;
  previouslyCertified: number;
  lines: Omit<PaymentLine, "id">[];
  notes?: string;
  status?: "draft" | "submitted";
};

export function createApplication(input: NewApplicationInput): PaymentApplication {
  const data = read(input.projectId);
  const lines: PaymentLine[] = input.lines.map((l) => ({ ...l, id: uid("ln") }));
  const dueDates = computeDueDates(input.periodEnd);
  const totals = recalcApplication({
    lines,
    retentionPct: input.retentionPct,
    previouslyCertified: input.previouslyCertified,
  });
  const now = Date.now();
  const app: PaymentApplication = {
    id: uid("app"),
    projectId: input.projectId,
    appNumber: getNextAppNumber(input.projectId),
    periodEnd: input.periodEnd,
    submittedAt: input.status === "submitted" ? new Date().toISOString().slice(0, 10) : undefined,
    ...dueDates,
    lines,
    retentionPct: input.retentionPct,
    previouslyCertified: input.previouslyCertified,
    ...totals,
    status: input.status ?? "draft",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  write(input.projectId, { ...data, applications: [app, ...data.applications] });
  return app;
}

export function submitApplication(pid: string, appId: string) {
  const data = read(pid);
  write(pid, {
    ...data,
    applications: data.applications.map((a) =>
      a.id === appId
        ? { ...a, status: "submitted", submittedAt: new Date().toISOString().slice(0, 10), updatedAt: Date.now() }
        : a,
    ),
  });
}

export function deleteApplication(pid: string, appId: string) {
  const data = read(pid);
  // Cascade: delete any invoice mirrors created from this app's certificate
  const certsToRemove = data.certificates.filter((c) => c.applicationId === appId);
  for (const c of certsToRemove) {
    try { deleteByReference(c.certificateNumber); } catch { /* noop */ }
  }
  write(pid, {
    ...data,
    applications: data.applications.filter((a) => a.id !== appId),
    notices: data.notices.filter((n) => n.applicationId !== appId),
    payLess: data.payLess.filter((p) => p.applicationId !== appId),
    certificates: data.certificates.filter((c) => c.applicationId !== appId),
  });
}

export function issuePaymentNotice(
  pid: string,
  input: { applicationId: string; certifiedAmount: number; notes?: string },
): PaymentNotice {
  const data = read(pid);
  const notice: PaymentNotice = {
    id: uid("pn"),
    applicationId: input.applicationId,
    issuedAt: new Date().toISOString().slice(0, 10),
    certifiedAmount: input.certifiedAmount,
    notes: input.notes,
  };
  write(pid, {
    ...data,
    notices: [notice, ...data.notices],
    applications: data.applications.map((a) =>
      a.id === input.applicationId
        ? { ...a, status: "noticed", noticeId: notice.id, updatedAt: Date.now() }
        : a,
    ),
  });
  return notice;
}

export function issuePayLessNotice(
  pid: string,
  input: { applicationId: string; noticeId: string; withholdingAmount: number; reason: string },
): PayLessNotice {
  const data = read(pid);
  const pl: PayLessNotice = {
    id: uid("pl"),
    applicationId: input.applicationId,
    noticeId: input.noticeId,
    issuedAt: new Date().toISOString().slice(0, 10),
    withholdingAmount: input.withholdingAmount,
    reason: input.reason,
  };
  write(pid, {
    ...data,
    payLess: [pl, ...data.payLess],
    applications: data.applications.map((a) =>
      a.id === input.applicationId ? { ...a, payLessNoticeId: pl.id, updatedAt: Date.now() } : a,
    ),
  });
  return pl;
}

export function issueCertificate(
  pid: string,
  input: { applicationId: string; finalAmount: number },
): PaymentCertificate {
  const data = read(pid);
  const cert: PaymentCertificate = {
    id: uid("cert"),
    applicationId: input.applicationId,
    certificateNumber: getNextCertNumber(pid),
    finalAmount: input.finalAmount,
    issuedAt: new Date().toISOString().slice(0, 10),
  };
  write(pid, {
    ...data,
    certificates: [cert, ...data.certificates],
    applications: data.applications.map((a) =>
      a.id === input.applicationId
        ? { ...a, status: "certified", certificateId: cert.id, updatedAt: Date.now() }
        : a,
    ),
  });
  return cert;
}

export function recordPayment(
  pid: string,
  input: { applicationId: string; certificateId: string; paidAt: string; paymentReference?: string },
) {
  const data = read(pid);
  // Cascade: mark the mirrored invoice paid (matched by certificate number)
  const cert = data.certificates.find((c) => c.id === input.certificateId);
  if (cert) {
    try { markPaidByReference(cert.certificateNumber, input.paidAt); } catch { /* noop */ }
  }
  write(pid, {
    ...data,
    certificates: data.certificates.map((c) =>
      c.id === input.certificateId
        ? { ...c, paidAt: input.paidAt, paymentReference: input.paymentReference }
        : c,
    ),
    applications: data.applications.map((a) =>
      a.id === input.applicationId ? { ...a, status: "paid", updatedAt: Date.now() } : a,
    ),
  });
}

/** Wipe payment-cycle storage for a project (project delete cleanup). */
export function clearPaymentCycle(pid: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(pid));
    localStorage.removeItem(SEED_KEY(pid));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { projectId: pid } }));
  } catch { /* noop */ }
}

/** Total previously certified by all certificates so far (live read). */
export function previouslyCertifiedLive(pid: string): number {
  return read(pid).certificates.reduce((s, c) => s + c.finalAmount, 0);
}

/**
 * Returns suggested PaymentLine inputs derived from approved variations on this
 * project that have not yet been included in any payment application.
 * Inclusion is detected by `[VO-XXX]` prefix in the line description.
 */
export function getApprovedVariationLines(
  pid: string,
): Array<{ category: PaymentLineCategory; description: string; gross: number; voId: string }> {
  const variations = getProjectVariations(pid);
  const approved = variations.filter((v) => v.status === "approved");
  const store = read(pid);
  const usedIds = new Set<string>();
  for (const app of store.applications) {
    for (const line of app.lines) {
      const m = line.description?.match(/\[(VO-\d+)\]/);
      if (m) usedIds.add(m[1]);
    }
  }
  return approved
    .filter((v) => !usedIds.has(v.id))
    .map((v) => ({
      category: "variations" as PaymentLineCategory,
      description: `[${v.id}] ${v.title}`,
      gross: v.approvedValue ?? v.costImpact,
      voId: v.id,
    }));
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export type PaymentTotals = {
  appliedYTD: number;        // sum of netThisApplication for non-draft apps
  certifiedYTD: number;      // sum of certificates issued
  paidYTD: number;           // sum of certificates paid
  outstanding: number;       // certified but not paid
  retentionHeldTotal: number;// sum of retentionHeld across all apps
  pendingApplicationsCount: number;
  nextDueDate?: string;      // soonest upcoming dueDateForNotice for non-noticed apps
  daysToNextDue?: number;    // negative if overdue
};

export function computeTotals(store: PaymentCycleStore): PaymentTotals {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let applied = 0, certified = 0, paid = 0, retention = 0, pending = 0;
  let nextDue: string | undefined;
  for (const a of store.applications) {
    if (a.status !== "draft") applied += a.netThisApplication;
    retention += a.retentionHeld;
    if (a.status === "submitted") {
      pending += 1;
      if (!nextDue || a.dueDateForNotice < nextDue) nextDue = a.dueDateForNotice;
    }
  }
  for (const c of store.certificates) {
    certified += c.finalAmount;
    if (c.paidAt) paid += c.finalAmount;
  }
  let daysToNextDue: number | undefined;
  if (nextDue) {
    const d = new Date(nextDue); d.setHours(0, 0, 0, 0);
    daysToNextDue = Math.round((d.getTime() - today.getTime()) / 86400000);
  }
  return {
    appliedYTD: +applied.toFixed(2),
    certifiedYTD: +certified.toFixed(2),
    paidYTD: +paid.toFixed(2),
    outstanding: +(certified - paid).toFixed(2),
    retentionHeldTotal: +retention.toFixed(2),
    pendingApplicationsCount: pending,
    nextDueDate: nextDue,
    daysToNextDue,
  };
}

// ---------------------------------------------------------------------------
// Seed mock data for Fitzrovia
// ---------------------------------------------------------------------------

function seedFitzroviaIfEmpty() {
  if (typeof window === "undefined") return;
  const pid = "fitzrovia";
  if (localStorage.getItem(SEED_KEY(pid))) return;
  if (read(pid).applications.length > 0) {
    localStorage.setItem(SEED_KEY(pid), "1");
    return;
  }
  const today = new Date();
  const iso = (offset: number) => {
    const d = new Date(today); d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  // App 1: fully paid (60 days ago)
  const lines1: PaymentLine[] = [
    { id: uid("ln"), category: "preliminaries", description: "Site setup + supervision", gross: 18000 },
    { id: uid("ln"), category: "measured_work", description: "Drylining L1-L2 (substantially complete)", gross: 142000 },
    { id: uid("ln"), category: "materials_on_site", description: "Boards & metalwork delivered", gross: 24000 },
  ];
  const t1 = recalcApplication({ lines: lines1, retentionPct: 5, previouslyCertified: 0 });
  const app1: PaymentApplication = {
    id: "app-seed-1",
    projectId: pid,
    appNumber: "AFP-001",
    periodEnd: iso(-60),
    submittedAt: iso(-58),
    ...computeDueDates(iso(-60)),
    lines: lines1,
    retentionPct: 5,
    previouslyCertified: 0,
    ...t1,
    status: "paid",
    noticeId: "pn-seed-1",
    certificateId: "cert-seed-1",
    createdAt: Date.now() - 60 * 864e5,
    updatedAt: Date.now() - 40 * 864e5,
  };

  // App 2: certified, awaiting payment (30 days ago)
  const lines2: PaymentLine[] = [
    { id: uid("ln"), category: "measured_work", description: "Drylining L3-L4 progress (62%)", gross: 186000 },
    { id: uid("ln"), category: "variations", description: "VO-001 acoustic upgrade", gross: 8400 },
    { id: uid("ln"), category: "materials_on_site", description: "Acoustic boards on site", gross: 18500 },
  ];
  const t2 = recalcApplication({ lines: lines2, retentionPct: 5, previouslyCertified: app1.netCumulative });
  const app2: PaymentApplication = {
    id: "app-seed-2",
    projectId: pid,
    appNumber: "AFP-002",
    periodEnd: iso(-30),
    submittedAt: iso(-28),
    ...computeDueDates(iso(-30)),
    lines: lines2,
    retentionPct: 5,
    previouslyCertified: app1.netCumulative,
    ...t2,
    status: "certified",
    noticeId: "pn-seed-2",
    certificateId: "cert-seed-2",
    createdAt: Date.now() - 30 * 864e5,
    updatedAt: Date.now() - 22 * 864e5,
  };

  // App 3: just submitted, awaiting Payment Notice (due in ~3 days)
  const lines3: PaymentLine[] = [
    { id: uid("ln"), category: "measured_work", description: "Drylining L4-L5 progress + finishes", gross: 134000 },
    { id: uid("ln"), category: "variations", description: "VO-002 lobby bulkheads (pending)", gross: 3200 },
    { id: uid("ln"), category: "dayworks", description: "RFI rework — riser cupboards", gross: 4250 },
  ];
  const t3 = recalcApplication({ lines: lines3, retentionPct: 5, previouslyCertified: app1.netCumulative + app2.netCumulative });
  const app3: PaymentApplication = {
    id: "app-seed-3",
    projectId: pid,
    appNumber: "AFP-003",
    periodEnd: iso(-2),
    submittedAt: iso(-2),
    ...computeDueDates(iso(-2)),
    lines: lines3,
    retentionPct: 5,
    previouslyCertified: app1.netCumulative + app2.netCumulative,
    ...t3,
    status: "submitted",
    createdAt: Date.now() - 2 * 864e5,
    updatedAt: Date.now() - 2 * 864e5,
  };

  const notices: PaymentNotice[] = [
    { id: "pn-seed-1", applicationId: "app-seed-1", issuedAt: iso(-55), certifiedAmount: app1.netCumulative },
    { id: "pn-seed-2", applicationId: "app-seed-2", issuedAt: iso(-25), certifiedAmount: app2.netCumulative },
  ];
  const certs: PaymentCertificate[] = [
    { id: "cert-seed-1", applicationId: "app-seed-1", certificateNumber: "CERT-001", finalAmount: app1.netCumulative, issuedAt: iso(-55), paidAt: iso(-40), paymentReference: "BACS-7821" },
    { id: "cert-seed-2", applicationId: "app-seed-2", certificateNumber: "CERT-002", finalAmount: app2.netCumulative, issuedAt: iso(-25) },
  ];

  write(pid, {
    applications: [app3, app2, app1],
    notices,
    payLess: [],
    certificates: certs,
  });
  localStorage.setItem(SEED_KEY(pid), "1");
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

export function usePaymentCycle(pid: string): PaymentCycleStore {
  const [data, setData] = useState<PaymentCycleStore>(() => {
    if (pid === "fitzrovia") seedFitzroviaIfEmpty();
    return read(pid);
  });
  useEffect(() => {
    if (pid === "fitzrovia") seedFitzroviaIfEmpty();
    setData(read(pid));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined;
      if (!detail || detail.projectId === pid) setData(read(pid));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [pid]);
  return data;
}

export function usePaymentTotals(pid: string): PaymentTotals {
  const data = usePaymentCycle(pid);
  return computeTotals(data);
}

/** Apps awaiting Payment Notice within `windowDays` (or already overdue). */
export function usePendingNotices(pid: string, windowDays = 7) {
  const data = usePaymentCycle(pid);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return data.applications.filter((a) => {
    if (a.status !== "submitted") return false;
    const due = new Date(a.dueDateForNotice); due.setHours(0, 0, 0, 0);
    const days = Math.round((due.getTime() - today.getTime()) / 86400000);
    return days <= windowDays;
  });
}