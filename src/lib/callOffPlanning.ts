import { addDays, daysBetween, parseISO, PLANNER_TODAY, type PlannerTask } from "./planner";
import {
  addCallOff,
  type ProjectBoqLine,
  type ProjectCallOff,
} from "./projectData";

// ============================================================================
// Auto call-off proposals.
// Given the planner tasks + the project BoQ + the supplier picks, suggest a
// minimum set of draft call-offs needed to keep work unblocked. Pure logic —
// no DOM, no localStorage — so it's easy to test and reuse from a banner,
// from "after MSP import", or from a blocker's Recommended action button.
// ============================================================================

export const DEFAULT_LEAD_DAYS = 5;
export const DEFAULT_BUFFER_DAYS = 2;
/** Needs to the same supplier within this many days are batched together. */
export const DEFAULT_COALESCE_WINDOW_DAYS = 5;

export type CallOffAssumptions = {
  defaultLeadDays?: number;
  bufferDays?: number;
  coalesceWindowDays?: number;
  /** sendBy ≤ today+N → "imminent" urgency. Default 3. */
  urgencyImminentDays?: number;
  /** Skip proposals with total qty under this threshold. 0 disables. */
  minBatchQty?: number;
  /** Per-material lead-day overrides; takes precedence over the BoQ line. */
  perMaterialLeadDays?: Record<string, number>;
  /** Demo "today" anchor; falls back to PLANNER_TODAY. */
  today?: Date;
};

export type ProposalLine = {
  lineId: string;
  material: string;
  qty: number;
  unit: string;
  sourceTaskIds: string[];
  leadTimeDays: number;
  leadTimePresumed: boolean;
};

export type ProposalUrgency = "overdue" | "imminent" | "ok";

export type CallOffProposal = {
  /** Stable per (supplier, batch start). */
  key: string;
  supplier: string;
  /** Set when no supplier is picked for any of the lines in the batch. */
  supplierMissing: boolean;
  lines: ProposalLine[];
  /** Earliest task.start across all source tasks (ISO yyyy-mm-dd). */
  neededOn: string;
  /** neededOn − maxLeadTime − buffer (ISO yyyy-mm-dd). */
  sendBy: string;
  daysUntilSendBy: number;
  urgency: ProposalUrgency;
};

type NeedDraft = {
  line: ProjectBoqLine;
  needed_on: string;
  source_task: string;
};

// ---------------------------------------------------------------------------
// Coverage — which BoQ lines are already covered by a non-rejected call-off.
// ProjectCallOff doesn't track partial qty, so coverage is binary.
// ---------------------------------------------------------------------------

export function isLineCovered(lineId: string, callOffs: ProjectCallOff[]): boolean {
  return callOffs.some((co) => co.lineIds.includes(lineId));
}

// ---------------------------------------------------------------------------
// Pure proposal generator.
// ---------------------------------------------------------------------------

export function proposeCallOffs(
  tasks: PlannerTask[],
  boqLines: ProjectBoqLine[],
  callOffs: ProjectCallOff[],
  supplierChoices: Record<string, string>,
  assumptions: CallOffAssumptions = {},
): CallOffProposal[] {
  const today = assumptions.today ?? PLANNER_TODAY;
  const defaultLead = assumptions.defaultLeadDays ?? DEFAULT_LEAD_DAYS;
  const buffer = assumptions.bufferDays ?? DEFAULT_BUFFER_DAYS;
  const window = assumptions.coalesceWindowDays ?? DEFAULT_COALESCE_WINDOW_DAYS;
  const imminentDays = assumptions.urgencyImminentDays ?? 3;
  const minBatchQty = assumptions.minBatchQty ?? 0;
  const overrides = assumptions.perMaterialLeadDays ?? {};

  // 1) Collect raw needs from tasks → boqLines.
  const lineById = new Map(boqLines.map((l) => [l.id, l]));
  const needs: NeedDraft[] = [];
  for (const t of tasks) {
    if (t.status === "done") continue;
    for (const lineId of t.boqLineIds) {
      const line = lineById.get(lineId);
      if (!line) continue; // task references a line that's not in BoQ (yet)
      if (isLineCovered(line.id, callOffs)) continue;
      needs.push({ line, needed_on: t.start, source_task: t.id });
    }
  }

  // 2) Group by supplier (or "__unassigned__" when no pick exists).
  type Bucket = {
    supplier: string;
    supplierMissing: boolean;
    items: NeedDraft[];
  };
  const buckets = new Map<string, Bucket>();
  for (const need of needs) {
    const supplier =
      need.line.selectedSupplier ?? supplierChoices[need.line.material] ?? "";
    const key = supplier || "__unassigned__";
    let b = buckets.get(key);
    if (!b) {
      b = { supplier: supplier || "Needs supplier", supplierMissing: !supplier, items: [] };
      buckets.set(key, b);
    }
    b.items.push(need);
  }

  // 3) Coalesce per supplier on `needed_on` proximity (window days).
  const proposals: CallOffProposal[] = [];
  for (const bucket of buckets.values()) {
    const sorted = [...bucket.items].sort((a, b) =>
      a.needed_on < b.needed_on ? -1 : a.needed_on > b.needed_on ? 1 : 0,
    );
    let batch: NeedDraft[] = [];
    let batchStart = "";
    const flush = () => {
      if (batch.length === 0) return;
      proposals.push(
        buildProposal(bucket.supplier, bucket.supplierMissing, batch, defaultLead, buffer, today, imminentDays, overrides),
      );
      batch = [];
      batchStart = "";
    };
    for (const n of sorted) {
      if (batch.length === 0) {
        batch = [n];
        batchStart = n.needed_on;
      } else if (daysBetween(batchStart, n.needed_on) <= window) {
        batch.push(n);
      } else {
        flush();
        batch = [n];
        batchStart = n.needed_on;
      }
    }
    flush();
  }

  // 4) Apply reorder-point threshold (skip undersized batches).
  const filtered = minBatchQty > 0
    ? proposals.filter((p) => p.lines.reduce((s, l) => s + l.qty, 0) >= minBatchQty)
    : proposals;

  // 5) Sort by urgency (sendBy ascending).
  filtered.sort((a, b) => (a.sendBy < b.sendBy ? -1 : a.sendBy > b.sendBy ? 1 : 0));
  return filtered;
}

