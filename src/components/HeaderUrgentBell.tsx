import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUrgentTasks, UrgentList } from "@/components/SidebarQuickStats";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HeaderUrgentBell() {
  const urgent = useUrgentTasks();
  const critical = urgent.filter((u) => u.severity === "critical").length;
  const [open, setOpen] = useState(false);
  const hasAny = urgent.length > 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
          aria-label={`Notifications · ${urgent.length} urgent`}
        >
          <Bell className="h-4 w-4" />
          {hasAny && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none tabular-nums text-white",
                critical > 0 ? "bg-[var(--red-500)]" : "bg-[var(--ink-500)]",
              )}
            >
              {urgent.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[360px] border-white/10 bg-[var(--navy-950)] p-3 text-white sidebar-dot-pattern"
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            Today's urgent tasks
          </p>
          <span className="text-[10px] text-white/45 tabular-nums">{urgent.length} total · {critical} critical</span>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/15">
          <UrgentList tasks={urgent} onItemClick={() => setOpen(false)} showMoreLink={false} />
        </div>
      </PopoverContent>
    </Popover>
  );
}