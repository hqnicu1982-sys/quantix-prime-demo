import { describe, expect, it } from "vitest";
import { pickRecommendedAction } from "./recommendedAction";
import { PLANNER_TODAY, addDays, isoDate, type PlannerTask, type TaskBlocker } from "./planner";

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: "T-001",
    projectId: "p1",
    title: "Test",
    level: "L1",
    start: isoDate(PLANNER_TODAY),
    end: addDays(isoDate(PLANNER_TODAY), 3),
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

const matBlocker: TaskBlocker = { type: "material", note: "no call-off" };
const varBlocker: TaskBlocker = { type: "variation", note: "VO pending" };
const predBlocker: TaskBlocker = { type: "predecessor", note: "T-000 not done" };
const labBlocker: TaskBlocker = { type: "labour", note: "crew booked" };

describe("pickRecommendedAction", () => {
  it("returns null when no actionable blockers", () => {
    const r = pickRecommendedAction({
      blockers: [],
      task: task(),
      canEdit: true,
      plannedCost: 1000,
    });
    expect(r).toBeNull();
  });

  it("variation outranks material at equal urgency/impact", () => {
    const r = pickRecommendedAction({
      blockers: [matBlocker, varBlocker],
      task: task(),
      canEdit: true,
      plannedCost: 1000,
    });
    expect(r?.kind).toBe("navigate-variations");
  });

  it("high P&L impact + overdue beats lower-weight variation on low-impact task", () => {
    const overdueHigh = pickRecommendedAction({
      blockers: [matBlocker],
      task: task({ start: addDays(isoDate(PLANNER_TODAY), -10), status: "behind" }),
      canEdit: true,
      plannedCost: 50_000,
    });
    expect(overdueHigh?.urgencyTier).toBe("overdue");
    expect(overdueHigh?.impactTier).toBe("high");
    expect(overdueHigh?.reason).toMatch(/P&L/);
  });

  it("predecessor push only emitted when canEdit + suggestedStart differs", () => {
    const t = task();
    const noEdit = pickRecommendedAction({
      blockers: [predBlocker],
      task: t,
      suggestedStart: addDays(t.start, 2),
      canEdit: false,
      plannedCost: 0,
    });
    expect(noEdit).toBeNull();

    const ok = pickRecommendedAction({
      blockers: [predBlocker],
      task: t,
      suggestedStart: addDays(t.start, 2),
      canEdit: true,
      plannedCost: 0,
    });
    expect(ok?.kind).toBe("push");
  });

  it("labour blocker yields reassign-crew when alone", () => {
    const r = pickRecommendedAction({
      blockers: [labBlocker],
      task: task(),
      canEdit: true,
      plannedCost: 0,
    });
    expect(r?.kind).toBe("reassign-crew");
  });

  it("imminent start adds urgency note", () => {
    const r = pickRecommendedAction({
      blockers: [matBlocker],
      task: task({ start: addDays(isoDate(PLANNER_TODAY), 2) }),
      canEdit: true,
      plannedCost: 1000,
    });
    expect(r?.urgencyTier).toBe("imminent");
    expect(r?.reason).toMatch(/Starts in/);
  });
});