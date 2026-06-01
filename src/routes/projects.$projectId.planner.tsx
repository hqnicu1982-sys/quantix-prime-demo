import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import {
  computeKpis,
  computeReadiness,
  PLANNER_TODAY,
  useProjectTasks,
  totalPlannedCost,
  type PlannerTask,
  type TaskStatus,
} from "@/lib/planner";
import { GanttChart } from "@/components/planner/GanttChart";
import { TaskDetailDialog } from "@/components/planner/TaskDetailDialog";
import { NewTaskDialog } from "@/components/planner/NewTaskDialog";
import { MsProjectImportDialog } from "@/components/planner/MsProjectImportDialog";
import { BlockersPanel } from "@/components/planner/BlockersPanel";
import { useProjectVariations } from "@/lib/variations";

export const Route = createFileRoute("/projects/$projectId/planner")({
  component: PlannerPage,
});

// Mock call-off statuses (mirrors src/routes/projects.fitzrovia.calloffs.tsx)
const CALL_OFFS: { id: string; status: "draft" | "pending" | "approved" | "delivered" }[] = [
  { id: "CO-247", status: "approved" },
  { id: "CO-246", status: "delivered" },
  { id: "CO-245", status: "delivered" },
  { id: "CO-248", status: "draft" },
  { id: "CO-249", status: "pending" },
];

function PlannerPage() {
  const { projectId: PID } = Route.useParams();
  const tasks = useProjectTasks(PID);
  const variations = useProjectVariations(PID);
  const approvedVariationIds = variations
    .filter((v) => v.status === "approved")
    .map((v) => v.id);

  const [zoom, setZoom] = useState<"day" | "week" | "month">("day");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter)),
    [tasks, statusFilter],
  );

  const kpis = useMemo(() => computeKpis(tasks), [tasks]);
  const plannedCost = useMemo(() => totalPlannedCost(tasks, PID), [tasks]);
  const readyCount = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status === "done") return false;
        const r = computeReadiness(t, tasks, {
          callOffs: CALL_OFFS,
          approvedVariationIds,
        });
        return r.ready;
      }).length,
    [tasks, approvedVariationIds],
  );

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

  const varianceLabel =
    kpis.varianceDays > 0
      ? `+${kpis.varianceDays} d ahead`
      : kpis.varianceDays < 0
        ? `${kpis.varianceDays} d behind`
        : "on baseline";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Programme status"
          value={varianceLabel}
          delta={`${kpis.total} tasks total`}
          tone={kpis.varianceDays >= 0 ? "success" : "danger"}
          trend={kpis.varianceDays >= 0 ? "up" : "down"}
        />
        <Kpi
          label="Active tasks"
          value={String(kpis.active)}
          delta={`${kpis.startingThisWeek} starting this week`}
        />
        <Kpi
          label="Crews on site"
          value={String(kpis.crewsOnSite)}
          delta={`£${(plannedCost / 1000).toFixed(1)}k planned labour`}
        />
        <Kpi
          label="Ready to start"
          value={`${readyCount}/${tasks.length - kpis.done}`}
          delta={`${blockedIds.size} blocked`}
          tone={blockedIds.size > 0 ? "warning" : "success"}
        />
      </div>

      <Card>
        <CardHead
          title="Programme — interactive Gantt"
          subtitle="Drag bars to move · drag edges to resize · click for details"
          right={
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[var(--ink-500)]" />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-8 w-[130px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="starting">Starting</SelectItem>
                  <SelectItem value="on-track">On track</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
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
              <NewTaskDialog projectId={PID} />
              <MsProjectImportDialog projectId={PID} />
            </div>
          }
        />
        <GanttChart
          projectId={PID}
          tasks={filtered}
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
    </div>
  );
}
