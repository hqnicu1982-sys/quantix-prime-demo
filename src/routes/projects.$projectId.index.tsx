import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { fitzrovia, fitzroviaSystems, fitzroviaHealth, fitzroviaActivity, fmtMoney } from "@/lib/mockData";

export const Route = createFileRoute("/projects/fitzrovia/")({ component: Overview });

function Overview() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Contract" value={fmtMoney(fitzrovia.contractValue, { compact: true })} />
        <Kpi label="Spent" value={fmtMoney(fitzrovia.spent, { compact: true })} delta={`${fitzrovia.spentPct}% of budget`} tone="warning" />
        <Kpi label="Forecast margin" value={`${fitzrovia.forecastMargin}%`} delta={`${fmtMoney(fitzrovia.forecastProfit, { compact: true })} projected profit`} tone="success" />
        <Kpi label="Progress" value={`${fitzrovia.progress}%`} delta={`${fitzrovia.programmeAhead} days ahead of programme`} tone="success" trend="up" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHead title="Three-way cost comparison" subtitle="Estimated → Priced → Actual" />
            <div className="space-y-4 p-5 text-[13px]">
              {[
                { label: "Estimated (BoQ)", value: fitzrovia.estimatedBoq, color: "var(--ink-500)" },
                { label: "Priced (Costed BoQ)", value: fitzrovia.pricedBoq, color: "var(--accent-500)" },
                { label: "Actual to date", value: fitzrovia.actualToDate, color: "var(--green-600)" },
              ].map((r) => {
                const max = fitzrovia.estimatedBoq;
                const pct = (r.value / max) * 100;
                return (
                  <div key={r.label}>
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">{r.label}</span>
                      <span className="font-mono-num font-semibold">{fmtMoney(r.value)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--ink-50)]">
                      <div className="h-full" style={{ width: `${pct}%`, background: r.color }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-md bg-[var(--green-600)]/10 p-3">
                <span className="text-[12px] font-medium text-[var(--green-600)]">Saved vs estimate</span>
                <span className="font-display text-[16px] font-semibold text-[var(--green-600)]">–{fmtMoney(fitzrovia.savedVsEstimate)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Systems on this project" />
            <div className="divide-y divide-[var(--ink-200)]">
              {fitzroviaSystems.map((s) => (
                <div key={s.name} className="flex items-center gap-4 px-5 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold text-white ${
                    s.color === "blue" ? "bg-[var(--accent-500)]" : s.color === "green" ? "bg-[var(--green-600)]" : s.color === "amber" ? "bg-[var(--amber-500)]" : "bg-purple-500"
                  }`}>
                    {s.name.split(" ")[0].slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{s.name}</p>
                    <p className="text-[11.5px] text-[var(--ink-500)]">{s.area} · {fmtMoney(s.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono-num text-[14px] font-semibold ${s.readiness >= 95 ? "text-[var(--green-600)]" : "text-[var(--amber-500)]"}`}>{s.readiness}%</p>
                    <p className="text-[10.5px] text-[var(--ink-500)]">readiness</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead title="Project health" />
            <div className="space-y-4 p-5">
              {fitzroviaHealth.map((h) => (
                <div key={h.label}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="font-medium">{h.label}</span>
                    <span className={`font-mono-num font-semibold ${h.status === "healthy" ? "text-[var(--green-600)]" : h.status === "watch" ? "text-[var(--amber-500)]" : "text-[var(--red-500)]"}`}>{h.value}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
                    <div className={`h-full ${h.status === "healthy" ? "bg-[var(--green-600)]" : h.status === "watch" ? "bg-[var(--amber-500)]" : "bg-[var(--red-500)]"}`} style={{ width: `${h.value}%` }} />
                  </div>
                  <p className="mt-1 text-[10.5px] text-[var(--ink-500)]">{h.note}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Recent activity" />
            <div className="space-y-3 p-5">
              {fitzroviaActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.tone === "success" ? "bg-[var(--green-600)]" : a.tone === "warning" ? "bg-[var(--amber-500)]" : "bg-[var(--accent-500)]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-tight">{a.title}</p>
                    <p className="text-[10.5px] text-[var(--ink-500)]">{a.who} · {a.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/projects/fitzrovia/costed-boq" className="text-[12.5px] font-medium text-[var(--accent-500)] hover:underline">Open Costed BoQ →</Link>
      </div>
    </div>
  );
}
