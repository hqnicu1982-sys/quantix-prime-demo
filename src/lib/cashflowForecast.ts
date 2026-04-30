import { useMemo } from "react";
import { useInvoices, type RegistryInvoice } from "./invoiceRegistry";
import { usePaymentCycle, type PaymentCycleStore } from "./paymentCycle";

// ============================================================================
// Cashflow Forecast — projects expected cash IN/OUT over a horizon by combining:
//   • Payment Cycle: certified-but-unpaid → expected IN at finalDateForPayment
//                    submitted apps     → expected IN at finalDateForPayment (probability weighted)
//   • Invoice Registry: outstanding receivables → IN at due date
//                       outstanding payables    → OUT at due date
// Pure mock (no backend). Confidence weighting reflects contractual stage.
// ============================================================================

export type ForecastBucketKey = "0-7" | "8-14" | "15-30" | "31-60" | "60+" | "overdue";

export const BUCKETS: { key: ForecastBucketKey; label: string; min: number; max: number }[] = [
  { key: "overdue", label: "Overdue",  min: -Infinity, max: -1 },
  { key: "0-7",     label: "0–7 days",  min: 0,  max: 7 },
  { key: "8-14",    label: "8–14 days", min: 8,  max: 14 },
  { key: "15-30",   label: "15–30 days",min: 15, max: 30 },
  { key: "31-60",   label: "31–60 days",min: 31, max: 60 },
  { key: "60+",     label: "60+ days",  min: 61, max: Infinity },
];

export type ForecastSource =
  | "certificate"        // certified, awaiting payment
  | "application"        // submitted, awaiting notice/certificate
  | "invoice_in"         // outstanding receivable
  | "invoice_out";       // outstanding payable

export type ForecastEntry = {
  id: string;
  source: ForecastSource;
  reference: string;
  counterparty: string;
  direction: "in" | "out";
  expectedDate: string;        // ISO
  daysFromToday: number;
  amount: number;              // gross
  confidence: number;          // 0..1
  weighted: number;            // amount * confidence
  bucket: ForecastBucketKey;
};

export type ForecastTotals = {
  expectedIn: number;
  expectedOut: number;
  net: number;
  weightedIn: number;
  weightedOut: number;
  weightedNet: number;
  byBucket: Record<ForecastBucketKey, { in: number; out: number; net: number }>;
};

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

function bucketFor(days: number): ForecastBucketKey {
  for (const b of BUCKETS) if (days >= b.min && days <= b.max) return b.key;
  return "60+";
}

export type BuildForecastOpts = {
  /** Counterparty label fallback for payment-cycle entries (project main contractor / sub). */
  counterparty: string;
  /** "subcontractor" → certificates are IN, "main_contractor" → certificates are OUT. */
  ourRole: "subcontractor" | "main_contractor";
};

export function buildForecast(
  cycle: PaymentCycleStore,
  invoices: RegistryInvoice[],
  opts: BuildForecastOpts,
): { entries: ForecastEntry[]; totals: ForecastTotals } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const entries: ForecastEntry[] = [];

  // ---- Payment cycle: certificates awaiting payment
  for (const cert of cycle.certificates) {
    if (cert.paidAt) continue;
    const app = cycle.applications.find((a) => a.id === cert.applicationId);
    const date = app?.finalDateForPayment ?? cert.issuedAt;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const days = daysBetween(today, d);
    entries.push({
      id: `cert-${cert.id}`,
      source: "certificate",
      reference: cert.certificateNumber,
      counterparty: opts.counterparty,
      direction: opts.ourRole === "main_contractor" ? "out" : "in",
      expectedDate: date,
      daysFromToday: days,
      amount: cert.finalAmount,
      confidence: 0.95, // certified — very high
      weighted: +(cert.finalAmount * 0.95).toFixed(2),
      bucket: bucketFor(days),
    });
  }

  // ---- Payment cycle: submitted (or noticed) apps awaiting certificate
  for (const app of cycle.applications) {
    if (app.status !== "submitted" && app.status !== "noticed") continue;
    const date = app.finalDateForPayment;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const days = daysBetween(today, d);
    const conf = app.status === "noticed" ? 0.85 : 0.7;
    entries.push({
      id: `app-${app.id}`,
      source: "application",
      reference: app.appNumber,
      counterparty: opts.counterparty,
      direction: opts.ourRole === "main_contractor" ? "out" : "in",
      expectedDate: date,
      daysFromToday: days,
      amount: app.netThisApplication,
      confidence: conf,
      weighted: +(app.netThisApplication * conf).toFixed(2),
      bucket: bucketFor(days),
    });
  }

  // ---- Invoice registry: outstanding receivables/payables
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    const d = new Date(inv.due); d.setHours(0, 0, 0, 0);
    const days = daysBetween(today, d);
    // Skip duplicates: receivables that mirror a certificate share the same reference number
    const isCertMirror = cycle.certificates.some((c) => c.certificateNumber === inv.reference);
    if (isCertMirror) continue;
    entries.push({
      id: `inv-${inv.id}`,
      source: inv.direction === "receivable" ? "invoice_in" : "invoice_out",
      reference: inv.reference,
      counterparty: inv.counterparty,
      direction: inv.direction === "receivable" ? "in" : "out",
      expectedDate: inv.due,
      daysFromToday: days,
      amount: inv.amount,
      confidence: days < 0 ? 0.7 : 0.9,
      weighted: +(inv.amount * (days < 0 ? 0.7 : 0.9)).toFixed(2),
      bucket: bucketFor(days),
    });
  }

  entries.sort((a, b) => a.daysFromToday - b.daysFromToday);

  const totals: ForecastTotals = {
    expectedIn: 0, expectedOut: 0, net: 0,
    weightedIn: 0, weightedOut: 0, weightedNet: 0,
    byBucket: BUCKETS.reduce((acc, b) => {
      acc[b.key] = { in: 0, out: 0, net: 0 };
      return acc;
    }, {} as ForecastTotals["byBucket"]),
  };
  for (const e of entries) {
    if (e.direction === "in") {
      totals.expectedIn += e.amount;
      totals.weightedIn += e.weighted;
      totals.byBucket[e.bucket].in += e.amount;
    } else {
      totals.expectedOut += e.amount;
      totals.weightedOut += e.weighted;
      totals.byBucket[e.bucket].out += e.amount;
    }
  }
  totals.net = +(totals.expectedIn - totals.expectedOut).toFixed(2);
  totals.weightedNet = +(totals.weightedIn - totals.weightedOut).toFixed(2);
  for (const k of Object.keys(totals.byBucket) as ForecastBucketKey[]) {
    totals.byBucket[k].net = +(totals.byBucket[k].in - totals.byBucket[k].out).toFixed(2);
  }
  totals.expectedIn = +totals.expectedIn.toFixed(2);
  totals.expectedOut = +totals.expectedOut.toFixed(2);
  totals.weightedIn = +totals.weightedIn.toFixed(2);
  totals.weightedOut = +totals.weightedOut.toFixed(2);

  return { entries, totals };
}

export function useCashflowForecast(projectId: string, opts: BuildForecastOpts) {
  const cycle = usePaymentCycle(projectId);
  const invoices = useInvoices(projectId);
  return useMemo(() => buildForecast(cycle, invoices, opts), [cycle, invoices, opts.counterparty, opts.ourRole]);
}