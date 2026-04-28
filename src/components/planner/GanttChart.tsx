import { useEffect, useMemo, useRef, useState } from "react";
import {
  PLANNER_TODAY,
  STATUS_BAR,
  STATUS_LABEL,
  addDays,
  daysBetween,
  isoDate,
  moveTask,
  parseISO,
  resizeTask,
  type PlannerTask,
} from "@/lib/planner";
import { cn } from "@/lib/utils";

type Zoom = "day" | "week" | "month";
const PX: Record<Zoom, number> = { day: 28, week: 12, month: 4 };

type Props = {
  projectId: string;
  tasks: PlannerTask[];
  zoom?: Zoom;
  onSelectTask?: (id: string) => void;
  highlightCriticalPath?: boolean;
  blockedIds?: Set<string>;
};

export function GanttChart({
  projectId,
  tasks,
  zoom = "day",
  onSelectTask,
  blockedIds,
}: Props) {
  const dayPx = PX[zoom];
  // Window: from min start - 3 days to max end + 7 days
  const { rangeStart, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      return { rangeStart: isoDate(PLANNER_TODAY), totalDays: 30 };
    }
    const starts = tasks.map((t) => parseISO(t.start).getTime());
    const ends = tasks.map((t) => parseISO(t.end).getTime());
    const min = new Date(Math.min(...starts));
    min.setDate(min.getDate() - 3);
    const max = new Date(Math.max(...ends));
    max.setDate(max.getDate() + 7);
    return {
      rangeStart: isoDate(min),
      totalDays: Math.max(14, daysBetween(isoDate(min), isoDate(max)) + 1),
    };
  }, [tasks]);

  const todayOffset = daysBetween(rangeStart, isoDate(PLANNER_TODAY));

  // Build week ticks
  const weekTicks = useMemo(() => {
    const ticks: { offset: number; label: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = parseISO(addDays(rangeStart, i));
      if (d.getDay() === 1 || i === 0) {
        ticks.push({
          offset: i,
          label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        });
      }
    }
    return ticks;
  }, [rangeStart, totalDays]);

  const ROW_H = 38;
  const LABEL_W = 200;
  const chartWidth = totalDays * dayPx;

  // Index for arrow targets
  const taskIndex = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t, i) => m.set(t.id, i));
    return m;
  }, [tasks]);

  // Drag state
  const [drag, setDrag] = useState<{
    id: string;
    mode: "move" | "resize-l" | "resize-r";
    startX: number;
    deltaDays: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX;
      const days = Math.round(dx / dayPx);
      if (days !== drag.deltaDays) setDrag({ ...drag, deltaDays: days });
    };
    const onUp = () => {
      if (drag.deltaDays !== 0) {
        if (drag.mode === "move") moveTask(projectId, drag.id, drag.deltaDays);
        else if (drag.mode === "resize-l")
          resizeTask(projectId, drag.id, "start", drag.deltaDays);
        else resizeTask(projectId, drag.id, "end", drag.deltaDays);
      }
      setDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, dayPx, projectId]);

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <div style={{ minWidth: LABEL_W + chartWidth }}>
        {/* Header */}
        <div className="flex border-b border-[var(--ink-200)] bg-[var(--ink-50)]/50">
          <div
            className="shrink-0 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
            style={{ width: LABEL_W }}
          >
            Task
          </div>
          <div className="relative flex-1" style={{ height: 32 }}>
            {weekTicks.map((tick) => (
              <div
                key={tick.offset}
                className="absolute top-0 h-full border-l border-[var(--ink-200)] pl-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
                style={{ left: tick.offset * dayPx }}
              >
                {tick.label}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="relative">
          {/* Today line */}
          {todayOffset >= 0 && todayOffset <= totalDays && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 w-0 border-l-2 border-dashed border-[var(--accent-500)]"
              style={{ left: LABEL_W + todayOffset * dayPx }}
            >
              <span className="absolute -top-1 -translate-x-1/2 rounded bg-[var(--accent-500)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                Today
              </span>
            </div>
          )}

          {/* Dependency arrows (SVG overlay) */}
          <svg
            className="pointer-events-none absolute inset-0 z-10"
            style={{ left: LABEL_W, width: chartWidth, height: tasks.length * ROW_H }}
          >
            {tasks.map((t, ti) =>
              t.dependsOn.map((depId) => {
                const di = taskIndex.get(depId);
                if (di === undefined) return null;
                const dep = tasks[di];
                const x1 = (daysBetween(rangeStart, dep.end) + 1) * dayPx;
                const y1 = di * ROW_H + ROW_H / 2;
                const x2 = daysBetween(rangeStart, t.start) * dayPx;
                const y2 = ti * ROW_H + ROW_H / 2;
                const midX = Math.max(x1 + 6, x2 - 6);
                return (
                  <g key={`${t.id}-${depId}`}>
                    <path
                      d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                      fill="none"
                      stroke="var(--ink-500)"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <polygon
                      points={`${x2},${y2} ${x2 - 5},${y2 - 3} ${x2 - 5},${y2 + 3}`}
                      fill="var(--ink-500)"
                      opacity={0.6}
                    />
                  </g>
                );
              }),
            )}
          </svg>

          {tasks.map((t) => {
            const startOffset = daysBetween(rangeStart, t.start);
            const dur = daysBetween(t.start, t.end) + 1;
            const isDragging = drag?.id === t.id;
            const visualStart =
              isDragging && drag.mode !== "resize-r" ? startOffset + drag.deltaDays : startOffset;
            const visualDur =
              isDragging
                ? drag.mode === "resize-r"
                  ? Math.max(1, dur + drag.deltaDays)
                  : drag.mode === "resize-l"
                    ? Math.max(1, dur - drag.deltaDays)
                    : dur
                : dur;
            const isBlocked = blockedIds?.has(t.id);

            return (
              <div
                key={t.id}
                className="flex items-center border-b border-[var(--ink-200)]/60 hover:bg-[var(--ink-50)]/30"
                style={{ height: ROW_H }}
              >
                <div
                  className="shrink-0 cursor-pointer pr-2 pl-4"
                  style={{ width: LABEL_W }}
                  onClick={() => onSelectTask?.(t.id)}
                >
                  <p className="truncate text-[12px] font-semibold text-[var(--ink-900)]">
                    {t.title}
                  </p>
                  <p className="font-mono-num text-[10.5px] text-[var(--ink-500)]">
                    {t.id} · {t.level}
                  </p>
                </div>
                <div className="relative h-full flex-1">
                  {t.isMilestone ? (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: visualStart * dayPx }}
                      onClick={() => onSelectTask?.(t.id)}
                      title={`${t.title} — ${t.start}`}
                    >
                      <div
                        className="h-3.5 w-3.5 rotate-45 border border-[var(--ink-900)] bg-[var(--ink-900)]"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group absolute top-1/2 flex h-6 -translate-y-1/2 cursor-grab items-center overflow-hidden rounded text-[10.5px] font-medium text-white shadow-sm",
                        isDragging && "cursor-grabbing opacity-80 ring-2 ring-[var(--accent-500)]",
                        isBlocked && "ring-1 ring-[var(--amber-500)]",
                      )}
                      style={{
                        left: visualStart * dayPx,
                        width: visualDur * dayPx - 2,
                        backgroundColor: STATUS_BAR[t.status],
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDrag({ id: t.id, mode: "move", startX: e.clientX, deltaDays: 0 });
                      }}
                      onClick={(e) => {
                        if (!drag) {
                          e.stopPropagation();
                          onSelectTask?.(t.id);
                        }
                      }}
                      title={`${t.title} · ${t.start} → ${t.end} · ${STATUS_LABEL[t.status]}`}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 bg-black/20"
                        style={{ width: `${t.progress}%` }}
                      />
                      {/* Resize left */}
                      <div
                        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/30"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrag({
                            id: t.id,
                            mode: "resize-l",
                            startX: e.clientX,
                            deltaDays: 0,
                          });
                        }}
                      />
                      <span className="relative z-[1] truncate px-2">
                        {t.progress > 0 ? `${t.progress}%` : t.title}
                      </span>
                      {/* Resize right */}
                      <div
                        className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/30"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrag({
                            id: t.id,
                            mode: "resize-r",
                            startX: e.clientX,
                            deltaDays: 0,
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}