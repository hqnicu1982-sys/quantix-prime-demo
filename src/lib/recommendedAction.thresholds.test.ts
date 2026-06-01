import { describe, expect, it } from "vitest";
import { scoreCandidates } from "./recommendedAction";
import { PLANNER_TODAY, addDays, isoDate, type PlannerTask, type TaskBlocker } from "./planner";

// These tests pin the numeric thresholds advertised in the BlockersPanel "Why?"
// tooltips. If you change the scoring constants, update both the tooltip copy
// and these expectations together.

const TODAY = isoDate(PLANNER_TODAY);

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: "T-001",
    projectId: "p1",
    title: "Test",
    level: "L1",
    start: TODAY,
    end: addDays(TODAY, 1),
    progress: 0,
    status: "scheduled",
    boqLineIds: [],
    calloffIds: [],
    dependsOn: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function only(type: TaskBlocker["type"]): TaskBlocker[] {
  return [{ type, note: "x" }];
}

function scoreOne(args: {
  type: TaskBlocker["type"];
  start?: string;
  status?: PlannerTask["status"];
  plannedCost?: number;
  canEdit?: boolean;
  suggestedStart?: string;
}) {
  const t = task({ start: args.start ?? TODAY, status: args.status ?? "scheduled" });
  const res = scoreCandidates({
    blockers: only(args.type),
    task: t,
    suggestedStart: args.suggestedStart ?? addDays(t.start, 2),
    canEdit: args.canEdit ?? true,
    plannedCost: args.plannedCost ?? 0,
  });
  return res[0];
}

describe("scoring thresholds — Weight tooltip ('Variation 50 · Material 40 · Predecessor 30 · Labour 25')", () => {
  it("variation = 50", () => {
    expect(scoreOne({ type: "variation" }).weightScore).toBe(50);
  });
  it("material = 40", () => {
    expect(scoreOne({ type: "material" }).weightScore).toBe(40);
  });
  it("predecessor = 30", () => {
    expect(scoreOne({ type: "predecessor" }).weightScore).toBe(30);
  });
  it("labour = 25", () => {
    expect(scoreOne({ type: "labour" }).weightScore).toBe(25);
  });
});

describe("scoring thresholds — Urgency tooltip ('overdue 60+ · imminent ≤3d 45 · soon ≤14d 20 · later 5')", () => {
  it("on the day of start → imminent 45", () => {
    const s = scoreOne({ type: "material", start: TODAY });
    expect(s.urgencyTier).toBe("imminent");
    expect(s.urgencyScore).toBe(45);
  });
  it("3 days out → imminent 45 (boundary)", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, 3) });
    expect(s.urgencyTier).toBe("imminent");
    expect(s.urgencyScore).toBe(45);
  });
  it("4 days out → soon 20", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, 4) });
    expect(s.urgencyTier).toBe("soon");
    expect(s.urgencyScore).toBe(20);
  });
  it("14 days out → soon 20 (boundary)", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, 14) });
    expect(s.urgencyTier).toBe("soon");
    expect(s.urgencyScore).toBe(20);
  });
  it("15 days out → later 5", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, 15) });
    expect(s.urgencyTier).toBe("later");
    expect(s.urgencyScore).toBe(5);
  });
  it("1 day overdue → 60 + 4 = 64", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, -1) });
    expect(s.urgencyTier).toBe("overdue");
    expect(s.urgencyScore).toBe(64);
  });
  it("5 days overdue → 60 + 20 = 80", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, -5) });
    expect(s.urgencyScore).toBe(80);
  });
  it("overdue cap: 100 days late → 60 + min(40, 400) = 100", () => {
    const s = scoreOne({ type: "material", start: addDays(TODAY, -100) });
    expect(s.urgencyScore).toBe(100);
  });
});

describe("scoring thresholds — +15 status bonus for 'behind' or 'blocked'", () => {
  it("status 'blocked' adds 15 to a 'later' baseline (5 → 20)", () => {
    const s = scoreOne({
      type: "material",
      start: addDays(TODAY, 30),
      status: "blocked",
    });
    expect(s.urgencyScore).toBe(20);
  });
  it("status 'behind' adds 15 to 'imminent' baseline (45 → 60)", () => {
    const s = scoreOne({ type: "material", start: TODAY, status: "behind" });
    expect(s.urgencyScore).toBe(60);
  });
  it("status 'scheduled' does not add bonus", () => {
    const s = scoreOne({ type: "material", start: TODAY, status: "scheduled" });
    expect(s.urgencyScore).toBe(45);
  });
  it("status 'on-track' does not add bonus", () => {
    const s = scoreOne({ type: "material", start: TODAY, status: "on-track" });
    expect(s.urgencyScore).toBe(45);
  });
});

describe("scoring thresholds — P&L tooltip ('High ≥ £20k → 40 · Medium ≥ £5k → 20 · Low → 5')", () => {
  it("£0 → low 5", () => {
    const s = scoreOne({ type: "material", plannedCost: 0 });
    expect(s.impactTier).toBe("low");
    expect(s.impactScore).toBe(5);
  });
  it("£4,999 → low 5 (just under medium)", () => {
    const s = scoreOne({ type: "material", plannedCost: 4_999 });
    expect(s.impactTier).toBe("low");
    expect(s.impactScore).toBe(5);
  });
  it("£5,000 → medium 20 (boundary)", () => {
    const s = scoreOne({ type: "material", plannedCost: 5_000 });
    expect(s.impactTier).toBe("medium");
    expect(s.impactScore).toBe(20);
  });
  it("£19,999 → medium 20 (just under high)", () => {
    const s = scoreOne({ type: "material", plannedCost: 19_999 });
    expect(s.impactTier).toBe("medium");
    expect(s.impactScore).toBe(20);
  });
  it("£20,000 → high 40 (boundary)", () => {
    const s = scoreOne({ type: "material", plannedCost: 20_000 });
    expect(s.impactTier).toBe("high");
    expect(s.impactScore).toBe(40);
  });
  it("£250,000 → still high 40 (no further scaling)", () => {
    const s = scoreOne({ type: "material", plannedCost: 250_000 });
    expect(s.impactScore).toBe(40);
  });
});

describe("total = weight + urgency + impact (matches popover formula)", () => {
  it("variation, on-day start, £25k → 50 + 45 + 40 = 135", () => {
    const s = scoreOne({ type: "variation", plannedCost: 25_000 });
    expect(s.score).toBe(135);
    expect(s.score).toBe(s.weightScore + s.urgencyScore + s.impactScore);
  });
  it("labour, 30 days out, £0, status blocked → 25 + (5+15) + 5 = 50", () => {
    const s = scoreOne({
      type: "labour",
      start: addDays(TODAY, 30),
      status: "blocked",
      plannedCost: 0,
    });
    expect(s.score).toBe(50);
  });
});