function buildProposal(
  supplier: string,
  supplierMissing: boolean,
  batch: NeedDraft[],
  defaultLead: number,
  buffer: number,
  today: Date,
  imminentDays: number = 3,
  overrides: Record<string, number> = {},
): CallOffProposal {
  // Roll up qty per lineId (a line referenced by 2 tasks counts once at full qty).
  const byLine = new Map<string, ProposalLine>();
  let maxLead = 0;
  let neededOn = batch[0].needed_on;
  for (const n of batch) {
    if (n.needed_on < neededOn) neededOn = n.needed_on;
    const override = overrides[n.line.material];
    const leadDays = override ?? n.line.leadTimeDays ?? defaultLead;
    const presumed = override == null && n.line.leadTimeDays == null;
    if (leadDays > maxLead) maxLead = leadDays;
    const existing = byLine.get(n.line.id);
    if (existing) {
      if (!existing.sourceTaskIds.includes(n.source_task)) {
        existing.sourceTaskIds.push(n.source_task);
      }
    } else {
      byLine.set(n.line.id, {
        lineId: n.line.id,
        material: n.line.material,
        qty: n.line.qty,
        unit: n.line.unit,
        sourceTaskIds: [n.source_task],
        leadTimeDays: leadDays,
        leadTimePresumed: presumed,
      });
    }
  }

  const sendBy = addDays(neededOn, -(maxLead + buffer));
  const daysUntilSendBy = daysBetween(toISO(today), sendBy);
  const urgency: ProposalUrgency =
    daysUntilSendBy < 0 ? "overdue" : daysUntilSendBy <= imminentDays ? "imminent" : "ok";

  return {
    key: `${supplier}|${neededOn}`,
    supplier,
    supplierMissing,
    lines: [...byLine.values()],
    neededOn,
    sendBy,
    daysUntilSendBy,
    urgency,
  };
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Acceptance — commits a set of proposals to ProjectData as drafts.
// `edits` lets the dialog override supplier per proposal (used when the
// original was "__unassigned__"). Returns the list of created call-off IDs.
// ---------------------------------------------------------------------------

export type ProposalEdit = { supplier?: string };

export function acceptProposals(
  projectId: string,
  proposals: CallOffProposal[],
  edits: Record<string, ProposalEdit> = {},
): string[] {
  const created: string[] = [];
  for (const p of proposals) {
    const supplier = edits[p.key]?.supplier?.trim() || (p.supplierMissing ? "" : p.supplier);
    if (!supplier) continue; // never write an unassigned draft
    const co = addCallOff(projectId, {
      supplier,
      lineIds: p.lines.map((l) => l.lineId),
      status: "draft",
    });
    created.push(co.id);
  }
  return created;
}

// ---------------------------------------------------------------------------
// Display helpers.
// ---------------------------------------------------------------------------

export function urgencyLabel(u: ProposalUrgency, daysUntilSendBy: number): string {
  if (u === "overdue") {
    const n = Math.abs(daysUntilSendBy);
    return n === 0 ? "Send today" : `${n}d overdue`;
  }
  if (u === "imminent") return `Send in ${Math.max(0, daysUntilSendBy)}d`;
  return `Send in ${daysUntilSendBy}d`;
}

export { parseISO };