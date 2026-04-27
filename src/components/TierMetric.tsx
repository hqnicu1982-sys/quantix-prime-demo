import type { ReactNode } from "react";
import type { Tier } from "@/lib/impact";

export function TierMetric({
  icon,
  label,
  value,
  tier,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tier: Tier;
}) {
  return (
    <span className="tier-chip" data-tier={tier}>
      <span className="tier-dot" />
      {icon}
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}