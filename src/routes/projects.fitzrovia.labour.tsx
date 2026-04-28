import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useProjectCrews } from "@/lib/labour";

export const Route = createFileRoute("/projects/fitzrovia/labour")({ component: LabourPage });

// Demo planned/actual hours per assignment (keyed by member id).
const HOURS: Record<string, { planned: number; actual: number; complete: number; variance: number }> = {
  mk: { planned: 248, actual: 302, complete: 76, variance: 22 },
  pw: { planned: 320, actual: 142, complete: 38, variance: -8 },
  aj: { planned: 184, actual: 96,  complete: 52, variance: -2 },
  na: { planned: 80,  actual: 76,  complete: 95, variance: -5 },
  sm: { planned: 40,  actual: 38,  complete: 95, variance: -5 },
};

function LabourPage() {
  const projectCrews = useProjectCrews("fitzrovia");
  const crews = projectCrews
    .filter((c) => HOURS[c.assignment.memberId])
    .map((c) => ({
      name: c.crewName,
      role: c.projectRole,
      rate: c.rate,
      ...HOURS[c.assignment.memberId],
    }));

  const totalHours = crews.reduce((s, c) => s + c.actual, 0);
  const totalCost = crews.reduce((s, c) => s + c.actual * c.rate, 0);
  const blendedRate = totalHours > 0 ? totalCost / totalHours : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total hours MTD" value={`${totalHours.toFixed(0)}`} delta={`vs ${crews.reduce((s, c) => s + c.planned, 0)} planned`} tone={totalHours > crews.reduce((s, c) => s + c.planned, 0) ? "warning" : "neutral"} />
        <Kpi label="Labour cost" value={`£${(totalCost / 1000).toFixed(1)}k`} delta="planned × actual hrs" tone="danger" trend="up" />
        <Kpi label="Average rate" value={`£${blendedRate.toFixed(2)}`} delta="weighted blended" />
        <Kpi label="Productivity" value="0.91" delta="m²/hr · target 1.05" tone="warning" />
      </div>

      <Card>
        <CardHead title="Crew performance" subtitle="Planned vs actual hours, by gang" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Crew</th>
                <th className="px-4 py-2.5 text-left font-semibold">Scope</th>
                <th className="px-4 py-2.5 text-right font-semibold">Planned h</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actual h</th>
                <th className="px-4 py-2.5 text-right font-semibold">% complete</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rate £/h</th>
                <th className="px-4 py-2.5 text-right font-semibold">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {crews.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-semibold text-[var(--ink-900)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-500)]">{c.role}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.planned}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.actual}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.complete}%</td>
                  <td className="px-4 py-3 text-right font-mono-num">£{c.rate.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-mono-num font-semibold ${c.variance > 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>
                    {c.variance > 0 ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}
                    {c.variance > 0 ? "+" : ""}{c.variance}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Labour vs BoQ — weekly" subtitle="Cumulative spend trend" />
        <div className="space-y-3 p-5 text-[12.5px]">
          {[
            { wk: "W12", planned: 18.4, actual: 17.8 },
            { wk: "W13", planned: 19.2, actual: 21.4 },
            { wk: "W14", planned: 20.0, actual: 22.4 },
            { wk: "W15 (now)", planned: 20.6, actual: 24.8 },
          ].map((w) => {
            const max = 26;
            return (
              <div key={w.wk}>
                <div className="mb-1 flex justify-between">
                  <span className="font-medium">{w.wk}</span>
                  <span className="font-mono-num">
                    <span className="text-[var(--ink-500)]">£{w.planned.toFixed(1)}k planned</span>
                    <span className="mx-2 text-[var(--ink-200)]">·</span>
                    <span className={w.actual > w.planned ? "font-semibold text-[var(--red-500)]" : "font-semibold text-[var(--green-600)]"}>£{w.actual.toFixed(1)}k actual</span>
                  </span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
                  <div className="absolute inset-y-0 left-0 bg-[var(--ink-500)]/40" style={{ width: `${(w.planned / max) * 100}%` }} />
                  <div className={`absolute inset-y-0 left-0 ${w.actual > w.planned ? "bg-[var(--red-500)]" : "bg-[var(--green-600)]"}`} style={{ width: `${(w.actual / max) * 100}%`, opacity: 0.65 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
