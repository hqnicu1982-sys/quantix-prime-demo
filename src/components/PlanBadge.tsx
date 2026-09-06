import { cn } from "@/lib/utils";

// Workspace plan — single source of truth for the sidebar footer badge
// and the Account page plan badge (they must stay identical).
export const WORKSPACE_PLAN = {
  name: "Starter" as const,
  commitment: "Annual",
  renewalDate: "12 Mar 2027",
  priceLine: "£319/mo · billed annually · prices exclude VAT",
  foundingCustomer: true,
};

export function PlanBadge({
  className,
  light = false,
  plan,
}: {
  className?: string;
  light?: boolean;
  plan?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider border",
        light
          ? "border-white/20 bg-white/10 text-white/80"
          : "border-[var(--accent-500)]/25 bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
        className,
      )}
    >
      {plan ?? WORKSPACE_PLAN.name}
    </span>
  );
}
