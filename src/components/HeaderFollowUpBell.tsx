import { useMemo, useState } from "react";
import { CalendarClock, ArrowUpRight, Mail, Phone, Users, Flame } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProject } from "@/lib/ProjectContext";
import { useAllManualFollowUps } from "@/lib/tenderDetails";
import { isFollowUpOverdue } from "@/lib/projectLifecycle";
import type { Project } from "@/lib/mockData";
import { TenderDetailSheet } from "@/components/projects/TenderDetailSheet";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  projectId: string;
  projectName: string;
  status: Project["status"];
  reason: "no-follow-up" | "reminder-past";
  channel?: "email" | "call" | "meeting";
  note?: string;
  daysLate: number;
  reminderDate?: string;
};

function parseDdMmYyyy(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}
function daysBetween(a: Date, b: Date) {
  const x = new Date(a); x.setHours(0, 0, 0, 0);
  const y = new Date(b); y.setHours(0, 0, 0, 0);
  return Math.floor((y.getTime() - x.getTime()) / 86400000);
}

function useOverdueAlerts(): Alert[] {
  const { all } = useProject();
  const manual = useAllManualFollowUps();

  return useMemo(() => {
    const today = new Date();
    const out: Alert[] = [];

    // (1) Pre-award projects flagged by isFollowUpOverdue
    for (const p of all) {
      if (!isFollowUpOverdue(p)) continue;
      const rem = parseDdMmYyyy(p.followUpReminderDate);
      const qs = parseDdMmYyyy(p.quoteSentDate);
      let daysLate = 0;
      if (rem) daysLate = daysBetween(rem, today);
      else if (qs) daysLate = Math.max(0, daysBetween(qs, today) - 14);
      out.push({
        id: `p-${p.id}`,
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        reason: "no-follow-up",
        daysLate,
        reminderDate: p.followUpReminderDate,
      });
    }

    // (2) Manual follow-ups whose nextReminderDate is past
    const seenProjects = new Set(out.map((a) => a.projectId));
    for (const r of manual) {
      const d = parseDdMmYyyy(r.nextReminderDate);
      if (!d) continue;
      const late = daysBetween(d, today);
      if (late <= 0) continue;
      // Prefer the reminder-past alert over the generic pre-award one
      const idx = out.findIndex((a) => a.projectId === r.projectId);
      if (idx >= 0) out.splice(idx, 1);
      const p = all.find((x) => x.id === r.projectId);
      if (!p) continue;
      out.push({
        id: `r-${r.id}`,
        projectId: r.projectId,
        projectName: p.name,
        status: p.status,
        reason: "reminder-past",
        channel: r.channel,
        note: r.note,
        daysLate: late,
        reminderDate: r.nextReminderDate,
      });
      seenProjects.add(r.projectId);
    }

    return out.sort((a, b) => b.daysLate - a.daysLate);
  }, [all, manual]);
}

const CHANNEL_ICON = { email: Mail, call: Phone, meeting: Users } as const;

export function HeaderFollowUpBell() {
  const alerts = useOverdueAlerts();
  const [open, setOpen] = useState(false);
  const [sheetProject, setSheetProject] = useState<Project | null>(null);
  const { all } = useProject();
  const navigate = useNavigate();

  const critical = alerts.filter((a) => a.daysLate >= 7).length;
  const has = alerts.length > 0;

  function onItemClick(a: Alert) {
    setOpen(false);
    const p = all.find((x) => x.id === a.projectId);
    if (!p) return;
    if (p.status === "tender" || p.status === "awaiting") {
      setSheetProject(p);
    } else {
      navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
            aria-label={`Overdue follow-ups · ${alerts.length}`}
          >
            <CalendarClock className={cn("h-4 w-4", has && "text-[var(--red-500)]")} />
            {has && (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none tabular-nums text-white",
                  critical > 0 ? "bg-[var(--red-500)]" : "bg-amber-500",
                )}
              >
                {alerts.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-[380px] border-white/10 bg-[var(--navy-950)] p-3 text-white sidebar-dot-pattern"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
              Overdue follow-ups
            </p>
            <span className="text-[10px] text-white/45 tabular-nums">
              {alerts.length} total{critical > 0 ? ` · ${critical} critical` : ""}
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-6 text-center">
              <p className="text-[11.5px] text-white/70">All follow-ups on track.</p>
              <p className="mt-0.5 text-[10.5px] text-white/40">No overdue reminders across your pipeline.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/15">
              {alerts.map((a) => {
                const critical = a.daysLate >= 7;
                const Icon = a.channel ? CHANNEL_ICON[a.channel] : Flame;
                return (
                  <button
                    key={a.id}
                    onClick={() => onItemClick(a)}
                    className={cn(
                      "group flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition",
                      critical
                        ? "border-[var(--red-500)]/30 bg-[var(--red-500)]/10 hover:border-[var(--red-500)]/55 hover:bg-[var(--red-500)]/15"
                        : "border-amber-400/25 bg-amber-400/10 hover:border-amber-400/50 hover:bg-amber-400/15",
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded",
                      critical ? "bg-[var(--red-500)]/15 text-[var(--red-500)]" : "bg-amber-400/15 text-amber-300",
                    )}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12px] font-semibold text-white">{a.projectName}</p>
                        <span className={cn(
                          "shrink-0 rounded px-1 py-0.5 text-[9.5px] font-bold tabular-nums",
                          critical ? "bg-[var(--red-500)]/25 text-[var(--red-500)]" : "bg-amber-400/20 text-amber-200",
                        )}>
                          {a.daysLate}d late
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-white/60">
                        {a.reason === "reminder-past"
                          ? `Reminder ${a.reminderDate}${a.note ? ` · ${a.note}` : ""}`
                          : a.reminderDate
                            ? `Reminder set ${a.reminderDate}`
                            : "No follow-up logged since quote sent"}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-white/40 group-hover:text-white/70" />
                  </button>
                );
              })}
            </div>
          )}

          <Link
            to="/follow-ups"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/75 hover:bg-white/10"
          >
            <span>Open full follow-up feed</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </PopoverContent>
      </Popover>

      {sheetProject && (
        <TenderDetailSheet
          project={sheetProject}
          open={!!sheetProject}
          onOpenChange={(v) => { if (!v) setSheetProject(null); }}
        />
      )}
    </>
  );
}