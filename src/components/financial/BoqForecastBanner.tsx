import { Link } from "@tanstack/react-router";
import { ArrowRight, PiggyBank } from "lucide-react";
import { useProfitForecast, VERDICT_META } from "@/lib/profitForecast";
import { fmtMoney } from "@/lib/mockData";
import { cn } from "@/lib/utils";

/**
 * Compact banner that surfaces the live Profit Forecast on the BoQ page.
 * Materials cost, allocation coverage, and verdict all flow from the same
 * computeProfitForecastFromInputs() the Financial Dashboard uses, so any
 * order / price change here updates the dashboard instantly.
 */
export function BoqForecastBanner({ projectId }: { projectId: string }) {
  const f = useProfitForecast(projectId);
  const meta = VERDICT_META[f.margin.verdict];
  const materialsDelta = f.cost.boqCommitted - f.cost.boqBudget;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3",
        meta.bg,
        meta.border,
      )}
    >
      <div className="flex items-center gap-3">
        <PiggyBank className={cn("h-4 w-4", meta.tone)} />
        <div>
          <p className={cn("text-[12px] font-semibold", meta.tone)}>
            Profit Forecast · {meta.label}
          </p>
          <p className="text-[11px] text-[var(--ink-500)]">
            Materials {fmtMoney(f.cost.materialsCost, { compact: true })} / BoQ {fmtMoney(f.cost.boqBudget, { compact: true })}
            {materialsDelta > 0 && (
              <span className="ml-1 font-semibold text-[var(--red-500)]">
                (+{fmtMoney(materialsDelta, { compact: true })} over budget)
              </span>
            )}
            {" · "}
            {Math.round(f.confidence.boqAllocatedPct)}% BoQ allocated · confidence {f.confidence.score}/100
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Forecast profit</p>
          <p className={cn("font-mono text-[14px] font-semibold tabular-nums", meta.tone)}>
            {fmtMoney(f.margin.forecastProfit, { compact: true })}
            <span className="ml-1 text-[11px] font-medium text-[var(--ink-500)]">
              ({f.margin.forecastMargin.toFixed(1)}%)
            </span>
          </p>
        </div>
        <Link
          to="/financial"
          className="inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--ink-900)] hover:bg-[var(--ink-50)]"
        >
          Open Dashboard <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}