import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { getHealthBadge } from "@/components/HealthBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { projects, projectsKpi, fmtMoney, PROJECT_STAGES, daysSince, daysUntil, type Project, type ProjectStatus } from "@/lib/mockData";
import { ChevronRight, AlertTriangle, TrendingUp } from "lucide-react";
import { useCustomProjects } from "@/lib/customProjects";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { SendQuoteButton, MarkActiveDialog, MarkLostDialog, CloneTenderButton } from "@/components/projects/LifecycleActionDialogs";
import { groupByStatus, isFollowUpOverdue } from "@/lib/projectLifecycle";
import { useMemo } from "react";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { useAssignments } from "@/lib/labour";
import { useProject } from "@/lib/ProjectContext";

const searchSchema = z.object({
  stage: fallback(z.string(), "active").default("active"),
});

export const Route = createFileRoute("/projects/")({
  component: ProjectsList,
  validateSearch: zodValidator(searchSchema),
});

const STAGE_IDS: ProjectStatus[] = ["tender", "awaiting", "active", "lost", "complete"];

function ProjectsList() {
  const rawStage = Route.useSearch().stage;
  const stage: ProjectStatus = (STAGE_IDS as string[]).includes(rawStage) ? (rawStage as ProjectStatus) : "active";
  const navigate = useNavigate();

  const { all } = useProject();
  const custom = useCustomProjects();
  const me = useCurrentUser();
  const canSeeMoney = useCan("view.financials.lite");
  const canSeeAllProjects = useCan("view.financials.lite");
  const myAssignments = useAssignments();
  const myProjectIds = useMemo(
    () => new Set(myAssignments.filter((a) => a.memberId === me.id).map((a) => a.projectId)),
    [myAssignments, me.id],
  );

  // Use ProjectContext-merged list (custom + seed + overrides − hidden).
  const visibleProjects = useMemo(() => {
    if (canSeeAllProjects) return all;
    return all.filter((p) => myProjectIds.has(p.id));
  }, [all, canSeeAllProjects, myProjectIds]);

  const grouped = useMemo(() => groupByStatus(visibleProjects), [visibleProjects]);
  const stageList = grouped[stage];

  const setStage = (s: ProjectStatus) => navigate({ to: "/projects", search: { stage: s } });

  return (
    <Section
      title={canSeeAllProjects ? "All projects" : "My projects"}
      subtitle={
        canSeeAllProjects
          ? `${visibleProjects.length} projects across the lifecycle · ${custom.length ? `${custom.length} custom · ` : ""}${fmtMoney(grouped.active.reduce((s, p) => s + p.contractValue, 0), { compact: true })} active pipeline`
          : `${visibleProjects.length} project${visibleProjects.length === 1 ? "" : "s"} assigned to you`
      }
      right={canSeeAllProjects ? <NewProjectDialog /> : null}
    >
      {/* Lifecycle tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--ink-200)]">
        {PROJECT_STAGES.map((s) => {
          const count = grouped[s.id].length;
          const active = s.id === stage;
          return (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              className={
                "relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-colors " +
                (active
                  ? "text-[var(--ink-900)]"
                  : "text-[var(--ink-500)] hover:text-[var(--ink-700)]")
              }
            >
              <span>{s.label}</span>
              <span
                className={
                  "rounded px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums " +
                  (active ? "bg-[var(--ink-900)] text-white" : "bg-[var(--ink-100)] text-[var(--ink-500)]")
                }
              >
                {count}
              </span>
              {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-[var(--accent-500)]" />}
            </button>
          );
        })}
      </div>

      <StageView stage={stage} list={stageList} canSeeMoney={canSeeMoney} allActive={grouped.active} />
    </Section>
  );
}

function StageView({
  stage, list, canSeeMoney, allActive,
}: {
  stage: ProjectStatus;
  list: Project[];
  canSeeMoney: boolean;
  allActive: Project[];
}) {
  if (list.length === 0) {
    const emptyMap: Record<ProjectStatus, { title: string; hint: string }> = {
      tender:   { title: "No tenders in progress", hint: "Add a project in Tender stage to start pricing." },
      awaiting: { title: "No bids awaiting response", hint: "Bids move here once you send the quote." },
      active:   { title: "No active projects", hint: "Won bids appear here once marked Active." },
      lost:     { title: "No lost bids", hint: "Bids marked as Lost appear here with their reason." },
      complete: { title: "No completed projects", hint: "Delivered projects will be archived here." },
    };
    const e = emptyMap[stage];
    return (
      <Card className="p-10 text-center">
        <p className="text-[14px] font-semibold text-[var(--ink-900)]">{e.title}</p>
        <p className="mt-1 text-[12px] text-[var(--ink-500)]">{e.hint}</p>
      </Card>
    );
  }

  if (stage === "tender")   return <TenderView list={list} canSeeMoney={canSeeMoney} />;
  if (stage === "awaiting") return <AwaitingView list={list} canSeeMoney={canSeeMoney} />;
  if (stage === "lost")     return <LostView list={list} canSeeMoney={canSeeMoney} />;
  if (stage === "complete") return <CompleteView list={list} canSeeMoney={canSeeMoney} />;
  return <ActiveView list={list} canSeeMoney={canSeeMoney} allActive={allActive} />;
}

// ---------------------------------------------------------------- Active (unchanged shape)
function ActiveView({ list, canSeeMoney, allActive }: { list: Project[]; canSeeMoney: boolean; allActive: Project[] }) {
  const totalValue = list.reduce((s, p) => s + p.contractValue, 0);
  const contractorCount = new Set(list.map((p) => p.mainContractor)).size;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total contract value" value={fmtMoney(totalValue, { compact: true })} />
        <Kpi label="Weighted margin" value={`${projectsKpi.weightedMargin}%`} delta={`+${projectsKpi.marginDeltaQoQ}pp QoQ`} tone="success" />
        <Kpi label="At-risk projects" value={`${allActive.filter(p => p.health === "risk").length}`} delta="Trafalgar · Bermondsey" tone="danger" />
        <Kpi label="Main contractors" value={`${contractorCount}`} />
      </div>
      <Card>
        <CardHead title="Active projects" subtitle="Click a row for full project detail" />
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
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                      <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                      <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                  {canSeeMoney && <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>}
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
    </>
  );
}

// ---------------------------------------------------------------- Tender
function TenderView({ list, canSeeMoney }: { list: Project[]; canSeeMoney: boolean }) {
  const bidValue = list.reduce((s, p) => s + p.contractValue, 0);
  const ages = list.map((p) => daysSince(p.quoteSentDate) ?? 0);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Live tenders" value={`${list.length}`} tone="info" />
        {canSeeMoney && <Kpi label="Total bid value" value={fmtMoney(bidValue, { compact: true })} tone="info" />}
        <Kpi label="Avg quote age" value={`${avgAge}d`} delta="since quote sent" />
      </div>
      <Card>
        <CardHead title="Tenders in progress" subtitle="Awaiting quote to be sent to the main contractor" right={<Link to="/tender-pipeline" className="text-[12px] font-semibold text-[var(--accent-500)] hover:underline">Open Pipeline →</Link>} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                <th className="px-4 py-2.5 text-left font-semibold">Quote sent</th>
                <th className="px-4 py-2.5 text-left font-semibold">Response due</th>
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Quote value</th>}
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {list.map((p) => {
                const age = daysSince(p.quoteSentDate);
                const dueIn = daysUntil(p.expectedResponseDate);
                return (
                  <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                    <td className="px-4 py-3">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                        <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                        <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{p.quoteSentDate ?? "—"}{age !== null && <span className="ml-1.5 text-[11px] text-[var(--ink-500)]">({age}d ago)</span>}</td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{p.expectedResponseDate ?? "—"}{dueIn !== null && dueIn >= 0 && <span className="ml-1.5 text-[11px] text-[var(--ink-500)]">(in {dueIn}d)</span>}</td>
                    {canSeeMoney && <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <SendQuoteButton project={p} />
                        <MarkLostDialog project={p} />
                        <CloneTenderButton project={p} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------- Awaiting
function AwaitingView({ list, canSeeMoney }: { list: Project[]; canSeeMoney: boolean }) {
  const pipelineValue = list.reduce((s, p) => s + p.contractValue, 0);
  const overdue = list.filter(isFollowUpOverdue).length;
  const ages = list.map((p) => daysSince(p.quoteSentDate) ?? 0);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Awaiting response" value={`${list.length}`} tone="warning" />
        {canSeeMoney && <Kpi label="Pipeline value" value={fmtMoney(pipelineValue, { compact: true })} tone="warning" />}
        <Kpi label="Follow-ups due" value={`${overdue}`} tone={overdue > 0 ? "danger" : "neutral"} delta={overdue > 0 ? "Overdue — chase today" : "All on schedule"} />
        <Kpi label="Avg quote age" value={`${avgAge}d`} delta="since quote sent" />
      </div>
      <Card>
        <CardHead title="Bids awaiting decision" subtitle="Follow-up reminders flag when overdue" right={<Link to="/tender-pipeline" className="text-[12px] font-semibold text-[var(--accent-500)] hover:underline">Open Pipeline →</Link>} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                <th className="px-4 py-2.5 text-left font-semibold">Quote sent</th>
                <th className="px-4 py-2.5 text-left font-semibold">Follow-up</th>
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Value</th>}
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {list.map((p) => {
                const age = daysSince(p.quoteSentDate);
                const followDays = daysUntil(p.followUpReminderDate);
                const overdue = isFollowUpOverdue(p);
                return (
                  <tr key={p.id} className={"hover:bg-[var(--ink-50)] " + (overdue ? "bg-[var(--red-500)]/[0.04]" : "")}>
                    <td className="px-4 py-3">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                        <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                        <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{p.quoteSentDate ?? "—"}{age !== null && <span className="ml-1.5 text-[11px] text-[var(--ink-500)]">({age}d ago)</span>}</td>
                    <td className="px-4 py-3">
                      {overdue ? (
                        <StatusBadge tone="danger" dot>
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {followDays !== null && followDays < 0 ? `${Math.abs(followDays)}d overdue` : "Chase now"}
                        </StatusBadge>
                      ) : (
                        <span className="text-[var(--ink-700)]">{p.followUpReminderDate ?? "—"}{followDays !== null && followDays >= 0 && <span className="ml-1.5 text-[11px] text-[var(--ink-500)]">(in {followDays}d)</span>}</span>
                      )}
                    </td>
                    {canSeeMoney && <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <MarkActiveDialog project={p} />
                        <MarkLostDialog project={p} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------- Lost
function LostView({ list, canSeeMoney }: { list: Project[]; canSeeMoney: boolean }) {
  const lostValue = list.reduce((s, p) => s + p.contractValue, 0);
  const reasonCounts: Record<string, number> = {};
  for (const p of list) {
    const key = (p.lostReason ?? "Unknown").split(" — ")[0];
    reasonCounts[key] = (reasonCounts[key] ?? 0) + 1;
  }
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Lost bids" value={`${list.length}`} tone="danger" />
        {canSeeMoney && <Kpi label="Lost bid value" value={fmtMoney(lostValue, { compact: true })} tone="danger" />}
        <Kpi label="Top reason" value={topReason} />
      </div>
      <Card>
        <CardHead title="Lost bids" subtitle="Post-mortem — capture reasons to improve win rate" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                <th className="px-4 py-2.5 text-left font-semibold">Reason</th>
                <th className="px-4 py-2.5 text-left font-semibold">Lost to</th>
                <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Bid value</th>}
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                      <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                      <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.lostReason ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.lostToCompetitor ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.lostDate ?? "—"}</td>
                  {canSeeMoney && <td className="px-4 py-3 text-right font-mono-num font-semibold text-[var(--ink-500)]">{fmtMoney(p.contractValue)}</td>}
                  <td className="px-4 py-3 text-right"><CloneTenderButton project={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------- Complete
function CompleteView({ list, canSeeMoney }: { list: Project[]; canSeeMoney: boolean }) {
  const deliveredValue = list.reduce((s, p) => s + p.contractValue, 0);
  const weighted = deliveredValue > 0
    ? list.reduce((s, p) => s + p.margin * p.contractValue, 0) / deliveredValue
    : 0;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Completed" value={`${list.length}`} tone="success" />
        {canSeeMoney && <Kpi label="Delivered value" value={fmtMoney(deliveredValue, { compact: true })} tone="success" />}
        {canSeeMoney && <Kpi label="Weighted margin" value={`${weighted.toFixed(1)}%`} tone="success" trend="up" />}
      </div>
      <Card>
        <CardHead title="Completed projects" subtitle="Archive — final margin and delivery record" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Main contractor</th>
                <th className="px-4 py-2.5 text-left font-semibold">Delivered</th>
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Delivered value</th>}
                {canSeeMoney && <th className="px-4 py-2.5 text-right font-semibold">Margin</th>}
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                      <p className="font-semibold text-[var(--ink-900)]">{p.name}</p>
                      <p className="text-[11.5px] text-[var(--ink-500)]">{p.subtitle}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.mainContractor}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{p.completedDate ?? p.endDate}</td>
                  {canSeeMoney && <td className="px-4 py-3 text-right font-mono-num font-semibold">{fmtMoney(p.contractValue)}</td>}
                  {canSeeMoney && (
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-[var(--green-600)]">{p.margin}%</td>
                  )}
                  <td className="px-4 py-3"><TrendingUp className="h-4 w-4 text-[var(--green-600)]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
