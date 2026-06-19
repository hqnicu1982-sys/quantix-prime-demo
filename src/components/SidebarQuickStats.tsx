import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck, Receipt, Truck, GitBranch, Banknote, FileSignature,
  CalendarClock, AlertTriangle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { useLabourLogs, computeEntryCost } from "@/lib/laborLog";
import { useInvoices } from "@/lib/invoiceRegistry";
import { useProjectData } from "@/lib/projectData";
import { useProjectVariations } from "@/lib/variations";
import { useProjectTasks } from "@/lib/planner";
import { usePendingNotices } from "@/lib/paymentCycle";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type Severity = "critical" | "warning" | "info";

export type UrgentTask = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  severity: Severity;
  to: string;
  params?: Record<string, string>;
  resolveLabel: string; // short page name where the user resolves it
  /** Lower = more urgent. Negative = already overdue (days past due).
   *  Used as a tiebreaker within the same severity bucket. */
  dueInDays: number;
};

const SEVERITY_STYLE: Record<Severity, { border: string; bg: string; iconBg: string; iconText: string }> = {
  critical: {
    border: "border-[var(--red-500)]/30 hover:border-[var(--red-500)]/55",
    bg: "bg-[var(--red-500)]/10 hover:bg-[var(--red-500)]/15",
    iconBg: "bg-[var(--red-500)]/15",
    iconText: "text-[var(--red-500)]",
  },
  warning: {
    border: "border-amber-400/25 hover:border-amber-400/50",
    bg: "bg-amber-400/10 hover:bg-amber-400/15",
    iconBg: "bg-amber-400/15",
    iconText: "text-amber-300",
  },
  info: {
    border: "border-white/10 hover:border-white/25",
    bg: "bg-white/5 hover:bg-white/10",
    iconBg: "bg-white/10",
    iconText: "text-white/70",
  },
};

const SEV_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

const SEV_GROUP_LABEL: Record<Severity, string> = {
  critical: "Critical · act now",
  warning: "Warning · this week",
  info: "Info · for review",
};

const SEV_GROUP_TONE: Record<Severity, string> = {
  critical: "text-[var(--red-500)]",
  warning: "text-amber-300",
  info: "text-white/45",
};

