import type { Invoice } from "./mockData";

// ============================================================================
// Invoice reconciliation — canonical 7-stage lifecycle.
// Mirrors the call-off workflow shape so visuals/audit feel consistent.
// ============================================================================

export type InvoiceStage =
  | "received"
  | "parsed"
  | "matched"
  | "review"
  | "approved"
  | "scheduled"
  | "paid";

export type InvoiceStep = {
  id: InvoiceStage;
  label: string;
  description: string;
  actor: string;
  capability: string;
};

export const INVOICE_STEPS: InvoiceStep[] = [
  { id: "received",  label: "Received",   description: "Invoice arrives by email / upload — file logged against project.", actor: "System / Admin",    capability: "view.invoices" },
  { id: "parsed",    label: "Parsed",     description: "OCR extracts header + lines, supplier auto-matched.",            actor: "System",            capability: "view.invoices" },
  { id: "matched",   label: "3-way match", description: "Engine compares Invoice ↔ PO ↔ GRN, computes variance.",         actor: "System",            capability: "view.invoices" },
  { id: "review",    label: "QS review",  description: "Variance > tolerance → QS investigates and decides.",              actor: "Commercial QS",     capability: "sign.invoices" },
  { id: "approved",  label: "Approved",   description: "QS signs the invoice — cleared for the next payment run.",         actor: "Commercial QS",     capability: "sign.invoices" },
  { id: "scheduled", label: "Scheduled",  description: "Added to a payment batch with confirmed pay-date.",                 actor: "Finance / Admin",   capability: "sign.invoices" },
  { id: "paid",      label: "Paid",       description: "Bank confirms; remittance attached; value locked into actuals.",    actor: "Finance / Admin",   capability: "sign.invoices" },
];

export const STAGE_LABEL: Record<InvoiceStage, string> = {
  received: "Received", parsed: "Parsed", matched: "3-way matched",
  review: "QS review", approved: "Approved", scheduled: "Scheduled", paid: "Paid",
};

export const STAGE_TONE: Record<InvoiceStage, "success" | "info" | "warning" | "neutral"> = {
  received: "neutral", parsed: "info", matched: "info",
  review: "warning", approved: "success", scheduled: "info", paid: "success",
};

export function stepIndex(stage: InvoiceStage): number {
  const i = INVOICE_STEPS.findIndex((s) => s.id === stage);
  return i === -1 ? 0 : i;
}

/** Map the legacy `Invoice.state` to a lifecycle stage so existing mocks work. */
export function deriveStage(inv: Invoice): InvoiceStage {
  if (inv.state === "disputed") return "review";
  if (inv.state === "needs-review") return "review";
  // "matched" — assume approved & scheduled in demo; flagged-paid handled in audit.
  if (inv.id === "KNF-9981") return "paid";
  return inv.matchedAt ? "approved" : "matched";
}

// ----- Audit -----

export type InvoiceAuditEvent = {
  ts: string;
  ref: string;
  actor: string;
  action: string;
  detail: string;
};

export const invoiceAuditLog: InvoiceAuditEvent[] = [
  { ts: "today 11:08", ref: "CCF-10824", actor: "System",  action: "Flagged review",  detail: "+£1,247 (+17.6%) above PO — Q2 framework rate not applied" },
  { ts: "today 09:42", ref: "CCF-10824", actor: "System",  action: "Parsed",          detail: "1 supplier line, qty 840 m² Rockwool" },
  { ts: "today 09:41", ref: "CCF-10824", actor: "ap@ccf",  action: "Received",        detail: "Email → ap@quantix.uk · 1 PDF attached" },
  { ts: "yest 15:32",  ref: "CCF-10821", actor: "Sarah M", action: "Approved",        detail: "Variance 0% — cleared for payment run 26 Apr" },
  { ts: "yest 15:20",  ref: "CCF-10821", actor: "System",  action: "3-way matched",   detail: "PO-00247 ↔ DEL-9918 ↔ CCF-10821 (perfect)" },
  { ts: "yest 15:14",  ref: "CCF-10821", actor: "System",  action: "Parsed",          detail: "1,850 m² WallBoard @ £3.92" },
  { ts: "16 Apr 09:00", ref: "MIN-8472", actor: "Sarah M", action: "Disputed",        detail: "Over-delivery claim — credit note requested from Minster" },
  { ts: "15 Apr 11:40", ref: "MIN-8472", actor: "System",  action: "Flagged review",  detail: "Invoice qty 445 m² vs GRN 420 m² → +£560" },
  { ts: "08 Apr 14:02", ref: "KNF-9981", actor: "Bank",    action: "Paid",            detail: "Faster Payment · £18,420 · ref KNF-9981" },
];

