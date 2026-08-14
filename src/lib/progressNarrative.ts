import type { PlannerTask } from "./planner";
import { DELAY_CAUSE_LABEL, type DelayRow, type ProgressRow } from "./progressLog";

// ============================================================================
// Deterministic narrative writer — reads the programme, the delay register and
// the live blockers and composes the report prose in plain contractor English.
// No model call: instant, offline, and always consistent with the data.
// ============================================================================

export type BlockerRow = {
  taskId: string;
  taskTitle: string;
  type: string;
  note: string;
  owner: string;
  action: string;
};

export type NarrativeInput = {
  projectName: string;
  periodLabel: string;
  rows: ProgressRow[];
  delays: DelayRow[];
  blockers: BlockerRow[];
  lookAhead: { task: PlannerTask; ready: boolean }[];
};

function pluralise(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function overallProgress(rows: ProgressRow[]): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length);
}

export function expectedOverall(rows: ProgressRow[]): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + r.expected, 0) / rows.length);
}

export function buildExecutiveSummary(i: NarrativeInput): string[] {
  const { rows, delays, blockers, lookAhead } = i;
  const done = rows.filter((r) => r.status === "done").length;
  const active = rows.filter((r) => r.progress > 0 && r.status !== "done").length;
  const notStarted = rows.length - done - active;
  const actual = overallProgress(rows);
  const expected = expectedOverall(rows);
  const delta = actual - expected;

  const p: string[] = [];

  p.push(
    `${i.projectName} — progress report for ${i.periodLabel.toLowerCase()}. ` +
      `The programme carries ${pluralise(rows.length, "task")}: ${done} complete, ` +
      `${active} in progress and ${notStarted} not yet started. ` +
      `Measured progress across the works is ${actual}% against ${expected}% planned to date, ` +
      (delta >= 2
        ? `so the package is running ${delta} percentage points ahead of programme.`
        : delta <= -2
          ? `a shortfall of ${Math.abs(delta)} percentage points against programme.`
          : `which is in line with programme.`),
  );

  if (delays.length === 0) {
    p.push(
      "No date changes were recorded in this period. All activities are being executed to the dates last issued.",
    );
  } else {
    const totalDays = delays.reduce((s, d) => s + d.daysLost, 0);
    const byCause = new Map<string, number>();
    for (const d of delays) {
      byCause.set(d.cause, (byCause.get(d.cause) ?? 0) + d.daysLost);
    }
    const causeText = list(
      Array.from(byCause.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([c, days]) => `${DELAY_CAUSE_LABEL[c as DelayRow["cause"]].toLowerCase()} (${days}d)`),
    );
    const worst = delays[0];
    p.push(
      `${pluralise(delays.length, "activity", "activities")} moved in this period, ` +
        `accounting for ${pluralise(totalDays, "day")} of slippage. ` +
        `The principal causes were ${causeText}. ` +
        `The single largest movement is ${worst.taskId} ${worst.taskTitle} ` +
        `(${worst.daysLost}d): ${worst.explanation}`,
    );
  }

  if (blockers.length === 0) {
    p.push("There are no open constraints against the works at the date of this report.");
  } else {
    const byType = new Map<string, number>();
    for (const b of blockers) byType.set(b.type, (byType.get(b.type) ?? 0) + 1);
    p.push(
      `${pluralise(blockers.length, "open constraint")} ${blockers.length === 1 ? "is" : "are"} ` +
        `currently recorded against the programme — ` +
        `${list(Array.from(byType.entries()).map(([t, n]) => `${n} ${t}`))}. ` +
        `These are listed in the constraint register below with the action required to clear them; ` +
        `where the action sits with the main contractor, an entitlement to an extension of time is reserved.`,
    );
  }

  const clear = lookAhead.filter((l) => l.ready).length;
  p.push(
    `Look ahead: ${pluralise(lookAhead.length, "activity", "activities")} are scheduled to start in the next ` +
      `two weeks, of which ${clear} ${clear === 1 ? "is" : "are"} clear to proceed and ` +
      `${lookAhead.length - clear} require information, materials or access before mobilisation.`,
  );

  return p;
}

export function explainDelay(d: DelayRow): string {
  return (
    `${d.taskTitle} moved from ${d.originalStart}–${d.originalEnd} to ${d.currentStart}–${d.currentEnd}, ` +
    `a net effect of ${pluralise(d.daysLost, "day")}. ` +
    `Cause recorded as ${DELAY_CAUSE_LABEL[d.cause].toLowerCase()}. ${d.explanation}`
  );
}