function dueBadge(days: number): { label: string; tone: string } | null {
  if (!Number.isFinite(days)) return null;
  if (days < 0) return { label: `${Math.abs(days)}d late`, tone: "bg-[var(--red-500)]/20 text-[var(--red-500)]" };
  if (days === 0) return { label: "Today", tone: "bg-amber-400/20 text-amber-200" };
  if (days === 1) return { label: "Tomorrow", tone: "bg-white/10 text-white/70" };
  if (days <= 7) return { label: `${days}d`, tone: "bg-white/10 text-white/65" };
  return null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(iso); due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

/**
 * Computes the urgent task list for the current user / project.
 * Pure data hook — presentation lives in the components below.
 */
export function useUrgentTasks(): UrgentTask[] {
  const { current } = useProject();
  const projectId = current.id;
  const me = useCurrentUser();

  const canApproveLabour = useCan("approve.labour");
  const canApproveCalloffs = useCan("approve.calloffs");
  const canSignInvoices = useCan("sign.invoices");
  const canEditVariations = useCan("edit.variations");
  const canIssueNotice = useCan("issue.payment.notice");
  const canEditPlanner = useCan("edit.planner");
  const canLogLabour = useCan("log.labour");
  const canViewDailyReport = useCan("view.dailyReport");

  const labourLogs = useLabourLogs(projectId);
  const invoices = useInvoices(projectId);
  const data = useProjectData(projectId);
  const variations = useProjectVariations(projectId);
  const tasks = useProjectTasks(projectId);
  const pendingNotices = usePendingNotices(projectId, 7);

  const today = todayISO();
  const tasksByCrew = tasks.filter((t) => t.crewId === me.id);

  const urgent: UrgentTask[] = [];

  if (canApproveLabour) {
    const pending = labourLogs.filter((l) => (l.status ?? "submitted") === "submitted");
    if (pending.length > 0) {
      const totalCost = pending.reduce((s, l) => s + computeEntryCost(l), 0);
      // Oldest pending entry = most overdue
      const oldestDays = Math.min(...pending.map((l) => daysUntil(l.date)));
      urgent.push({
        key: "appr-labour",
        resolveLabel: "Daily Report",
        icon: ClipboardCheck,
        title: `Approve ${pending.length} labour ${pending.length === 1 ? "entry" : "entries"}`,
        meta: `£${totalCost.toFixed(0)} pending`,
        severity: pending.length >= 3 ? "critical" : "warning",
        to: "/daily-report",
        dueInDays: oldestDays,
      });
    }
  }

  if (canApproveCalloffs) {
    const drafts = data.callOffs.filter((c) => c.status === "draft");
    if (drafts.length > 0) {
      urgent.push({
        key: "appr-co",
        resolveLabel: "Call-offs",
        icon: Truck,
        title: `Approve ${drafts.length} call-off draft${drafts.length === 1 ? "" : "s"}`,
        meta: `${drafts.reduce((s, c) => s + c.lineIds.length, 0)} lines waiting`,
        severity: "warning",
        to: "/projects/$projectId/calloffs",
        params: { projectId },
        dueInDays: 1, // soft-due tomorrow
      });
    }
  }

  if (canSignInvoices) {
    const overdue = invoices.filter((i) => i.status === "overdue");
    if (overdue.length > 0) {
      const mostOverdue = Math.min(...overdue.map((i) => daysUntil(i.due)));
      urgent.push({
        key: "inv-overdue",
        resolveLabel: "Invoices",
        icon: Receipt,
        title: `${overdue.length} invoice${overdue.length === 1 ? "" : "s"} overdue`,
        meta: `£${overdue.reduce((s, i) => s + i.amount, 0).toLocaleString("en-GB")}`,
        severity: "critical",
        to: "/invoices",
        dueInDays: mostOverdue,
      });
    }
    const outstandingList = invoices.filter((i) => i.status === "outstanding");
    if (outstandingList.length > 0) {
      const soonest = Math.min(...outstandingList.map((i) => daysUntil(i.due)));
      urgent.push({
        key: "inv-out",
        resolveLabel: "Invoices",
        icon: FileSignature,
        title: `Sign ${outstandingList.length} outstanding invoice${outstandingList.length === 1 ? "" : "s"}`,
        meta: soonest <= 0 ? "Due today" : `Next due in ${soonest}d`,
        severity: "warning",
        to: "/invoices",
        dueInDays: soonest,
      });
    }
  }

  if (canIssueNotice && pendingNotices.length > 0) {
    const noticeDays = pendingNotices.map((a) => daysUntil(a.dueDateForNotice));
    const overdueNotices = noticeDays.filter((d) => d <= 0).length;
    const soonestNotice = Math.min(...noticeDays);
    urgent.push({
      key: "pmt-notice",
      resolveLabel: "Payments",
      icon: Banknote,
      title: overdueNotices > 0
        ? `${overdueNotices} payment notice${overdueNotices === 1 ? "" : "s"} overdue`
        : `${pendingNotices.length} payment notice${pendingNotices.length === 1 ? "" : "s"} due`,
      meta: overdueNotices > 0 ? "Statutory deadline passed" : "Within 7 days",
      severity: overdueNotices > 0 ? "critical" : "warning",
      to: "/projects/$projectId/payments",
      params: { projectId },
      dueInDays: soonestNotice,
    });
  }

  if (canEditVariations) {
    const drafts = variations.filter((v) => v.status === "draft").length;
    if (drafts > 0) {
      urgent.push({
        key: "var-draft",
        resolveLabel: "Variations",
        icon: GitBranch,
        title: `Submit ${drafts} variation draft${drafts === 1 ? "" : "s"}`,
        meta: "Awaiting your action",
        severity: "info",
        to: "/projects/$projectId/variations",
        params: { projectId },
        dueInDays: 7, // soft window
      });
    }
  }

  if (canEditPlanner || tasksByCrew.length > 0) {
    const blocked = tasksByCrew.filter((t) => t.status === "blocked");
    if (blocked.length > 0) {
      const oldestStart = Math.min(...blocked.map((t) => daysUntil(t.start)));
      urgent.push({
        key: "task-blocked",
        resolveLabel: "Planner",
        icon: AlertTriangle,
        title: `${blocked.length} of your task${blocked.length === 1 ? "" : "s"} blocked`,
        meta: blocked[0].title.slice(0, 32),
        severity: "critical",
        to: "/planner",
        dueInDays: oldestStart,
      });
    }
    const behind = tasksByCrew.filter((t) => t.status === "behind");
    if (behind.length > 0) {
      const earliestEnd = Math.min(...behind.map((t) => daysUntil(t.end)));
      urgent.push({
        key: "task-behind",
        resolveLabel: "Planner",
        icon: CalendarClock,
        title: `${behind.length} task${behind.length === 1 ? "" : "s"} behind schedule`,
        meta: behind[0].title.slice(0, 32),
        severity: "warning",
        to: "/planner",
        dueInDays: earliestEnd,
      });
    }
    const startingToday = tasksByCrew.filter(
      (t) => t.start <= today && t.end >= today && (t.status === "starting" || t.status === "scheduled"),
    );
    if (startingToday.length > 0) {
      urgent.push({
        key: "task-today",
        resolveLabel: "Planner",
        icon: CalendarClock,
        title: `${startingToday.length} task${startingToday.length === 1 ? "" : "s"} active today`,
        meta: startingToday[0].title.slice(0, 32),
        severity: "info",
        to: "/planner",
        dueInDays: 0,
      });
    }
  }

  if (canLogLabour && !canApproveLabour) {
    const myToday = labourLogs.filter((l) => l.memberId === me.id && l.date === today);
    if (myToday.length === 0 && canViewDailyReport) {
      urgent.push({
        key: "log-hours",
        resolveLabel: "Daily Report",
        icon: ClipboardCheck,
        title: "Log your hours for today",
        meta: "Daily report not submitted",
        severity: "warning",
        to: "/daily-report",
        dueInDays: 0,
      });
    }
  }

  // Sort by severity first, then by due-date (most overdue first within group)
  urgent.sort((a, b) => {
    const sev = SEV_RANK[a.severity] - SEV_RANK[b.severity];
    if (sev !== 0) return sev;
    return a.dueInDays - b.dueInDays;
  });
  return urgent;
}

/** A single urgent task card. Tone-styled by severity. */
export function UrgentCard({ task, onClick }: { task: UrgentTask; onClick?: () => void }) {
  const s = SEVERITY_STYLE[task.severity];
  const Icon = task.icon;
  const badge = dueBadge(task.dueInDays);
  return (
    <Link
      to={task.to as "/"}
      params={task.params as never}
      onClick={onClick}
      className={cn(
        "group flex items-start gap-2 rounded-md border px-2 py-1.5 transition-colors",
        s.border,
        s.bg,
      )}
    >
      <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded", s.iconBg)}>
        <Icon className={cn("h-3 w-3", s.iconText)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-white">
            {task.title}
          </p>
          {badge && (
            <span className={cn("shrink-0 rounded px-1 py-px text-[8.5px] font-bold uppercase tracking-wider tabular-nums", badge.tone)}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="truncate text-[10px] leading-tight text-white/50">{task.meta}</p>
        <p className="mt-0.5 flex items-center gap-0.5 text-[9.5px] font-medium uppercase tracking-wider text-white/35 transition-colors group-hover:text-white/65">
          Resolve in {task.resolveLabel}
          <ChevronRight className="h-2.5 w-2.5" />
        </p>
      </div>
    </Link>
  );
}

/** List of urgent task cards with severity group headers. */
export function UrgentList({
  tasks,
  onItemClick,
  showMoreLink = true,
}: {
  tasks: UrgentTask[];
  onItemClick?: () => void;
  showMoreLink?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-[10.5px] leading-tight text-white/70">
          All clear — nothing urgent right now.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {tasks.map((u, idx) => {
        const prevSev = idx > 0 ? tasks[idx - 1].severity : null;
        const showHeader = u.severity !== prevSev;
        return (
          <li key={u.key}>
            {showHeader && (
              <p
                className={cn(
                  "px-1 pb-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em]",
                  idx > 0 && "pt-1.5",
                  SEV_GROUP_TONE[u.severity],
                )}
              >
                {SEV_GROUP_LABEL[u.severity]}
              </p>
            )}
            <UrgentCard task={u} onClick={onItemClick} />
          </li>
        );
      })}
      {showMoreLink && (
        <li>
          <Link
            to="/"
            onClick={onItemClick}
            className="flex items-center justify-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-white/50 hover:text-white"
          >
            Open dashboard for full view
          </Link>
        </li>
      )}
    </ul>
  );
}

function UrgentHeader({ total, critical }: { total: number; critical: number }) {
  return (
    <div className="flex items-center justify-between px-1 pb-0.5">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
        Today's urgent tasks
      </p>
      {total > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums",
            critical > 0
              ? "bg-[var(--red-500)]/20 text-[var(--red-500)]"
              : "bg-white/10 text-white/70",
          )}
        >
          {total}
        </span>
      )}
    </div>
  );
}

