import { useState } from "react";
import { UserPlus, ArrowUpRight, CheckCheck, Briefcase } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentUser } from "@/lib/currentUser";
import { useMyAssignmentTasks, ackAssignmentTask, ackAllForMember } from "@/lib/myAssignmentTasks";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const ROLE_TINT: Record<string, string> = {
  "Project Manager": "bg-[var(--blue-500)]/20 text-[var(--blue-500)]",
  "Commercial QS":   "bg-[var(--amber-500)]/20 text-[var(--amber-500)]",
  "Site Lead":       "bg-emerald-500/20 text-emerald-400",
};

export function HeaderAssignmentBell() {
  const me = useCurrentUser();
  const tasks = useMyAssignmentTasks(me.id);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const has = tasks.length > 0;

  function openProject(projectId: string, taskId: string) {
    ackAssignmentTask(taskId);
    setOpen(false);
    navigate({ to: "/projects/$projectId", params: { projectId } });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
          aria-label={`New assignments · ${tasks.length}`}
        >
          <UserPlus className={cn("h-4 w-4", has && "text-[var(--blue-500)]")} />
          {has && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--blue-500)] px-1 text-[9px] font-bold leading-none tabular-nums text-white">
              {tasks.length}
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
            My new assignments
          </p>
          {has && (
            <button
              onClick={() => ackAllForMember(me.id)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/60 hover:bg-white/10 hover:text-white/90"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-6 text-center">
            <p className="text-[11.5px] text-white/70">No new project assignments.</p>
            <p className="mt-0.5 text-[10.5px] text-white/40">You'll be notified here the moment a bid you're staffed on is awarded.</p>
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/15">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => openProject(t.projectId, t.id)}
                className="group flex w-full items-start gap-2.5 rounded-md border border-[var(--blue-500)]/25 bg-[var(--blue-500)]/10 px-2.5 py-2 text-left transition hover:border-[var(--blue-500)]/55 hover:bg-[var(--blue-500)]/15"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--blue-500)]/20 text-[var(--blue-500)]">
                  <Briefcase className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[12px] font-semibold text-white">{t.projectName}</p>
                    <span className="shrink-0 text-[10px] text-white/45 tabular-nums">{relativeTime(t.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide", ROLE_TINT[t.role] ?? "bg-white/10 text-white/80")}>
                      {t.role}
                    </span>
                    <p className="truncate text-[10.5px] text-white/60">
                      Awarded by {t.assignedBy}
                      {t.contractValue ? ` · £${(t.contractValue / 1_000_000).toFixed(2)}m` : ""}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-white/40 group-hover:text-white/70" />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}