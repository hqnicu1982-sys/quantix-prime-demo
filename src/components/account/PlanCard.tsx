import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { PlanBadge } from "@/components/PlanBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkspacePlan = {
  plan: "FREE" | "STARTER" | "GROWTH" | "SCALE" | "ENTERPRISE";
  billingSource: "NONE" | "STRIPE" | "INVOICE";
  commitment: "MONTHLY" | "ANNUAL" | null;
  billedPrice: number | null;
  foundingCustomer: boolean;
  renewalDate: string | null;
  endsAt: string | null;
  isAdmin: boolean;
};

const PLAN_LABEL: Record<WorkspacePlan["plan"], string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
  SCALE: "Scale",
  ENTERPRISE: "Enterprise",
};

export function formatPrice(value: number) {
  const hasPence = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: hasPence ? 2 : 0,
  });
}

export const PLAN_PRESETS: { key: string; label: string; value: WorkspacePlan }[] = [
  {
    key: "A",
    label: "A · Free",
    value: { plan: "FREE", billingSource: "NONE", commitment: null, billedPrice: null, foundingCustomer: false, renewalDate: null, endsAt: null, isAdmin: true },
  },
  {
    key: "B",
    label: "B · Starter monthly",
    value: { plan: "STARTER", billingSource: "STRIPE", commitment: "MONTHLY", billedPrice: 399, foundingCustomer: false, renewalDate: "12 Apr 2026", endsAt: null, isAdmin: true },
  },
  {
    key: "C",
    label: "C · Starter annual",
    value: { plan: "STARTER", billingSource: "STRIPE", commitment: "ANNUAL", billedPrice: 319, foundingCustomer: false, renewalDate: "12 Mar 2027", endsAt: null, isAdmin: true },
  },
  {
    key: "D",
    label: "D · Growth founding",
    value: { plan: "GROWTH", billingSource: "STRIPE", commitment: "ANNUAL", billedPrice: 559.3, foundingCustomer: true, renewalDate: "12 Mar 2027", endsAt: null, isAdmin: true },
  },
  {
    key: "E",
    label: "E · Growth ending",
    value: { plan: "GROWTH", billingSource: "STRIPE", commitment: "ANNUAL", billedPrice: 799, foundingCustomer: false, renewalDate: null, endsAt: "12 Mar 2027", isAdmin: false },
  },
  {
    key: "F",
    label: "F · Scale invoice",
    value: { plan: "SCALE", billingSource: "INVOICE", commitment: "ANNUAL", billedPrice: 1999, foundingCustomer: false, renewalDate: "12 Mar 2027", endsAt: null, isAdmin: true },
  },
  {
    key: "G",
    label: "G · Starter no billing",
    value: { plan: "STARTER", billingSource: "NONE", commitment: null, billedPrice: null, foundingCustomer: false, renewalDate: "12 Mar 2027", endsAt: null, isAdmin: true },
  },
];

export function PlanCard({ workspacePlan }: { workspacePlan: WorkspacePlan }) {
  const p = workspacePlan;
  const showPrice = p.billingSource !== "NONE" && p.billedPrice != null;

  return (
    <Card>
      <CardHead title="Plan" subtitle="What your workspace includes today" />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <PlanBadge plan={PLAN_LABEL[p.plan]} />
          {p.foundingCustomer && <StatusBadge tone="success">Founding customer</StatusBadge>}
          {p.commitment && (
            <StatusBadge tone="neutral">{p.commitment === "ANNUAL" ? "Annual" : "Monthly"}</StatusBadge>
          )}
        </div>

        {showPrice && (
          <p className="text-[13px] text-[var(--ink-700)]">
            £{formatPrice(p.billedPrice!)}/mo ·{" "}
            {p.commitment === "ANNUAL" ? "billed annually" : "billed monthly"} · prices exclude VAT
          </p>
        )}

        {p.endsAt ? (
          <p className="text-[12px] font-medium text-[var(--amber-500)]">Ends {p.endsAt}</p>
        ) : p.renewalDate ? (
          <p className="text-[12px] text-[var(--ink-500)]">Renews {p.renewalDate}</p>
        ) : null}

        {p.billingSource === "INVOICE" && (
          <p className="text-[11.5px] text-[var(--ink-500)]">
            Billed by invoice — contact{" "}
            <a
              className="text-[var(--accent-500)] hover:underline"
              href="mailto:support@fixmargin.com?subject=Plan%20change"
            >
              support@fixmargin.com
            </a>{" "}
            to change your plan.
          </p>
        )}

        <div className="flex justify-end">
          {p.plan === "FREE" ? (
            <Button size="sm" asChild>
              <Link to="/pricing">Upgrade</Link>
            </Button>
          ) : p.billingSource === "STRIPE" ? (
            p.isAdmin ? (
              <Button size="sm" variant="outline" onClick={() => toast.info("Opening billing portal")}>
                Manage billing
              </Button>
            ) : (
              <p className="text-[11.5px] text-[var(--ink-500)]">Ask an admin to manage billing</p>
            )
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function PlanStateSwitcher({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  if (!import.meta.env.DEV) return null;
  return (
    <div className="rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)] p-2.5">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        Preview billing state
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLAN_PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onSelect(preset.key)}
            className={cn(
              "rounded border px-2 py-1 text-[11.5px] font-medium transition-colors",
              activeKey === preset.key
                ? "border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 text-[var(--accent-500)]"
                : "border-[var(--ink-200)] text-[var(--ink-500)] hover:bg-white",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function usePlanPreset() {
  const [key, setKey] = useState("C");
  const value = PLAN_PRESETS.find((p) => p.key === key)!.value;
  return { key, setKey, value };
}
