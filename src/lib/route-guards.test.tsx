import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { setCurrentUserId } from "@/lib/currentUser";
import { team } from "@/lib/mockData";
import type { Tier } from "@/lib/currentUser";
import type { Capability } from "@/lib/permissions";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

/**
 * Route guard tests — for every sensitive route × every role, render a
 * minimal Guarded* wrapper and confirm whether <NoAccess /> appears.
 * This is a behavioural mirror of the audit script: same ROUTE_GUARDS map.
 */

const userByTier: Record<Tier, string> = {
  Admin: team.find((t) => t.tier === "Admin")!.id,
  "Pro Control": team.find((t) => t.tier === "Pro Control")!.id,
  Pro: team.find((t) => t.tier === "Pro")!.id,
  : team.find((t) => t.tier ===  && t.status === "active")!.id,
  Operative: team.find((t) => t.tier === "Operative")!.id,
};

const TIERS: Tier[] = ["Admin", "Pro Control", "Pro", "Operative"];

// Mirrors scripts/audit-rbac.mjs ROUTE_GUARDS — single source of intent.
const ROUTE_CAPS: Array<{ route: string; cap: Capability }> = [
  { route: "/financial", cap: "view.financials" },
  { route: "/invoices", cap: "view.invoices" },
  { route: "/calloffs", cap: "view.calloffs" },
  { route: "/variations", cap: "view.variations" },
  { route: "/costed-boq", cap: "view.boq" },
  { route: "/price-intelligence", cap: "view.priceIntel" },
  { route: "/integrations", cap: "view.integrations" },
  { route: "/team", cap: "view.team" },
  { route: "/settings/labour", cap: "view.settings.labour" },
  { route: "/price-lists/upload", cap: "upload.prices" },
  { route: "/projects/$id/costed-boq", cap: "view.boq" },
  { route: "/projects/$id/invoices", cap: "view.invoices" },
  { route: "/projects/$id/variations", cap: "view.variations" },
  { route: "/projects/$id/reports", cap: "view.financials.lite" },
  { route: "/projects/$id/calloffs", cap: "view.calloffs" },
  { route: "/projects/$id/team", cap: "view.team" },
];

// TIER_CAPS lookup re-implemented locally so the test asserts intent
// independently from the production matrix and would catch silent drift.
const EXPECTED_ALLOWED: Record<Capability, Tier[]> = {
  "view.financials":      ["Admin", "Pro Control"],
  "view.financials.lite": ["Admin", "Pro Control", "Pro"],
  "view.boq":             ["Admin", "Pro Control", "Pro"],
  "edit.boq":             ["Admin", "Pro Control"],
  "upload.prices":        ["Admin", "Pro Control"],
  "view.priceIntel":      ["Admin", "Pro Control", "Pro"],
  "view.calloffs":        ["Admin", "Pro Control", "Pro"],
  "create.calloffs":      ["Admin", "Pro Control", "Pro"],
  "approve.calloffs":     ["Admin", "Pro Control"],
  "view.invoices":        ["Admin", "Pro Control", "Pro"],
  "sign.invoices":        ["Admin", "Pro Control"],
  "view.planner":         ["Admin", "Pro Control", "Pro", "Operative"],
  "edit.planner":         ["Admin", "Pro Control", "Pro"],
  "view.dailyReport":     ["Admin", "Pro Control", "Pro", "Operative"],
  "log.labour":           ["Admin", "Pro Control", "Pro", "Operative"],
  "log.labour.others":    ["Admin", "Pro Control", "Pro"],
  "approve.labour":       ["Admin", "Pro Control"],
  "view.team":            ["Admin", "Pro Control", "Pro"],
  "edit.team":            ["Admin"],
  "view.pwRates":         ["Admin", "Pro Control", "Pro", "Operative"],
  "edit.pwRates":         ["Admin", "Pro Control"],
  "manage.users":         ["Admin"],
  "view.variations":      ["Admin", "Pro Control", "Pro"],
  "edit.variations":      ["Admin", "Pro Control"],
  "view.integrations":    ["Admin", "Pro Control"],
  "view.settings.labour": ["Admin", "Pro Control"],
  "edit.specification": ["Admin", "Pro Control", "Pro"],
  "upload.drawings":  ["Admin", "Pro Control", "Pro"],
  "approve.drawings": ["Admin", "Pro Control"],
  "lock.tender":      ["Admin"],
  "unlock.tender":            ["Admin"],
  "withdraw.drawings.own":    ["Admin", "Pro Control", "Pro"],
  "bulk.upload.drawings":     ["Admin", "Pro Control", "Pro"],
  "export.drawings.register": ["Admin", "Pro Control", "Pro"],
  "view.payments":              ["Admin", "Pro Control", "Pro"],
  "create.payment.application": ["Admin", "Pro Control"],
  "issue.payment.notice":       ["Admin", "Pro Control"],
  "record.payment":             ["Admin"],
};

function GuardedProbe({ cap }: { cap: Capability }) {
  const allowed = useCan(cap);
  if (!allowed) return <NoAccess cap={cap} title="Restricted" />;
  return <div data-testid="protected-content">OK</div>;
}

beforeEach(() => {
  localStorage.clear();
});

describe("Route guards — every sensitive route × every role", () => {
  for (const { route, cap } of ROUTE_CAPS) {
    for (const tier of TIERS) {
      const shouldAllow = EXPECTED_ALLOWED[cap].includes(tier);
      it(`${tier} ${shouldAllow ? "can access" : "is blocked from"} ${route} (cap: ${cap})`, () => {
        setCurrentUserId(userByTier[tier]);
        render(<GuardedProbe cap={cap} />);
        if (shouldAllow) {
          expect(screen.getByTestId("protected-content")).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId("protected-content")).toBeNull();
          expect(screen.getByText("Restricted")).toBeInTheDocument();
        }
      });
    }
  }
});