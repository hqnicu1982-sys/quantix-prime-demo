import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { getHealthBadge } from "@/components/HealthBadge";
import { projects, projectsKpi, fmtMoney } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/projects")({ component: ProjectsList });

function ProjectsList() {
  return (
    <Section title="All projects" subtitle="8 active · 2 completed · 1 pre-contract · £8.4m pipeline value">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total contract value" value={fmtMoney(projectsKpi.totalValue, { compact: true })} />
        <Kpi label="Weighted margin" value={`${projectsKpi.weightedMargin}%`} delta={`+${projectsKpi.marginDeltaQoQ}pp QoQ`} tone="success" />
        <Kpi label="At-risk projects" value={`${projectsKpi.atRisk}`} delta="Trafalgar · Bermondsey" tone="danger" />
        <Kpi label="Main contractors" value={`${projectsKpi.mainContractors}`} />
      </div>

      <Card>
        <CardHead title="Projects" subtitle="Click a row for full project detail" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                <th className="px-4 py-2.5 text-right font-semibold">Contract</th>
                <th className="px-4 py-2.5 text-right font-semibold">Margin</th>
                <th className="px-4 py-2.5 text-left font-semibold">Progress</th>
                <th className="px-4 py-2.5 text-left font-semibold">Health</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <Link to={p.id === "fitzrovia" ? "/projects/fitzrovia" : "/projects"} className="block">
                      <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                      <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>
                  <td className={`px-4 py-3 text-right font-mono-num font-semibold ${p.margin >= 20 ? "text-[var(--green-600)]" : p.margin >= 14 ? "text-[var(--amber-500)]" : "text-[var(--red-500)]"}`}>{p.margin}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--ink-50)]">
                        <div className="h-full bg-[var(--accent-500)]" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-mono-num text-[11.5px] text-[var(--ink-500)]">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getHealthBadge(p.health)}</td>
                  <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-[var(--ink-500)]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}
