import { describe, it, expect, beforeEach } from "vitest";
import {
  addAttachment,
  getSystemDetails,
  removeAttachment,
  updateNotes,
  MAX_FILE_BYTES,
  MAX_ATTACHMENTS,
} from "./systemDetails";

const PROJECT = "fitzrovia";
const SYS = "GypWall CLASSIC (C-48/70)";

function baseInput(overrides: Partial<Parameters<typeof addAttachment>[2]> = {}) {
  return {
    fileName: "datasheet.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    dataUrl: "data:application/pdf;base64,AAAA",
    category: "datasheet" as const,
    uploadedBy: "Nick Andrei",
    ...overrides,
  };
}

describe("systemDetails storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty details for an unknown system", () => {
    const d = getSystemDetails(PROJECT, SYS);
    expect(d.attachments).toEqual([]);
    expect(d.description).toBeUndefined();
  });

  it("adds and removes an attachment", () => {
    const result = addAttachment(PROJECT, SYS, baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = getSystemDetails(PROJECT, SYS);
    expect(after.attachments).toHaveLength(1);
    expect(after.attachments[0].fileName).toBe("datasheet.pdf");

    removeAttachment(PROJECT, SYS, result.attachment.id);
    expect(getSystemDetails(PROJECT, SYS).attachments).toHaveLength(0);
  });

  it("rejects files larger than MAX_FILE_BYTES", () => {
    const r = addAttachment(PROJECT, SYS, baseInput({ fileSize: MAX_FILE_BYTES + 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("too-large");
  });

  it("enforces the MAX_ATTACHMENTS limit", () => {
    for (let i = 0; i < MAX_ATTACHMENTS; i++) {
      const r = addAttachment(PROJECT, SYS, baseInput({ fileName: `f${i}.pdf` }));
      expect(r.ok).toBe(true);
    }
    const overflow = addAttachment(PROJECT, SYS, baseInput({ fileName: "extra.pdf" }));
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.error).toBe("limit-reached");
  });

  it("persists description and installer notes independently", () => {
    updateNotes(PROJECT, SYS, { description: "Custom build-up." });
    updateNotes(PROJECT, SYS, { installerNotes: "Use 25mm screws on Side A." });
    const d = getSystemDetails(PROJECT, SYS);
    expect(d.description).toBe("Custom build-up.");
    expect(d.installerNotes).toBe("Use 25mm screws on Side A.");
  });

  it("scopes data per project", () => {
    addAttachment(PROJECT, SYS, baseInput());
    expect(getSystemDetails("other-project", SYS).attachments).toHaveLength(0);
  });
});