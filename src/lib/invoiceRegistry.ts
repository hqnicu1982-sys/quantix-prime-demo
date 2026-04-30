import { useEffect, useState } from "react";

// ============================================================================
// Invoice Registry — lightweight persistent ledger of receivables/payables.
// Feeds the Financial dashboard cashflow tile from real data.
// localStorage-backed (mock).
// ============================================================================

export type InvoiceDirection = "receivable" | "payable";
export type InvoiceStatus = "outstanding" | "paid" | "overdue";

export type RegistryInvoice = {
  id: string;
  projectId: string;
  direction: InvoiceDirection;
  counterparty: string;     // supplier or client name
  reference: string;        // invoice number
  issued: string;           // ISO yyyy-mm-dd
  due: string;              // ISO yyyy-mm-dd
  amount: number;           // gross £
  status: InvoiceStatus;
  paidAt?: string;
  createdAt: number;
};

const KEY = "qp-invoice-registry";
const SEED_KEY = "qp-invoice-registry-seeded-v1";
const EVT = "qp-invoice-registry-change";

function read(): RegistryInvoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RegistryInvoice[]) : [];
  } catch {
    return [];
  }
}

function write(list: RegistryInvoice[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function uid() {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  const today = new Date();
  const iso = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const seeds: Omit<RegistryInvoice, "id" | "createdAt">[] = [
    // Receivables (client → us)
    { projectId: "fitzrovia", direction: "receivable", counterparty: "Kier Construction", reference: "QP-2026-041", issued: iso(-12), due: iso(18), amount: 184000, status: "outstanding" },
    { projectId: "fitzrovia", direction: "receivable", counterparty: "Kier Construction", reference: "QP-2026-038", issued: iso(-25), due: iso(5),  amount: 100000, status: "outstanding" },
    { projectId: "fitzrovia", direction: "receivable", counterparty: "Kier Construction", reference: "QP-2026-032", issued: iso(-55), due: iso(-25), amount: 76000,  status: "paid", paidAt: iso(-20) },
    // Payables (supplier → us)
    { projectId: "fitzrovia", direction: "payable", counterparty: "CCF",          reference: "CCF-10824", issued: iso(-8),  due: iso(22), amount: 8340, status: "outstanding" },
    { projectId: "fitzrovia", direction: "payable", counterparty: "Minster",      reference: "MIN-44218", issued: iso(-9),  due: iso(21), amount: 4820, status: "outstanding" },
    { projectId: "fitzrovia", direction: "payable", counterparty: "Knauf Direct", reference: "KNF-9981",  issued: iso(-30), due: iso(0),  amount: 18420, status: "paid", paidAt: iso(-3) },
    { projectId: "fitzrovia", direction: "payable", counterparty: "British Gypsum", reference: "BG-7712", issued: iso(-6), due: iso(24), amount: 12450, status: "outstanding" },
    { projectId: "fitzrovia", direction: "payable", counterparty: "Travis Perkins", reference: "TP-88410", issued: iso(-11), due: iso(19), amount: 6280, status: "outstanding" },
    { projectId: "fitzrovia", direction: "payable", counterparty: "Saint-Gobain", reference: "SG-22019", issued: iso(-3), due: iso(27), amount: 110440, status: "outstanding" },
  ];
  const list: RegistryInvoice[] = seeds.map((s, i) => ({
    ...s,
    id: `seed-${i}`,
    createdAt: Date.now() - i * 1000,
  }));
  write(list);
  localStorage.setItem(SEED_KEY, "1");
}

// ---------- queries ----------

export function getInvoices(projectId?: string): RegistryInvoice[] {
  ensureSeed();
  const all = read();
  return projectId ? all.filter((i) => i.projectId === projectId) : all;
}

export type InvoiceTotals = {
  receivables: number;     // outstanding incoming
  payables: number;        // outstanding outgoing
  net: number;             // receivables - payables
  paidIn: number;          // receipts MTD-ish (paid receivables)
  paidOut: number;         // payments MTD-ish (paid payables)
  overdueReceivable: number;
  overduePayable: number;
};

export function getInvoiceTotals(projectId?: string): InvoiceTotals {
  const today = new Date().toISOString().slice(0, 10);
  const list = getInvoices(projectId);
  const totals: InvoiceTotals = {
    receivables: 0, payables: 0, net: 0, paidIn: 0, paidOut: 0,
    overdueReceivable: 0, overduePayable: 0,
  };
  for (const inv of list) {
    const isOutstanding = inv.status === "outstanding" || inv.status === "overdue";
    const isOverdue = isOutstanding && inv.due < today;
    if (inv.direction === "receivable") {
      if (isOutstanding) totals.receivables += inv.amount;
      if (isOverdue) totals.overdueReceivable += inv.amount;
      if (inv.status === "paid") totals.paidIn += inv.amount;
    } else {
      if (isOutstanding) totals.payables += inv.amount;
      if (isOverdue) totals.overduePayable += inv.amount;
      if (inv.status === "paid") totals.paidOut += inv.amount;
    }
  }
  totals.net = totals.receivables - totals.payables;
  return totals;
}

// ---------- mutations ----------

export function addInvoice(entry: Omit<RegistryInvoice, "id" | "createdAt">): RegistryInvoice {
  const next: RegistryInvoice = { ...entry, id: uid(), createdAt: Date.now() };
  write([...getInvoices(), next]);
  return next;
}

export function markInvoicePaid(id: string) {
  const today = new Date().toISOString().slice(0, 10);
  write(read().map((i) => (i.id === id ? { ...i, status: "paid", paidAt: today } : i)));
}

export function deleteInvoice(id: string) {
  write(read().filter((i) => i.id !== id));
}

/** Mark every outstanding invoice that matches `reference` as paid. Used by paymentCycle to keep mirrors in sync. */
export function markPaidByReference(reference: string, paidAt?: string): number {
  const day = paidAt ?? new Date().toISOString().slice(0, 10);
  let updated = 0;
  write(read().map((i) => {
    if (i.reference === reference && i.status !== "paid") {
      updated += 1;
      return { ...i, status: "paid" as const, paidAt: day };
    }
    return i;
  }));
  return updated;
}

/** Delete every invoice matching `reference`. Used when a certificate / application is deleted. */
export function deleteByReference(reference: string): number {
  const before = read();
  const after = before.filter((i) => i.reference !== reference);
  if (after.length === before.length) return 0;
  write(after);
  return before.length - after.length;
}

/** Wipe every invoice belonging to a project. Used when the project itself is deleted. */
export function deleteInvoicesByProject(projectId: string): number {
  const before = read();
  const after = before.filter((i) => i.projectId !== projectId);
  if (after.length === before.length) return 0;
  write(after);
  return before.length - after.length;
}

// ---------- React hooks ----------

function useStore<T>(reader: () => T): T {
  const [state, setState] = useState<T>(() => reader());
  useEffect(() => {
    const refresh = () => setState(reader());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
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

export function useInvoices(projectId?: string) {
  return useStore(() => getInvoices(projectId));
}

export function useInvoiceTotals(projectId?: string) {
  return useStore(() => getInvoiceTotals(projectId));
}