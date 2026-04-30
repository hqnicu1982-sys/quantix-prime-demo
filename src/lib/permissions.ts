import { useCurrentTier, type Tier } from "./currentUser";

// ============================================================================
// Capabilities — single source of truth for what each tier can see/do.
// ============================================================================

export type Capability =
  | "view.financials"        // full P&L, margin, profit
  | "view.financials.lite"   // spent vs budget only
  | "view.boq"
  | "edit.boq"
  | "upload.prices"
  | "view.priceIntel"
  | "view.calloffs"
  | "create.calloffs"
  | "approve.calloffs"
  | "view.invoices"
  | "sign.invoices"
  | "view.planner"
  | "edit.planner"
  | "view.dailyReport"
  | "log.labour"             // log own hours / pw
  | "log.labour.others"      // log on behalf of another member
  | "approve.labour"
  | "view.team"
  | "edit.team"              // invite, change rates, assign
  | "view.pwRates"
  | "edit.pwRates"
  | "manage.users"
  | "view.variations"
  | "edit.variations"
  | "view.integrations"
  | "view.settings.labour"
  | "edit.specification"   // upload/edit/delete system docs & notes
  | "view.payments"              // see Payments tab
  | "create.payment.application" // subbie side: draft & submit AFP
  | "issue.payment.notice"       // MC side: issue Payment Notice / Pay Less / Certificate
  | "record.payment";            // mark certificate as paid / record receipt

export const TIER_CAPS: Record<Tier, Capability[]> = {
  Admin: [
    "view.financials", "view.financials.lite",
    "view.boq", "edit.boq",
    "upload.prices", "view.priceIntel",
    "view.calloffs", "create.calloffs", "approve.calloffs",
    "view.invoices", "sign.invoices",
    "view.planner", "edit.planner",
    "view.dailyReport", "log.labour", "log.labour.others", "approve.labour",
    "view.team", "edit.team",
    "view.pwRates", "edit.pwRates",
    "manage.users",
    "view.variations", "edit.variations",
    "view.integrations",
    "view.settings.labour",
    "edit.specification",
    "view.payments", "create.payment.application", "issue.payment.notice", "record.payment",
  ],
  "Pro Control": [
    "view.financials", "view.financials.lite",
    "view.boq", "edit.boq",
    "upload.prices", "view.priceIntel",
    "view.calloffs", "create.calloffs", "approve.calloffs",
    "view.invoices", "sign.invoices",
    "view.planner", "edit.planner",
    "view.dailyReport", "log.labour", "log.labour.others", "approve.labour",
    "view.team",
    "view.pwRates", "edit.pwRates",
    "view.variations", "edit.variations",
    "view.integrations",
    "view.settings.labour",
    "edit.specification",
    "view.payments", "create.payment.application", "issue.payment.notice",
  ],
  Pro: [
    "view.financials.lite",
    "view.boq",
    "view.priceIntel",
    "view.calloffs", "create.calloffs",
    "view.invoices",
    "view.planner", "edit.planner",
    "view.dailyReport", "log.labour", "log.labour.others",
    "view.team",
    "view.pwRates",
    "view.variations",
    "edit.specification",
    "view.payments",
  ],
  "Site User": [
    "view.planner",
    "view.dailyReport", "log.labour", "log.labour.others",
    "view.team",
    "view.pwRates",
    "view.calloffs",
    "view.payments",
  ],
  Operative: [
    "view.planner",
    "view.dailyReport", "log.labour",
    "view.pwRates",
  ],
};

export function can(tier: Tier, cap: Capability): boolean {
  return TIER_CAPS[tier]?.includes(cap) ?? false;
}

export function useCan(cap: Capability): boolean {
  const tier = useCurrentTier();
  return can(tier, cap);
}

// Tier ordering — for "highest required" copy in NoAccess fallback.
export const TIER_ORDER: Tier[] = ["Operative", "Site User", "Pro", "Pro Control", "Admin"];

export function tiersWithCap(cap: Capability): Tier[] {
  return TIER_ORDER.filter((t) => can(t, cap));
}
