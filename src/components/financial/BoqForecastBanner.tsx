import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
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

  // ------------------------------------------------------------------
  // Live recalculation indicator: pulse + delta whenever materialsCost
  // or forecastProfit shifts (typically after a price or qty edit).
  // ------------------------------------------------------------------
  const prevRef = useRef<{ materials: number; profit: number } | null>(null);
  const [pulse, setPulse] = useState<{
    materialsDelta: number;
    profitDelta: number;
    at: number;
  } | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    const next = { materials: f.cost.materialsCost, profit: f.margin.forecastProfit };
    if (prev && (Math.abs(prev.materials - next.materials) > 0.5 || Math.abs(prev.profit - next.profit) > 0.5)) {
      setPulse({
        materialsDelta: next.materials - prev.materials,
        profitDelta: next.profit - prev.profit,
        at: Date.now(),
      });
    }
    prevRef.current = next;
  }, [f.cost.materialsCost, f.margin.forecastProfit]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 4000);
    return () => clearTimeout(t);
  }, [pulse]);

  const ProfitTrendIcon = pulse && pulse.profitDelta < 0 ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 transition-shadow",
        meta.bg,
        meta.border,
        pulse && "shadow-[0_0_0_3px_var(--accent-500)]/15",
      )}
    >
      {pulse && (
        <span
          key={pulse.at}
          className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--accent-500)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm animate-in fade-in slide-in-from-top-1"
        >
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          Recalculat
        </span>
      )}
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
          {pulse && (
            <p
              key={pulse.at}
              className="mt-0.5 flex items-center gap-2 text-[10.5px] font-medium animate-in fade-in"
            >
              <span className={cn(pulse.materialsDelta >= 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]")}>
                Materials {pulse.materialsDelta >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(pulse.materialsDelta), { compact: true })}
              </span>
              <span className="text-[var(--ink-300)]">·</span>
              <span className={cn("inline-flex items-center gap-0.5", pulse.profitDelta >= 0 ? "text-[var(--green-600)]" : "text-[var(--red-500)]")}>
                <ProfitTrendIcon className="h-2.5 w-2.5" />
                Profit {pulse.profitDelta >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(pulse.profitDelta), { compact: true })}
              </span>
            </p>
          )}
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