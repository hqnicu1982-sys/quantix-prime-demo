import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ganttRows } from "@/lib/mockData";
import { Calendar, Download, Plus, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/planner")({ component: Planner };

const colorMap: Record<string, string> = {
  blue: "bg-[var(--accent-500)]",
  green: "bg-[var(--green-600)]",
  amber: "bg-[var(--amber-500)]",
  red: "bg-[var(--red-500)]",
  purple: "bg-purple-500",
  grey: "bg-[var(--ink-500)]",
};

const TOTAL_DAYS = 21;

function Planner() {
  return (
    <Section
      title="Execution Planner"
      subtitle="Look-ahead 2-3 weeks · constraint-aware · auto-syncs material readiness"
      right={
        <>
          <Button variant="outline" size="sm"><Calendar className="mr-1.5 h-3.5 w-3.5" /> Today</Button>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF</Button>
          <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> New task</Button>
        </>
      }
    >
      <Card>
        <CardHead title="Gantt view" subtitle="Apr 20 → May 10 · 14 tasks" />
        <div className="overflow-x-auto p-5">
          <div className="min-w-[900px]">
            {/* Week headers */}
            <div className="flex border-b border-[var(--ink-200)] pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              <div className="w-[200px] shrink-0">Task</div>
              <div className="grid flex-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="border-l border-[var(--ink-200)] pl-2">Apr 20</div>
                <div className="border-l border-[var(--ink-200)] pl-2">Apr 27</div>
                <div className="border-l border-[var(--ink-200)] pl-2">May 4</div>
              </div>
            </div>

            {/* Rows */}
            <div className="relative mt-2">
              {/* Today line */}
              <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px border-l-2 border-dashed border-[var(--accent-500)]" style={{ left: `calc(200px + ${(0 / TOTAL_DAYS) * 100}% * (100% - 200px) / 100%)` }}>
                <span className="absolute -top-3 -translate-x-1/2 rounded bg-[var(--accent-500)] px-1 py-0.5 text-[9px] font-bold uppercase text-white">Today</span>
              </div>

              {ganttRows.map((r) => (
                <div key={r.id} className="flex items-center border-b border-[var(--ink-200)]/60 py-1.5">
                  <div className="w-[200px] shrink-0 pr-2 text-[12px]">
                    <p className="font-semibold">{r.level}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{r.task} · {r.crew}</p>
                  </div>
                  <div className="relative flex-1">
                    <div className="h-6 rounded bg-[var(--ink-50)]/30" />
                    <div
                      className={`absolute top-0 flex h-6 items-center rounded px-2 text-[10.5px] font-medium text-white ${colorMap[r.color]}`}
                      style={{ left: `${(r.startDay / TOTAL_DAYS) * 100}%`, width: `${(r.duration / TOTAL_DAYS) * 100}%` }}
                    >
                      {r.isMilestone ? <span className="text-[14px]">◆</span> : <span className="truncate">{r.progress}%</span>}
                      {r.alert && <AlertCircle className="ml-1 h-3 w-3 shrink-0" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