// ----- 3-way match lines (per invoice) -----

export type MatchLine = {
  material: string;
  unit: string;
  poQty: number;
  grnQty: number;
  invQty: number;
  poRate: number;
  invRate: number;
  poValue: number;
  invValue: number;
  status: "match" | "qty" | "rate" | "both";
};

export const matchLines: Record<string, MatchLine[]> = {
  "CCF-10821": [
    { material: "Gyproc WallBoard 12.5mm", unit: "m²", poQty: 1850, grnQty: 1850, invQty: 1850, poRate: 3.92, invRate: 3.92, poValue: 7252, invValue: 7252, status: "match" },
  ],
  "CCF-10824": [
    { material: "Rockwool RWA45 50mm", unit: "m²", poQty: 840, grnQty: 840, invQty: 840, poRate: 8.45, invRate: 9.93, poValue: 7098, invValue: 8341, status: "rate" },
  ],
  "MIN-8472": [
    { material: "MF ceiling system kit",  unit: "m²", poQty: 420, grnQty: 420, invQty: 445, poRate: 12.20, invRate: 12.20, poValue: 5124, invValue: 5429, status: "qty" },
    { material: "Resilient bar",          unit: "m",  poQty: 120, grnQty: 120, invQty: 120, poRate: 2.13,  invRate: 2.13,  poValue: 256,  invValue: 256,  status: "match" },
  ],
};

// ----- Payment schedule (approved & ready / scheduled) -----

export type ScheduledPayment = {
  ref: string;
  supplier: string;
  amount: number;
  due: string;
  batch: string;
  status: "ready" | "scheduled" | "paid";
};

export const scheduledPayments: ScheduledPayment[] = [
  { ref: "CCF-10821", supplier: "CCF",     amount: 7252,  due: "26 Apr", batch: "PAY-2026-08", status: "scheduled" },
  { ref: "CCF-10818", supplier: "CCF",     amount: 3776,  due: "26 Apr", batch: "PAY-2026-08", status: "scheduled" },
  { ref: "MIN-44218", supplier: "Minster", amount: 4820,  due: "26 Apr", batch: "PAY-2026-08", status: "scheduled" },
  { ref: "MIN-44201", supplier: "Minster", amount: 2492,  due: "—",      batch: "—",           status: "ready" },
  { ref: "KNF-9981",  supplier: "Knauf Direct", amount: 18420, due: "08 Apr", batch: "PAY-2026-07", status: "paid" },
];

// ----- Disputes -----

export type DisputeRecord = {
  ref: string;
  supplier: string;
  raised: string;
  amount: number;
  reason: string;
  status: "open" | "credit-pending" | "resolved";
  owner: string;
};

export const disputes: DisputeRecord[] = [
  { ref: "MIN-8472",  supplier: "Minster", raised: "16 Apr", amount: 560,   reason: "Over-delivery — 445 m² invoiced vs 420 m² GRN", status: "credit-pending", owner: "Sarah M" },
  { ref: "CCF-10824", supplier: "CCF",     raised: "today",  amount: 1247,  reason: "Framework rate not applied (Q2 contract)",      status: "open",           owner: "Sarah M" },
];

// ----- Tolerance / engine policy (display only) -----

export const VARIANCE_TOLERANCE = { qtyPct: 2, ratePct: 1, absoluteGbp: 50 };

export function explainVariance(line: MatchLine): string {
  const qtyDelta = line.invQty - line.poQty;
  const rateDelta = line.invRate - line.poRate;
  const parts: string[] = [];
  if (qtyDelta !== 0) parts.push(`qty ${qtyDelta > 0 ? "+" : ""}${qtyDelta} ${line.unit}`);
  if (Math.abs(rateDelta) > 0.001) parts.push(`rate ${rateDelta > 0 ? "+" : ""}£${rateDelta.toFixed(2)}`);
  return parts.length ? parts.join(" · ") : "exact match";
}