import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { ProjectBanner } from "@/components/ProjectBanner";
import {
  computeKpis,
  computeReadiness,
  useProjectTasks,
  totalPlannedCost,
  type PlannerTask,
} from "@/lib/planner";
import { GanttChart } from "@/components/planner/GanttChart";
import { TaskDetailDialog } from "@/components/planner/TaskDetailDialog";
import { NewTaskDialog } from "@/components/planner/NewTaskDialog";
import { BlockersPanel } from "@/components/planner/BlockersPanel";
import { useProject } from "@/lib/ProjectContext";
import { useProjectVariations } from "@/lib/variations";

export const Route = createFileRoute("/planner")({ component: Planner });

const CALL_OFFS: { id: string; status: "draft" | "pending" | "approved" | "delivered" }[] = [
  { id: "CO-247", status: "approved" },
  { id: "CO-246", status: "delivered" },
  { id: "CO-245", status: "delivered" },
  { id: "CO-248", status: "draft" },
  { id: "CO-249", status: "pending" },
];

function Planner() {
  const { current } = useProject();
  const PID = current.id;
  const tasks = useProjectTasks(PID);
  const variations = useProjectVariations(PID);
  const approvedVariationIds = variations
    .filter((v) => v.status === "approved")
    .map((v) => v.id);

  const [zoom, setZoom] = useState<"day" | "week" | "month">("day");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kpis = useMemo(() => computeKpis(tasks), [tasks]);
  const plannedCost = useMemo(() => totalPlannedCost(tasks, PID), [tasks, PID]);
  const blockedIds = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) {
      const r = computeReadiness(t, tasks, { callOffs: CALL_OFFS, approvedVariationIds });
      if (!r.ready) s.add(t.id);
    }
    return s;
  }, [tasks, approvedVariationIds]);

  const selected: PlannerTask | null = selectedId
    ? tasks.find((t) => t.id === selectedId) ?? null
    : null;

  return (
    <Section
      title="Execution Planner"
      subtitle={`${current.name} · ${tasks.length} tasks · interactive Gantt with constraint awareness`}
      right={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast("Today line follows real date · scroll horizontally to centre")}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" /> Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Planner exported", { description: `gantt-${PID}.pdf` })}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
          </Button>
          <NewTaskDialog projectId={PID} />
        </>
      }
    >
      <ProjectBanner scope="Execution Planner" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total tasks" value={String(kpis.total)} delta={`${kpis.done} done`} />
        <Kpi label="Active" value={String(kpis.active)} delta={`${kpis.startingThisWeek} this week`} />
        <Kpi
          label="Planned labour"
          value={`£${(plannedCost / 1000).toFixed(1)}k`}
          delta={`${kpis.crewsOnSite} crews on site`}
        />
        <Kpi
          label="Blocked"
          value={String(blockedIds.size)}
          delta={blockedIds.size === 0 ? "all clear" : "see blockers panel"}
          tone={blockedIds.size > 0 ? "warning" : "success"}
        />
      </div>

      <Card>
        <CardHead
          title="Gantt"
          subtitle="Drag to move · resize edges · click for details"
          right={
            <div className="flex rounded-md border border-[var(--ink-200)] p-0.5">
              {(["day", "week", "month"] as const).map((z) => (
                <Button
                  key={z}
                  variant={zoom === z ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px] capitalize"
                  onClick={() => setZoom(z)}
                >
                  {z}
                </Button>
              ))}
            </div>
          }
        />
        <GanttChart
          projectId={PID}
          tasks={tasks}
          zoom={zoom}
          blockedIds={blockedIds}
          onSelectTask={setSelectedId}
        />
      </Card>

      <BlockersPanel
        projectId={PID}
        tasks={tasks}
        callOffs={CALL_OFFS}
        approvedVariationIds={approvedVariationIds}
        onSelectTask={setSelectedId}
      />

      <TaskDetailDialog
        projectId={PID}
        task={selected}
        allTasks={tasks}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        callOffs={CALL_OFFS}
        approvedVariationIds={approvedVariationIds}
      />
    </Section>
  );
}
