import { beforeEach, describe, expect, it } from "vitest";
import {
  createApplication,
  issueCertificate,
  recordPayment,
  deleteApplication,
  getApprovedVariationLines,
  clearPaymentCycle,
  previouslyCertifiedLive,
} from "./paymentCycle";
import { addVariation, setStatus, clearProjectVariations } from "./variations";
import {
  getInvoices,
  deleteInvoicesByProject,
} from "./invoiceRegistry";

const PID = "test-pid-cycle";

function reset() {
  // Clear all persistence touched by these tests so each run is isolated.
  clearPaymentCycle(PID);
  clearProjectVariations(PID);
  deleteInvoicesByProject(PID);
}

describe("payment cycle ↔ invoice registry cascade", () => {
  beforeEach(reset);

  it("recordPayment marks the mirrored invoice as paid", () => {
    const app = createApplication({
      projectId: PID,
      periodEnd: "2026-04-30",
      retentionPct: 5,
      previouslyCertified: 0,
      lines: [{ category: "measured_work", description: "L1 partitions", gross: 10000 }],
      status: "submitted",
    });
    const cert = issueCertificate(PID, { applicationId: app.id, finalAmount: 9500 });
    // Simulate the dialog mirroring into the registry (the dialog does this in the real UI).
    // Use addInvoice path the same way IssueNoticeDialogs does:
    // We import lazily to avoid circularity; instead, we invoke addInvoice via dynamic import.
    return import("./invoiceRegistry").then(({ addInvoice }) => {
      addInvoice({
        projectId: PID,
        direction: "receivable",
        counterparty: "Acme MC",
        reference: cert.certificateNumber,
        issued: cert.issuedAt,
        due: app.finalDateForPayment,
        amount: 9500,
        status: "outstanding",
      });
      expect(getInvoices(PID).find((i) => i.reference === cert.certificateNumber)?.status).toBe("outstanding");
      recordPayment(PID, {
        applicationId: app.id,
        certificateId: cert.id,
        paidAt: "2026-05-15",
      });
      const after = getInvoices(PID).find((i) => i.reference === cert.certificateNumber);
      expect(after?.status).toBe("paid");
      expect(after?.paidAt).toBe("2026-05-15");
    });
  });

  it("deleteApplication removes the mirrored invoice", async () => {
    const { addInvoice } = await import("./invoiceRegistry");
    const app = createApplication({
      projectId: PID,
      periodEnd: "2026-04-30",
      retentionPct: 5,
      previouslyCertified: 0,
      lines: [{ category: "measured_work", description: "x", gross: 5000 }],
      status: "submitted",
    });
    const cert = issueCertificate(PID, { applicationId: app.id, finalAmount: 5000 });
    addInvoice({
      projectId: PID, direction: "receivable", counterparty: "Acme",
      reference: cert.certificateNumber, issued: cert.issuedAt,
      due: app.finalDateForPayment, amount: 5000, status: "outstanding",
    });
    expect(getInvoices(PID).some((i) => i.reference === cert.certificateNumber)).toBe(true);
    deleteApplication(PID, app.id);
    expect(getInvoices(PID).some((i) => i.reference === cert.certificateNumber)).toBe(false);
  });

  it("getApprovedVariationLines surfaces approved VOs not yet pulled into an application", () => {
    const v = addVariation(PID, {
      title: "Acoustic upgrade",
      reason: "Client request",
      raisedBy: "client",
      raisedDate: "2026-04-01",
      status: "draft",
      changes: [{ id: "c1", op: "add_line", description: "Acoustic boards", lineTotal: 4200 }],
      timeImpactDays: 0,
      attachments: [],
    });
    setStatus(PID, v.id, "approved", { approvedValue: 4200 });
    const lines = getApprovedVariationLines(PID);
    expect(lines).toHaveLength(1);
    expect(lines[0].voId).toBe(v.id);
    expect(lines[0].gross).toBe(4200);

    // Once included in an application, it disappears from the suggestion list.
    createApplication({
      projectId: PID,
      periodEnd: "2026-04-30",
      retentionPct: 0,
      previouslyCertified: 0,
      lines: [{ category: "variations", description: lines[0].description, gross: 4200 }],
      status: "draft",
    });
    expect(getApprovedVariationLines(PID)).toHaveLength(0);
  });

  it("previouslyCertifiedLive sums certificate finalAmount", () => {
    const a1 = createApplication({
      projectId: PID, periodEnd: "2026-03-31", retentionPct: 0, previouslyCertified: 0,
      lines: [{ category: "measured_work", description: "p1", gross: 1000 }],
      status: "submitted",
    });
    issueCertificate(PID, { applicationId: a1.id, finalAmount: 900 });
    expect(previouslyCertifiedLive(PID)).toBe(900);
  });
});