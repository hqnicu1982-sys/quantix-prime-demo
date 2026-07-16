import { describe, it, expect } from "vitest";
import { can, TIER_CAPS, type Capability } from "./permissions";
import type { Tier } from "./currentUser";

/**
 * Source-of-truth matrix for mutating actions surfaced in the Approval Inbox
 * and across the app. Every entry MUST stay in sync with the gates rendered in
 * the UI. If a UI gate changes, this matrix has to be updated and the
 * corresponding audit script (scripts/audit-rbac.ts) will catch new buttons.
 */
const ACTIONS: Array<{ name: string; cap: Capability }> = [
  { name: "Daily Report · Approve labour", cap: "approve.labour" },
  { name: "Daily Report · Reject labour", cap: "approve.labour" },
  { name: "Daily Report · Submit to Kier", cap: "approve.labour" },
  { name: "Daily Report · Delete entry (others)", cap: "log.labour.others" },
  { name: "Variations · Submit/Approve/Reject/Reopen/Delete", cap: "edit.variations" },
  { name: "Invoices · Mark paid", cap: "sign.invoices" },
  { name: "Invoices · Accept / Dispute / Credit", cap: "sign.invoices" },
  { name: "Invoices · Upload / Reconcile", cap: "sign.invoices" },
  { name: "Call-offs · New call-off", cap: "create.calloffs" },
  { name: "Call-offs · Approve", cap: "approve.calloffs" },
  { name: "BoQ · Edit lines", cap: "edit.boq" },
  { name: "Price lists · Upload", cap: "upload.prices" },
  { name: "Team · Invite / remove / assign", cap: "edit.team" },
  { name: "Team · Edit PW rates", cap: "edit.pwRates" },
  { name: "Settings · Labour rates", cap: "view.settings.labour" },
  { name: "Planner · Edit task", cap: "edit.planner" },
  { name: "Specification · Upload docs / edit notes", cap: "edit.specification" },
];

const TIERS: Tier[] = ["Admin", "Pro Control", "Pro", "Operative"];

describe("RBAC capability matrix", () => {
  it("each tier has a defined capability set", () => {
    for (const tier of TIERS) {
      expect(TIER_CAPS[tier]).toBeDefined();
      expect(Array.isArray(TIER_CAPS[tier])).toBe(true);
    }
  });

  it("Admin has every capability used in the inbox matrix", () => {
    for (const action of ACTIONS) {
      expect(can("Admin", action.cap), `Admin must allow ${action.name}`).toBe(true);
    }
  });

  it("Operative cannot perform any inbox approval action", () => {
    const approvalCaps: Capability[] = [
      "approve.labour", "edit.variations", "sign.invoices",
      "approve.calloffs", "edit.boq", "edit.team", "edit.pwRates",
      "upload.prices",
    ];
    for (const cap of approvalCaps) {
      expect(can("Operative", cap), `Operative must NOT have ${cap}`).toBe(false);
    }
  });

  it("Pro can create call-offs but not approve them, sign invoices, or edit BoQ", () => {
    expect(can("Pro", "create.calloffs")).toBe(true);
    expect(can("Pro", "approve.calloffs")).toBe(false);
    expect(can("Pro", "sign.invoices")).toBe(false);
    expect(can("Pro", "edit.boq")).toBe(false);
    expect(can("Pro", "approve.labour")).toBe(false);
    expect(can("Pro", "edit.variations")).toBe(false);
  });

  it("Pro Control has all approval capabilities except manage.users", () => {
    expect(can("Pro Control", "approve.labour")).toBe(true);
    expect(can("Pro Control", "sign.invoices")).toBe(true);
    expect(can("Pro Control", "approve.calloffs")).toBe(true);
    expect(can("Pro Control", "edit.variations")).toBe(true);
    expect(can("Pro Control", "manage.users")).toBe(false);
  });

  // Snapshot of the full role × action matrix — any drift fails the test
  // and forces a deliberate update.
  it("matches the locked-in role × action matrix", () => {
    const matrix: Record<string, Record<Tier, boolean>> = {};
    for (const action of ACTIONS) {
      matrix[action.name] = {
        Admin: can("Admin", action.cap),
        "Pro Control": can("Pro Control", action.cap),
        Pro: can("Pro", action.cap),
        Operative: can("Operative", action.cap),
      };
    }
    expect(matrix).toMatchInlineSnapshot(`
      {
        "BoQ · Edit lines": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Call-offs · Approve": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Call-offs · New call-off": {
          "Admin": true,
          "Operative": false,
          "Pro": true,
          "Pro Control": true,
        },
        "Daily Report · Approve labour": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Daily Report · Delete entry (others)": {
          "Admin": true,
          "Operative": false,
          "Pro": true,
          "Pro Control": true,
        },
        "Daily Report · Reject labour": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Daily Report · Submit to Kier": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Invoices · Accept / Dispute / Credit": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Invoices · Mark paid": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Invoices · Upload / Reconcile": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Planner · Edit task": {
          "Admin": true,
          "Operative": false,
          "Pro": true,
          "Pro Control": true,
        },
        "Price lists · Upload": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Settings · Labour rates": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Specification · Upload docs / edit notes": {
          "Admin": true,
          "Operative": false,
          "Pro": true,
          "Pro Control": true,
        },
        "Team · Edit PW rates": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
        "Team · Invite / remove / assign": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": false,
        },
        "Variations · Submit/Approve/Reject/Reopen/Delete": {
          "Admin": true,
          "Operative": false,
          "Pro": false,
          "Pro Control": true,
        },
      }
    `);
  });
});