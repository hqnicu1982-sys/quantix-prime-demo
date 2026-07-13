import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Briefcase, UserPlus, CheckCheck, ArrowUpRight, CalendarClock, Trophy,
  ShieldCheck, PackageCheck, Users2, Check, Inbox,
} from "lucide-react";
import { Section, Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/lib/currentUser";
import { useProject } from "@/lib/ProjectContext";
import {
  useAllMyAssignmentTasks, ackAssignmentTask, ackAllForMember,
  type AssignmentTask, type AssignmentTaskRole,
} from "@/lib/myAssignmentTasks";
import { useAwardBaseline } from "@/lib/awardBaseline";
import type { Project } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/my-assignments")({
  head: () => ({
    meta: [
      { title: "My Assignments — Quantix Prime" },
      { name: "description", content: "Projects you have been staffed on — review the baseline, acknowledge and jump in." },
      { property: "og:title", content: "My Assignments — Quantix Prime" },
      { property: "og:description", content: "Your personal feed of awarded projects and role assignments." },
    ],
  }),
  component: MyAssignmentsPage,
});

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

const ROLE_TINT: Record<AssignmentTaskRole, string> = {
  "Project Manager": "bg-[var(--blue-500)]/15 text-[var(--blue-500)] border-[var(--blue-500)]/30",
  "Commercial QS":   "bg-[var(--amber-500)]/15 text-[var(--amber-500)] border-[var(--amber-500)]/30",
  "Site Lead":       "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const STATUS_TONE: Record<string, "success" | "warning" | "info" | "neutral" | "danger"> = {
  active: "success",
  tender: "info",
  awaiting: "warning",
  complete: "neutral",
  lost: "danger",
};

type Group = { key: "new" | "week" | "older"; label: string; rows: AssignmentTask[] };

function groupTasks(tasks: AssignmentTask[]): Group[] {
  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const groups: Group[] = [
    { key: "new", label: "New — awaiting acknowledgement", rows: [] },
    { key: "week", label: "Acknowledged this week", rows: [] },
    { key: "older", label: "Earlier", rows: [] },
  ];
  for (const t of tasks) {
    if (!t.ackAt) groups[0].rows.push(t);
    else if (t.ackAt >= weekAgo) groups[1].rows.push(t);
    else groups[2].rows.push(t);
  }
  return groups.filter((g) => g.rows.length > 0);
}

