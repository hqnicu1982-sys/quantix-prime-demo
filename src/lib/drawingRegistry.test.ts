import { describe, it, expect, beforeEach } from "vitest";
import {
  addRevision,
  approveRevision,
  rejectRevision,
  removeRevision,
  issueTenderSet,
  groupByDrawing,
  getDrawings,
  __resetForTests,
} from "./drawingRegistry";

const P = "test-proj";

function base(over: Partial<Parameters<typeof addRevision>[1]> = {}) {
  return {
    drawingNumber: "A-201",
    revisionCode: "T1",
    isTender: true,
    fileName: "A-201-T1.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    dataUrl: "data:application/pdf;base64,xx",
    discipline: "Architect" as const,
    uploadedBy: "Tester",
    ...over,
  };
}

beforeEach(() => __resetForTests(P));

describe("drawingRegistry", () => {
  it("rejects invalid drawing numbers", () => {
    const r = addRevision(P, base({ drawingNumber: "bad" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid-number");
  });

  it("blocks duplicate drawing+revision combinations", () => {
    expect(addRevision(P, base()).ok).toBe(true);
    const dup = addRevision(P, base());
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toBe("duplicate-revision");
  });

  it("issuing tender freezes tender revisions and blocks new tender uploads", () => {
    addRevision(P, base());
    const issued = issueTenderSet(P, "Admin");
    expect(issued.ok).toBe(true);

    const blocked = addRevision(P, base({ revisionCode: "T2" }));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("tender-locked");

    // Deleting a tender revision after lock is blocked.
    const tenderRev = getDrawings(P).revisions[0];
    const del = removeRevision(P, tenderRev.id);
    expect(del.ok).toBe(false);
  });

  it("post-tender revisions enter pending and require change notes", () => {
    addRevision(P, base());
    issueTenderSet(P, "Admin");

    const noNotes = addRevision(P, base({ revisionCode: "C1", isTender: false }));
    expect(noNotes.ok).toBe(false);
    if (!noNotes.ok) expect(noNotes.error).toBe("post-tender-needs-notes");

    const ok = addRevision(P, base({ revisionCode: "C1", isTender: false, changeNotes: "Layout change" }));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.revision.status).toBe("pending");
  });

  it("approval promotes revision and supersedes previous current", () => {
    addRevision(P, base()); // T1 tender, becomes current pre-lock
    issueTenderSet(P, "Admin");
    const c1 = addRevision(P, base({ revisionCode: "C1", isTender: false, changeNotes: "x" }));
    expect(c1.ok).toBe(true);
    if (!c1.ok) return;
    approveRevision(P, c1.revision.id, "PM");

    const group = groupByDrawing(getDrawings(P)).find((g) => g.drawingNumber === "A-201")!;
    expect(group.current?.revisionCode).toBe("C1");
    expect(group.tender?.revisionCode).toBe("T1");
    expect(group.history.find((r) => r.revisionCode === "T1")?.status).toBe("superseded");
  });

  it("rejection leaves current unchanged and stores reason", () => {
    addRevision(P, base());
    issueTenderSet(P, "Admin");
    const c1 = addRevision(P, base({ revisionCode: "C1", isTender: false, changeNotes: "x" }));
    if (!c1.ok) throw new Error("setup");
    rejectRevision(P, c1.revision.id, "PM", "Wrong sheet");

    const rejected = getDrawings(P).revisions.find((r) => r.id === c1.revision.id)!;
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedReason).toBe("Wrong sheet");

    const group = groupByDrawing(getDrawings(P)).find((g) => g.drawingNumber === "A-201")!;
    expect(group.current?.revisionCode).toBe("T1");
  });

  it("issueTenderSet without any tender revisions fails", () => {
    const r = issueTenderSet(P, "Admin");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("no-tender-revisions");
  });
});