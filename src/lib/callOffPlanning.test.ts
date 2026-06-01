import { describe, it, expect } from "vitest";
import {
  proposeCallOffs,
  isLineCovered,
  DEFAULT_LEAD_DAYS,
  DEFAULT_BUFFER_DAYS,
} from "./callOffPlanning";
import type { PlannerTask } from "./planner";
import type { ProjectBoqLine, ProjectCallOff } from "./projectData";

const TODAY = new Date(2026, 3, 28); // 2026-04-28

function task(over: Partial<PlannerTask> & { id: string; start: string; boqLineIds: string[] }): PlannerTask {
  return {
    projectId: "P1",
    title: over.id,
    level: "L4",
    end: over.start,
    progress: 0,
    status: "scheduled",
    calloffIds: [],
    dependsOn: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  } as PlannerTask;
}

function line(over: Partial<ProjectBoqLine> & { id: string; material: string }): ProjectBoqLine {
  return {
    systemId: "S1",
    qty: 100,
    unit: "m²",
    ...over,
  } as ProjectBoqLine;
}

describe("proposeCallOffs", () => {
  it("returns no proposals when no tasks have BoQ links", () => {
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: [] })];
    expect(proposeCallOffs(tasks, [], [], {}, { today: TODAY })).toEqual([]);
  });

  it("skips lines that are already covered by an existing call-off", () => {
    const lines = [line({ id: "L1", material: "Board", selectedSupplier: "ACME" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const covered: ProjectCallOff[] = [
      { id: "CO-X", createdAt: 0, supplier: "ACME", lineIds: ["L1"], status: "sent" },
    ];
    expect(proposeCallOffs(tasks, lines, covered, {}, { today: TODAY })).toEqual([]);
  });

  it("groups lines by supplier and coalesces within the 5-day window", () => {
    const lines = [
      line({ id: "L1", material: "Board", selectedSupplier: "ACME" }),
      line({ id: "L2", material: "Stud", selectedSupplier: "ACME" }),
      line({ id: "L3", material: "Insulation", selectedSupplier: "ACME" }),
    ];
    const tasks = [
      task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] }),
      task({ id: "T-2", start: "2026-05-12", boqLineIds: ["L2"] }), // within window of T-1
      task({ id: "T-3", start: "2026-05-25", boqLineIds: ["L3"] }), // outside window
    ];
    const p = proposeCallOffs(tasks, lines, [], {}, { today: TODAY });
    expect(p).toHaveLength(2);
    expect(p[0].lines.map((l) => l.lineId).sort()).toEqual(["L1", "L2"]);
    expect(p[1].lines.map((l) => l.lineId)).toEqual(["L3"]);
    expect(p[0].neededOn).toBe("2026-05-10");
  });

  it("computes sendBy using per-line lead time + buffer (uses max lead in the batch)", () => {
    const lines = [
      line({ id: "L1", material: "Board", selectedSupplier: "ACME", leadTimeDays: 7 }),
      line({ id: "L2", material: "Stud", selectedSupplier: "ACME", leadTimeDays: 3 }),
    ];
    const tasks = [
      task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1", "L2"] }),
    ];
    const [p] = proposeCallOffs(tasks, lines, [], {}, { today: TODAY });
    // needed 2026-05-10, max lead 7, buffer 2 → 2026-05-01
    expect(p.sendBy).toBe("2026-05-01");
  });

  it("falls back to default lead time when the BoQ line doesn't have one", () => {
    const lines = [line({ id: "L1", material: "Board", selectedSupplier: "ACME" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const [p] = proposeCallOffs(tasks, lines, [], {}, { today: TODAY });
    expect(p.lines[0].leadTimeDays).toBe(DEFAULT_LEAD_DAYS);
    expect(p.lines[0].leadTimePresumed).toBe(true);
    // 2026-05-10 minus 5 lead minus 2 buffer = 2026-05-03
    expect(p.sendBy).toBe("2026-05-03");
    expect(DEFAULT_BUFFER_DAYS).toBe(2);
  });

  it("flags supplierMissing when neither line nor supplierChoices resolve a supplier", () => {
    const lines = [line({ id: "L1", material: "Board" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const [p] = proposeCallOffs(tasks, lines, [], {}, { today: TODAY });
    expect(p.supplierMissing).toBe(true);
    expect(p.supplier).toBe("Needs supplier");
  });

  it("resolves supplier from supplierChoices map when line.selectedSupplier is empty", () => {
    const lines = [line({ id: "L1", material: "Board" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const [p] = proposeCallOffs(tasks, lines, [], { Board: "ACME" }, { today: TODAY });
    expect(p.supplierMissing).toBe(false);
    expect(p.supplier).toBe("ACME");
  });

  it("classifies urgency (overdue / imminent / ok) based on sendBy vs today", () => {
    const lines = [line({ id: "L1", material: "X", selectedSupplier: "S" })];
    // sendBy = needed_on - 5 - 2 = needed_on - 7
    const overdue = proposeCallOffs(
      [task({ id: "T-1", start: "2026-05-02", boqLineIds: ["L1"] })], // sendBy 2026-04-25, 3d overdue
      lines, [], {}, { today: TODAY },
    )[0];
    const imminent = proposeCallOffs(
      [task({ id: "T-1", start: "2026-05-06", boqLineIds: ["L1"] })], // sendBy 2026-04-29, 1d
      lines, [], {}, { today: TODAY },
    )[0];
    const ok = proposeCallOffs(
      [task({ id: "T-1", start: "2026-05-20", boqLineIds: ["L1"] })], // sendBy 2026-05-13, 15d
      lines, [], {}, { today: TODAY },
    )[0];
    expect(overdue.urgency).toBe("overdue");
    expect(imminent.urgency).toBe("imminent");
    expect(ok.urgency).toBe("ok");
  });

  it("skips done tasks", () => {
    const lines = [line({ id: "L1", material: "X", selectedSupplier: "S" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"], status: "done", progress: 100 })];
    expect(proposeCallOffs(tasks, lines, [], {}, { today: TODAY })).toEqual([]);
  });

  it("de-duplicates lines referenced by two tasks (qty counted once, both tasks attributed)", () => {
    const lines = [line({ id: "L1", material: "Board", selectedSupplier: "ACME" })];
    const tasks = [
      task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] }),
      task({ id: "T-2", start: "2026-05-11", boqLineIds: ["L1"] }),
    ];
    const [p] = proposeCallOffs(tasks, lines, [], {}, { today: TODAY });
    expect(p.lines).toHaveLength(1);
    expect(p.lines[0].sourceTaskIds.sort()).toEqual(["T-1", "T-2"]);
  });
});

describe("isLineCovered", () => {
  it("returns true only when a call-off includes the line id", () => {
    const cos: ProjectCallOff[] = [
      { id: "CO-1", createdAt: 0, supplier: "S", lineIds: ["L1", "L2"], status: "draft" },
    ];
    expect(isLineCovered("L1", cos)).toBe(true);
    expect(isLineCovered("L3", cos)).toBe(false);
  });
});

describe("configurable rules", () => {
  it("applies a per-material lead-time override (precedence over BoQ line)", () => {
    const lines = [
      line({ id: "L1", material: "Board", selectedSupplier: "ACME", leadTimeDays: 3 }),
    ];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const [p] = proposeCallOffs(tasks, lines, [], {}, {
      today: TODAY,
      perMaterialLeadDays: { Board: 10 },
    });
    expect(p.lines[0].leadTimeDays).toBe(10);
    expect(p.lines[0].leadTimePresumed).toBe(false);
    // 2026-05-10 minus 10 lead minus 2 buffer = 2026-04-28
    expect(p.sendBy).toBe("2026-04-28");
  });

  it("filters out proposals under minBatchQty (reorder point)", () => {
    const lines = [
      line({ id: "L1", material: "Board", selectedSupplier: "ACME", qty: 30 }),
      line({ id: "L2", material: "Stud", selectedSupplier: "BETA", qty: 200 }),
    ];
    const tasks = [
      task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] }),
      task({ id: "T-2", start: "2026-05-10", boqLineIds: ["L2"] }),
    ];
    const p = proposeCallOffs(tasks, lines, [], {}, { today: TODAY, minBatchQty: 100 });
    expect(p).toHaveLength(1);
    expect(p[0].supplier).toBe("BETA");
  });

  it("respects a custom imminent window (urgencyImminentDays)", () => {
    const lines = [line({ id: "L1", material: "X", selectedSupplier: "S" })];
    // sendBy = needed_on - 5 - 2 = needed_on - 7 → 2026-05-13 needs 2026-05-06 sendBy = 8d
    const tasks = [task({ id: "T-1", start: "2026-05-13", boqLineIds: ["L1"] })];
    const wide = proposeCallOffs(tasks, lines, [], {}, { today: TODAY, urgencyImminentDays: 10 })[0];
    const narrow = proposeCallOffs(tasks, lines, [], {}, { today: TODAY, urgencyImminentDays: 3 })[0];
    expect(wide.urgency).toBe("imminent");
    expect(narrow.urgency).toBe("ok");
  });

  it("overrides default lead and buffer via assumptions", () => {
    const lines = [line({ id: "L1", material: "X", selectedSupplier: "S" })];
    const tasks = [task({ id: "T-1", start: "2026-05-10", boqLineIds: ["L1"] })];
    const [p] = proposeCallOffs(tasks, lines, [], {}, {
      today: TODAY,
      defaultLeadDays: 10,
      bufferDays: 5,
    });
    // 2026-05-10 minus 10 minus 5 = 2026-04-25
    expect(p.sendBy).toBe("2026-04-25");
  });
});