function MyAssignmentsPage() {
  const me = useCurrentUser();
  const { all } = useProject();
  const [includeAcked, setIncludeAcked] = useState(true);
  const tasks = useAllMyAssignmentTasks(me.id, { includeAcked });
  const navigate = useNavigate();

  const [roleFilter, setRoleFilter] = useState<"all" | AssignmentTaskRole>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const projectsById = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (roleFilter !== "all" && t.role !== roleFilter) return false;
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      return true;
    });
  }, [tasks, roleFilter, projectFilter]);

  // KPIs computed on the ALL data (not the filtered view) so numbers stay stable.
  const kpis = useMemo(() => {
    const unacked = tasks.filter((t) => !t.ackAt).length;
    const monthAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const thisMonth = tasks.filter((t) => t.createdAt >= monthAgo).length;
    const asPm = tasks.filter((t) => t.role === "Project Manager").length;
    const asQs = tasks.filter((t) => t.role === "Commercial QS").length;
    const asSite = tasks.filter((t) => t.role === "Site Lead").length;
    const totalValue = tasks.reduce((sum, t) => sum + (t.contractValue ?? 0), 0);
    return { unacked, thisMonth, asPm, asQs, asSite, totalValue };
  }, [tasks]);

  const groups = useMemo(() => groupTasks(filtered), [filtered]);

  function openProject(t: AssignmentTask) {
    if (!t.ackAt) ackAssignmentTask(t.id);
    navigate({ to: "/projects/$projectId", params: { projectId: t.projectId } });
  }

  function ack(t: AssignmentTask) {
    ackAssignmentTask(t.id);
    toast.success("Acknowledged", { description: t.projectName });
  }

  function markAll() {
    if (kpis.unacked === 0) return;
    ackAllForMember(me.id);
    toast.success(`${kpis.unacked} assignment${kpis.unacked === 1 ? "" : "s"} acknowledged`);
  }

  return (
    <Section
      title="My Assignments"
      subtitle="Projects you have been staffed on — acknowledge, review the baseline, and jump in."
      right={
        <Button variant="outline" size="sm" onClick={markAll} disabled={kpis.unacked === 0}>
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
          Mark all read
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi label="New" value={String(kpis.unacked)} tone={kpis.unacked > 0 ? "info" : "neutral"} delta={kpis.unacked > 0 ? "awaiting ack" : "all caught up"} />
        <Kpi label="This month" value={String(kpis.thisMonth)} tone="neutral" />
        <Kpi label="As PM" value={String(kpis.asPm)} tone="info" />
        <Kpi label="As QS" value={String(kpis.asQs)} tone="warning" />
        <Kpi label="As Site Lead" value={String(kpis.asSite)} tone="success" />
        <Kpi
          label="Contract value"
          value={kpis.totalValue > 0 ? `£${(kpis.totalValue / 1_000_000).toFixed(2)}m` : "—"}
          tone="neutral"
          delta="across your projects"
        />
      </div>

      <Card>
        <CardHead
          title="Assignments"
          subtitle={`${filtered.length} of ${tasks.length} · role, project & scope filters`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Commercial QS">Commercial QS</SelectItem>
                  <SelectItem value="Site Lead">Site Lead</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-8 w-[180px] text-[12px]"><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {Array.from(new Set(tasks.map((t) => t.projectId))).map((pid) => (
                    <SelectItem key={pid} value={pid}>
                      {projectsById.get(pid)?.name ?? tasks.find((t) => t.projectId === pid)?.projectName ?? pid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[var(--ink-200)] px-2 py-1 text-[11.5px] text-[var(--ink-500)] hover:bg-[var(--ink-50)]">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-[var(--accent-500)]"
                  checked={includeAcked}
                  onChange={(e) => setIncludeAcked(e.target.checked)}
                />
                Show acknowledged
              </label>
            </div>
          }
        />

        {tasks.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] text-[var(--ink-500)]">No assignments match these filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--ink-200)]">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center gap-2 bg-[var(--ink-50)]/50 px-5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)]">
                    {g.label}
                  </p>
                  <span className="rounded-full bg-[var(--ink-200)]/60 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-700)]">
                    {g.rows.length}
                  </span>
                </div>
                <div className="divide-y divide-[var(--ink-200)]">
                  {g.rows.map((t) => (
                    <AssignmentRow
                      key={t.id}
                      task={t}
                      project={projectsById.get(t.projectId)}
                      onOpen={() => openProject(t)}
                      onAck={() => ack(t)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}

function AssignmentRow({
  task, project, onOpen, onAck,
}: {
  task: AssignmentTask;
  project: Project | undefined;
  onOpen: () => void;
  onAck: () => void;
}) {
  const baseline = useAwardBaseline(task.projectId);
  const isNew = !task.ackAt;

  return (
    <div className={cn(
      "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4",
      isNew && "bg-[var(--blue-500)]/[0.04]",
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
        isNew ? "bg-[var(--blue-500)]/15 text-[var(--blue-500)]" : "bg-[var(--ink-100)] text-[var(--ink-500)]",
      )}>
        <Briefcase className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <button
            onClick={onOpen}
            className="text-left text-[14px] font-semibold text-[var(--ink-900)] hover:text-[var(--accent-500)]"
          >
            {project?.name ?? task.projectName}
          </button>
          {project?.status && (
            <StatusBadge tone={STATUS_TONE[project.status] ?? "neutral"} dot>
              {project.status}
            </StatusBadge>
          )}
          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", ROLE_TINT[task.role])}>
            {task.role}
          </span>
          {isNew ? (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--blue-500)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--blue-500)]">
              <UserPlus className="h-3 w-3" /> New
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10.5px] text-[var(--ink-500)]">
              <Check className="h-3 w-3" /> Ack {relativeTime(task.ackAt!)}
            </span>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-[var(--ink-500)] tabular-nums">
            {relativeTime(task.createdAt)}
          </span>
        </div>

        <p className="text-[12.5px] text-[var(--ink-500)]">
          {project?.subtitle ?? "—"}
          {project?.mainContractor && <> · <span className="font-medium text-[var(--ink-700)]">{project.mainContractor}</span></>}
          {task.contractValue ? <> · £{(task.contractValue / 1_000_000).toFixed(2)}m</> : null}
          {" · "}Awarded by {task.assignedBy}
        </p>

        {baseline ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--card)] px-3 py-2 text-[11.5px] text-[var(--ink-700)]">
            <BaselineChip icon={<ShieldCheck className="h-3 w-3" />} label={`Baseline £${(baseline.contractValue / 1_000_000).toFixed(2)}m`} tint="emerald" />
            <BaselineChip icon={<PackageCheck className="h-3 w-3" />} label={`${baseline.boqLineCount} BoQ lines`} />
            <BaselineChip icon={<CalendarClock className="h-3 w-3" />} label={`Frozen ${relativeTime(baseline.frozenAt)} by ${baseline.frozenBy}`} />
            <BaselineChip icon={<Trophy className="h-3 w-3" />} label={`${baseline.estimatedMargin.toFixed(1)}% margin`} />
            <BaselineChip icon={<Users2 className="h-3 w-3" />} label={`${baseline.systemCount} systems`} />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--ink-200)] px-3 py-2 text-[11.5px] text-[var(--ink-500)]">
            No award baseline recorded for this project.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" onClick={onOpen}>
            Open project <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          {isNew && (
            <Button size="sm" variant="outline" onClick={onAck}>
              <Check className="mr-1 h-3.5 w-3.5" /> Acknowledge
            </Button>
          )}
          <Link
            to="/projects/$projectId/team"
            params={{ projectId: task.projectId }}
            className="inline-flex items-center gap-1 rounded border border-[var(--ink-200)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
          >
            <Users2 className="h-3.5 w-3.5" /> Review delivery team
          </Link>
          <Link
            to="/follow-ups"
            className="inline-flex items-center gap-1 rounded border border-[var(--ink-200)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
          >
            <CalendarClock className="h-3.5 w-3.5" /> Follow-ups
          </Link>
        </div>
      </div>
    </div>
  );
}

function BaselineChip({ icon, label, tint }: { icon: React.ReactNode; label: string; tint?: "emerald" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium",
        tint === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          : "border-[var(--ink-200)] bg-[var(--ink-50)] text-[var(--ink-700)]",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink-50)] text-[var(--ink-500)]">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-[14px] font-semibold text-[var(--ink-900)]">No assignments yet</p>
      <p className="max-w-sm text-[12.5px] text-[var(--ink-500)]">
        You'll be notified here the moment a bid you're staffed on is awarded — Project Manager, QS or Site Lead roles all land in this feed.
      </p>
      <Link
        to="/tender-pipeline"
        className="mt-2 inline-flex items-center gap-1 rounded border border-[var(--ink-200)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
      >
        <Briefcase className="h-3.5 w-3.5" /> View Tender Pipeline
      </Link>
    </div>
  );
}