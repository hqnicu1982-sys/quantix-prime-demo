import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/projects/fitzrovia/planner")({ component: PlannerPage });

const tasks = [
  { id: "T-101", level: "L4", area: "Bedroom partitions", crew: "Marcin's Crew", start: "08 Apr", end: "24 Apr", progress: 76, status: "behind" as const },
  { id: "T-102", level: "L4", area: "Corridor robust walls", crew: "Marcin's Crew", start: "20 Apr", end: "02 May", progress: 35, status: "on-track" as const },
  { id: "T-103", level: "L5", area: "Bedroom partitions", crew: "Paweł's Crew", start: "22 Apr", end: "10 May", progress: 12, status: "starting" as const },
  { id: "T-104", level: "L5", area: "Ceiling MF grid", crew: "Andy's Tapers", start: "28 Apr", end: "15 May", progress: 0, status: "scheduled" as const },
  { id: "T-105", level: "L6", area: "Shaft walls", crew: "Subcontractor TBC", start: "05 May", end: "20 May", progress: 0, status: "blocked" as const },
  { id: "T-106", level: "All", area: "Tape & joint", crew: "Andy's Tapers", start: "12 May", end: "08 Jun", progress: 0, status: "scheduled" as const },
];

const statusStyle = {
  "on-track": "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  "behind": "bg-[var(--red-500)]/10 text-[var(--red-500)]",
  "starting": "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  "scheduled": "bg-[var(--ink-50)] text-[var(--ink-500)]",
  "blocked": "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

function PlannerPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Programme status" value="+3 d" delta="ahead of baseline" tone="success" trend="up" />
        <Kpi label="Active tasks" value="6" delta="2 starting this week" />
        <Kpi label="Crews on site" value="4" delta="22 operatives" />
        <Kpi label="Blocked" value="1" delta="L6 shaft sub TBC" tone="warning" />
      </div>

      <Card>
        <CardHead
          title="Programme — next 8 weeks"
          subtitle="Tasks linked to BoQ scope and crew assignment"
          right={<Button size="sm" variant="outline" asChild><Link to="/planner">Full planner <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Task</th>
                <th className="px-4 py-2.5 text-left font-semibold">Level</th>
                <th className="px-4 py-2.5 text-left font-semibold">Crew</th>
                <th className="px-4 py-2.5 text-left font-semibold">Window</th>
                <th className="px-4 py-2.5 text-left font-semibold">Progress</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--ink-900)]">{t.area}</p>
                    <p className="font-mono-num text-[11px] text-[var(--ink-500)]">{t.id}</p>
                  </td>
                  <td className="px-4 py-3"><span className="rounded bg-[var(--ink-50)] px-2 py-0.5 text-[11px] font-semibold">{t.level}</span></td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{t.crew}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{t.start} → {t.end}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--ink-50)]">
                        <div className={`h-full ${t.status === "behind" ? "bg-[var(--red-500)]" : "bg-[var(--accent-500)]"}`} style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="font-mono-num text-[11.5px] text-[var(--ink-500)]">{t.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold capitalize ${statusStyle[t.status]}`}>{t.status.replace("-", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
