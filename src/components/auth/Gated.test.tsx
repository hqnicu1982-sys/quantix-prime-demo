import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Gated } from "./Gated";
import { setCurrentUserId } from "@/lib/currentUser";
import { team } from "@/lib/mockData";
import type { Capability } from "@/lib/permissions";

const userByTier = {
  Admin: team.find((t) => t.tier === "Admin")!.id,
  "Pro Control": team.find((t) => t.tier === "Pro Control")!.id,
  Pro: team.find((t) => t.tier === "Pro")!.id,
  Operative: team.find((t) => t.tier === "Operative")!.id,
};

function asTier(tier: keyof typeof userByTier) {
  setCurrentUserId(userByTier[tier]);
}

beforeEach(() => {
  localStorage.clear();
});

describe("<Gated /> per-role rendering", () => {
  const cases: Array<{
    cap: Capability;
    label: string;
    allowedTiers: Array<keyof typeof userByTier>;
  }> = [
    { cap: "approve.labour", label: "Approve hours", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "sign.invoices", label: "Mark paid", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "edit.variations", label: "Approve variation", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "create.calloffs", label: "New call-off", allowedTiers: ["Admin", "Pro Control", "Pro"] },
    { cap: "approve.calloffs", label: "Approve call-off", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "edit.boq", label: "Edit BoQ line", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "edit.team", label: "Invite member", allowedTiers: ["Admin"] },
    { cap: "edit.pwRates", label: "Edit PW rate", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "upload.prices", label: "Upload prices", allowedTiers: ["Admin", "Pro Control"] },
    { cap: "log.labour.others", label: "Delete other's entry", allowedTiers: ["Admin", "Pro Control", "Pro"] },
  ];

  for (const c of cases) {
    for (const tier of ["Admin", "Pro Control", "Pro", "Operative"] as const) {
      const shouldRender = c.allowedTiers.includes(tier);
      it(`${tier} ${shouldRender ? "sees" : "does NOT see"} "${c.label}" (cap: ${c.cap})`, () => {
        asTier(tier);
        render(
          <Gated cap={c.cap}>
            <button>{c.label}</button>
          </Gated>,
        );
        const btn = screen.queryByRole("button", { name: c.label });
        if (shouldRender) {
          expect(btn).not.toBeNull();
        } else {
          expect(btn).toBeNull();
        }
      });
    }
  }

  it("renders fallback when capability missing", () => {
    asTier("Operative");
    render(
      <Gated cap="sign.invoices" fallback={<span>Read-only</span>}>
        <button>Mark paid</button>
      </Gated>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });

  it("with disable=true, renders children disabled (pointer-events-none)", () => {
    asTier("Operative");
    render(
      <Gated cap="sign.invoices" disable>
        <button>Mark paid</button>
      </Gated>,
    );
    const wrapper = screen.getByRole("button", { name: "Mark paid" }).parentElement;
    expect(wrapper).toHaveAttribute("aria-disabled", "true");
    expect(wrapper?.className).toMatch(/pointer-events-none/);
  });
});