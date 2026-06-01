import type { ProfitForecast } from "./profitForecast";
import { fmtMoney } from "./mockData";

/**
 * Build the subtitle shown under the "Forecast cost (EAC)" KPI.
 *
 * Always lists every non-zero EAC component so the sum visibly matches the
 * headline cost. Components: materials · labour · VOs · overheads · risk.
 * Skips zero components (e.g. fresh import with no labour yet) so the
 * subtitle stays readable. Appends "X% estimat" when part of the cost
 * comes from un-committed estimates.
 *
 * Pure & framework-free → covered by unit tests to prevent UI regressions
 * (e.g. the bug where only `materials · labour` was shown and the numbers
 * appeared to not add up to the EAC).
 */
export function formatForecastCostSubtitle(cost: ProfitForecast["cost"]): string {
  const parts: string[] = [];
  const push = (label: string, value: number) => {
    if (value > 0) parts.push(`${label} ${fmtMoney(value, { compact: true })}`);
  };
  // materials & labour are always shown (even at £0) so the user can see the
  // two primary cost drivers exist; everything else is conditional.
  parts.push(`materials ${fmtMoney(cost.materialsCost, { compact: true })}`);
  parts.push(`labour ${fmtMoney(cost.labourTotal, { compact: true })}`);
  push("VOs", cost.variationCost);
  push("overheads", cost.overheads);
  push("risk", cost.riskBuffer);
  const estPct = Math.round(cost.estimatedCostShare * 100);
  if (estPct > 0) parts.push(`${estPct}% estimat`);
  return parts.join(" · ");
}