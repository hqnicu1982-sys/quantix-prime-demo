import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/currentUser";
import { useAssignments, usePriceWorkRates } from "@/lib/labour";
import { useProjectTasks, STATUS_LABEL, STATUS_TONE, PLANNER_TODAY, parseISO } from "@/lib/planner";
import { useLabourLogs, computeEntryCost } from "@/lib/laborLog";
import { fmtMoney } from "@/lib/mockData";
import { ArrowRight, Hammer, Calendar, Coins, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "What's on my plate today" card for Operative / Pro
 * users. Shows my crew, my active tasks, my PW rates, today's logged work.
 */
export function MyScopeCard({ projectId }: { projectId: string }) {
  const me = useCurrentUser();
  const assignments = useAssignments(projectId);
  const tasks = useProjectTasks(projectId);
  const pwRates = usePriceWorkRates(projectId);
  const logs = useLabourLogs(projectId);

  const myAssignment = assignments.find((a) => a.memberId === me.id);

  const myTasks = useMemo(() => {
    const today = PLANNER_TODAY;
    return tasks
      .filter((t) => t.crewId === me.id && t.status !== "done")
      .sort((a, b) => {
        // active today first, then upcoming
        const aActive = parseISO(a.start) <= today && parseISO(a.end) >= today ? 0 : 1;
        const bActive = parseISO(b.start) <= today && parseISO(b.end) >= today ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.start.localeCompare(b.start);
      })
      .slice(0, 4);
  }, [tasks, me.id]);

  const myTaskIds = new Set(myTasks.map((t) => t.id));
  const myPwRates = pwRates
    .filter((r) => !r.taskId || myTaskIds.has(r.taskId))
    .slice(0, 4);

  const today = new Date().toISOString().slice(0, 10);
  const myLogsToday = logs.filter((l) => l.memberId === me.id && l.date === today);
  const hoursToday = myLogsToday.reduce((s, l) => s + l.hours, 0);
  const earnedToday = myLogsToday.reduce((s, l) => s + computeEntryCost(l), 0);

  const crewLabel = myAssignment?.crewName ?? `${me.name.split(" ")[0]}'s scope`;
  const projectRole = myAssignment?.projectRole ?? me.role;

  return (
    <Card className="overflow-hidden border-l-4 border-l-[var(--accent-500)]">
      <CardHead
        title="Your scope today"
        subtitle={`${crewLabel} · ${projectRole}`}
        right={
          <div className="hidden gap-3 sm:flex">
            <StatBlock icon={<Calendar className="h-3 w-3" />} label="Tasks" value={String(myTasks.length)} />
            <StatBlock icon={<Hammer className="h-3 w-3" />} label="Hours today" value={hoursToday.toFixed(1)} />
            <StatBlock icon={<Coins className="h-3 w-3" />} label="Earned today" value={fmtMoney(earnedToday, { compact: true })} />
          </div>
        }
      />

      <div className="grid gap-0 lg:grid-cols-2">
        {/* Tasks */}
        <div className="border-b border-[var(--ink-200)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            <span>Active tasks</span>
            <Link to="/projects/$projectId/planner" params={{ projectId }} className="text-[var(--accent-500)] hover:underline">
              Open planner →
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="px-5 pb-4 text-[12.5px] text-[var(--ink-500)]">
              No tasks assigned to you on this project yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ink-200)]">
              {myTasks.map((t) => {
                const today = PLANNER_TODAY;
                const active = parseISO(t.start) <= today && parseISO(t.end) >= today;
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="font-mono-num w-12 shrink-0 text-[10.5px] font-semibold text-[var(--ink-500)]">{t.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-[var(--ink-900)]">{t.title}</p>
                      <p className="text-[10.5px] text-[var(--ink-500)]">
                        {t.level}{t.area ? ` · ${t.area}` : ""} · {t.start} → {t.end}
                      </p>
                    </div>
                    <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_TONE[t.status])}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    {active && (
                      <span className="rounded-full bg-[var(--accent-500)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
                        Today
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* PW rates available to me */}
        <div>
          <div className="flex items-center justify-between px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            <span>Available Price Work rates</span>
            <Link to="/projects/$projectId/team" params={{ projectId }} className="text-[var(--accent-500)] hover:underline">
              All rates →
            </Link>
          </div>
          {myPwRates.length === 0 ? (
            <p className="px-5 pb-4 text-[12.5px] text-[var(--ink-500)]">
              No PW rates linked to your tasks. You'll be paid hourly today.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ink-200)]">
              {myPwRates.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="font-mono-num w-20 shrink-0 text-[10.5px] font-semibold text-[var(--ink-500)]">{r.code}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-[var(--ink-900)]">{r.scope}</p>
                  </div>
                  <span className="font-mono-num text-[12.5px] font-semibold text-[var(--green-600)]">
                    {fmtMoney(r.rate)}<span className="text-[10px] font-normal text-[var(--ink-500)]">/{r.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ink-200)] bg-[var(--ink-50)] px-5 py-3">
        <p className="text-[11.5px] text-[var(--ink-500)]">
          {myLogsToday.length === 0
            ? "You haven't logged any work yet today."
            : `${myLogsToday.length} entr${myLogsToday.length === 1 ? "y" : "ies"} logged today · ${hoursToday.toFixed(1)}h · ${fmtMoney(earnedToday)}`}
        </p>
        <Link to="/daily-report">
          <Button size="sm">
            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
            Log my work
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        {icon} {label}
      </p>
      <p className="font-mono-num text-[14px] font-semibold text-[var(--ink-900)]">{value}</p>
    </div>
  );
}
