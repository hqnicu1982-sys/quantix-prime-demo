import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { getHealthBadge } from "@/components/HealthBadge";
import { projects, projectsKpi, fmtMoney } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";
import { useCustomProjects } from "@/lib/customProjects";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { useMemo } from "react";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { useAssignments } from "@/lib/labour";

export const Route = createFileRoute("/projects/")({ component: ProjectsList });

function ProjectsList() {
  const custom = useCustomProjects();
  const allProjects = useMemo(() => [...custom, ...projects], [custom]);
  const me = useCurrentUser();
  const canSeeMoney = useCan("view.financials.lite");
  const canSeeAllProjects = useCan("view.financials.lite"); // Pro+ see portfolio; Site User/Operative see only their assignments
  const myAssignments = useAssignments(); // all my assignments across projects
  const myProjectIds = useMemo(
    () => new Set(myAssignments.filter((a) => a.memberId === me.id).map((a) => a.projectId)),
    [myAssignments, me.id],
  );

  const visibleProjects = useMemo(() => {
    if (canSeeAllProjects) return allProjects;
    return allProjects.filter((p) => myProjectIds.has(p.id));
  }, [allProjects, canSeeAllProjects, myProjectIds]);

  const totalValue = useMemo(
    () => visibleProjects.reduce((s, p) => s + p.contractValue, 0),
    [visibleProjects],
  );
  const contractorCount = useMemo(
    () => new Set(visibleProjects.map((p) => p.mainContractor)).size,
    [visibleProjects],
  );

  return (
    <Section
      title={canSeeAllProjects ? "All projects" : "My projects"}
      subtitle={
        canSeeAllProjects
          ? `${visibleProjects.length} projects · ${fmtMoney(totalValue, { compact: true })} pipeline value`
          : `${visibleProjects.length} project${visibleProjects.length === 1 ? "" : "s"} assigned to you`
      }
      right={canSeeAllProjects ? <NewProjectDialog /> : null}
    >
      {canSeeAllProjects && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total contract value" value={fmtMoney(totalValue, { compact: true })} />
          <Kpi label="Weighted margin" value={`${projectsKpi.weightedMargin}%`} delta={`+${projectsKpi.marginDeltaQoQ}pp QoQ`} tone="success" />
          <Kpi label="At-risk projects" value={`${projectsKpi.atRisk}`} delta="Trafalgar · Bermondsey" tone="danger" />
          <Kpi label="Main contractors" value={`${contractorCount}`} />
        </div>
      )}

      {visibleProjects.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-[14px] font-semibold text-[var(--ink-900)]">No projects assigned</p>
          <p className="mt-1 text-[12px] text-[var(--ink-500)]">
            You haven't been assigned to any projects yet. Ask your site manager.
          </p>
        </Card>
      )}

      {visibleProjects.length > 0 && (
      <Card>
        <CardHead title="Projects" subtitle="Click a row for full project detail" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Contract</th>}
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Margin</th>}
                <th className="px-4 py-2.5 text-left font-semibold">Progress</th>
                <th className="px-4 py-2.5 text-left font-semibold">Health</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {visibleProjects.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                      <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                      <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                  {canSeeMoney && (
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>
                  )}
                  {canSeeMoney && (
                    <td className={`px-4 py-3 text-right font-mono-num font-semibold ${p.margin >= 20 ? "text-[var(--green-600)]" : p.margin >= 14 ? "text-[var(--amber-500)]" : "text-[var(--red-500)]"}`}>{p.margin}%</td>
                  )}
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
      )}
    </Section>
  );
}
