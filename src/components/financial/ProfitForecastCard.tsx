import { Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { useProfitForecast, VERDICT_META } from "@/lib/profitForecast";
import { fmtMoney } from "@/lib/mockData";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  compact?: boolean;
};

export function ProfitForecastCard({ projectId, compact = false }: Props) {
  const f = useProfitForecast(projectId);
  const v = VERDICT_META[f.margin.verdict];
  const Icon =
    f.margin.verdict === "profit" ? TrendingUp : f.margin.verdict === "tight" ? AlertTriangle : TrendingDown;

  // Stacked breakdown segments (cost composition).
  const segments = [
    { label: "Materials (BoQ)", value: f.cost.materialsCost, color: "var(--accent-500)" },
    { label: "Labour (Planner)", value: f.cost.labourPlanned, color: "var(--navy-700, #1d3557)" },
    { label: "Variations", value: f.cost.variationCost, color: "var(--amber-500)" },
    { label: "Overheads", value: f.cost.overheads, color: "var(--ink-500)" },
    { label: "Risk buffer", value: f.cost.riskBuffer, color: "var(--red-500)" },
  ];
  const segTotal = segments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <Card className={cn("overflow-hidden", v.border, "border-l-[3px]")}>
      <CardHead
        title="Profit forecast at completion"
        subtitle="Combină Contract value · BoQ · Planner · Variations"
        right={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              v.bg,
              v.tone,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {v.label}
          </span>
        }
      />

      <div className="grid gap-4 p-5 md:grid-cols-4">
        <Kpi
          label="Forecast revenue"
          value={fmtMoney(f.revenue.forecastRevenue, { compact: true })}
          sub={
            f.revenue.approvedVOs || f.revenue.pendingVOs
              ? `+${fmtMoney(f.revenue.approvedVOs, { compact: true })} approved · +${fmtMoney(f.revenue.pendingVOs, { compact: true })} pending`
              : "no VOs"
          }
        />
        <Kpi
          label="Forecast cost (EAC)"
          value={fmtMoney(f.cost.forecastCostAtCompletion, { compact: true })}
          sub={`materials ${fmtMoney(f.cost.materialsCost, { compact: true })} · labour ${fmtMoney(f.cost.labourPlanned, { compact: true })}`}
        />
        <Kpi
          label="Forecast profit"
          value={fmtMoney(f.margin.forecastProfit, { compact: true })}
          sub={`${f.margin.forecastMargin.toFixed(1)}% margin vs target ${f.margin.targetMargin.toFixed(1)}%`}
          tone={f.margin.verdict}
        />
        <div className="rounded-md border border-[var(--ink-200)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Confidence</p>
          <p className="font-mono mt-1 text-[22px] font-semibold tabular-nums text-[var(--ink-900)]">
            {f.confidence.score}
            <span className="text-[12px] text-[var(--ink-500)]">/100</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
            <div
              className={cn(
                "h-full rounded-full",
                f.confidence.score >= 70
                  ? "bg-[var(--green-600)]"
                  : f.confidence.score >= 40
                    ? "bg-[var(--amber-500)]"
                    : "bg-[var(--red-500)]",
              )}
              style={{ width: `${f.confidence.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[var(--ink-500)]">{f.confidence.note}</p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="border-t border-[var(--ink-200)] p-5">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Cost breakdown at completion · {fmtMoney(f.cost.forecastCostAtCompletion, { compact: true })}
            </p>
            <div className="flex h-3 overflow-hidden rounded-full bg-[var(--ink-50)]">
              {segments.map((s) => (
                <div
                  key={s.label}
                  title={`${s.label}: ${fmtMoney(s.value, { compact: true })}`}
                  style={{ width: `${(s.value / segTotal) * 100}%`, background: s.color }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--ink-700)]">
              {segments.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                  {s.label} <span className="text-[var(--ink-500)]">{fmtMoney(s.value, { compact: true })}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--ink-200)] p-5">
            <p className="mb-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              <Sparkles className="h-3 w-3" /> Top drivers
            </p>
            <div className="space-y-1.5">
              {f.drivers.length === 0 && (
                <p className="text-[12px] text-[var(--ink-500)]">No notable drivers yet — add planner hours and BoQ allocations.</p>
              )}
              {f.drivers.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[var(--ink-700)]">{d.label}</span>
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      d.deltaMoney > 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]",
                    )}
                  >
                    {d.deltaMoney > 0 ? "+" : ""}
                    {fmtMoney(d.deltaMoney, { compact: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ink-200)] bg-[var(--ink-50)]/60 px-5 py-3">
            <span className="mr-auto text-[11px] text-[var(--ink-500)]">
              BoQ {f.confidence.boqAllocatedPct.toFixed(0)}% allocated · Planner {f.confidence.plannerScheduledPct.toFixed(0)}% scheduled
              {f.confidence.msProjectLinked && " · MSProject baseline"}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to="/projects/$projectId/costed-boq" params={{ projectId }}>
                Open BoQ <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/projects/$projectId/planner" params={{ projectId }}>
                Open Planner <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/projects/$projectId/variations" params={{ projectId }}>
                Review VOs <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "profit" | "tight" | "loss";
}) {
  const toneClass =
    tone === "profit"
      ? "text-[var(--green-600)]"
      : tone === "tight"
        ? "text-[var(--amber-500)]"
        : tone === "loss"
          ? "text-[var(--red-500)]"
          : "text-[var(--ink-900)]";
  return (
    <div className="rounded-md border border-[var(--ink-200)] p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className={cn("font-mono mt-1 text-[22px] font-semibold tabular-nums", toneClass)}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug text-[var(--ink-500)]">{sub}</p>}
    </div>
  );
}