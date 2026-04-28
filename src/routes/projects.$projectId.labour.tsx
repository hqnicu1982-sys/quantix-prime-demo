import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useProjectCrews } from "@/lib/labour";
import { useLabourLogs, getLastLogDate, getPendingHours } from "@/lib/laborLog";
import { useProjectTasks } from "@/lib/planner";

export const Route = createFileRoute("/projects/$projectId/labour")({ component: LabourPage });

function LabourPage() {
  const { projectId: PID } = Route.useParams();
  const projectCrews = useProjectCrews(PID);
  const logs = useLabourLogs(PID);
  const tasks = useProjectTasks(PID);
  const pendingHours = getPendingHours(PID);
  const approvedLogs = logs.filter((l) => (l.status ?? "submitted") === "approved");

  const crews = projectCrews.map((c) => {
    const memberId = c.assignment.memberId;
    const actual = approvedLogs
      .filter((l) => l.memberId === memberId)
      .reduce((s, l) => s + l.hours, 0);
    const planned = tasks
      .filter((t) => t.crewId === memberId)
      .reduce((s, t) => s + (t.plannedHours ?? 0), 0);
    const complete = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;
    const variance = planned > 0 ? Math.round(((actual - planned) / planned) * 100) : 0;
    const lastLog = getLastLogDate(PID, memberId);
    return {
      name: c.crewName,
      role: c.projectRole,
      rate: c.rate,
      planned,
      actual,
      complete,
      variance,
      lastLog,
    };
  }).filter((c) => c.actual > 0 || c.planned > 0);

  const totalHours = crews.reduce((s, c) => s + c.actual, 0);
  const totalCost = crews.reduce((s, c) => s + c.actual * c.rate, 0);
  const blendedRate = totalHours > 0 ? totalCost / totalHours : 0;
  const totalPlanned = crews.reduce((s, c) => s + c.planned, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total hours MTD"
          value={`${totalHours.toFixed(0)}`}
          delta={totalPlanned > 0 ? `vs ${totalPlanned} planned · approved only` : "approved only"}
          tone={totalPlanned > 0 && totalHours > totalPlanned ? "warning" : "neutral"}
        />
        <Kpi
          label="Labour cost"
          value={`£${(totalCost / 1000).toFixed(1)}k`}
          delta={`from ${approvedLogs.length} approved entries`}
          tone={totalPlanned > 0 && totalHours > totalPlanned ? "danger" : "neutral"}
          trend="up"
        />
        <Kpi label="Average rate" value={`£${blendedRate.toFixed(2)}`} delta="weighted blended" />
        <Kpi
          label={pendingHours > 0 ? "Pending approval" : "Productivity"}
          value={pendingHours > 0 ? `${pendingHours.toFixed(1)}h` : "0.91"}
          delta={pendingHours > 0 ? "review in Daily Report" : "m²/hr · target 1.05"}
          tone={pendingHours > 0 ? "warning" : "warning"}
        />
      </div>

      <Card>
        <CardHead title="Crew performance" subtitle="Live · planned from planner tasks · actual from daily log" />
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
                <th className="px-4 py-2.5 text-right font-semibold">Last log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {crews.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">
                    No labour logged yet. Add entries via the Daily Report.
                  </td>
                </tr>
              )}
              {crews.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-semibold text-[var(--ink-900)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-500)]">{c.role}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.planned || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.actual.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-mono-num">{c.complete}%</td>
                  <td className="px-4 py-3 text-right font-mono-num">£{c.rate.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-mono-num font-semibold ${c.planned === 0 ? "text-[var(--ink-500)]" : c.variance > 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>
                    {c.planned === 0 ? (
                      "—"
                    ) : (
                      <>
                        {c.variance > 0 ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}
                        {c.variance > 0 ? "+" : ""}{c.variance}%
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-[var(--ink-500)]">{c.lastLog ?? "—"}</td>
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
