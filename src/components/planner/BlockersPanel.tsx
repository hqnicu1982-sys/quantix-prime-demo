import { Card, CardHead } from "@/components/Primitives";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  computeReadiness,
  moveTask,
  parseISO,
  type PlannerTask,
} from "@/lib/planner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";

type Props = {
  projectId: string;
  tasks: PlannerTask[];
  callOffs: { id: string; status: "draft" | "pending" | "approved" | "delivered" }[];
  approvedVariationIds: string[];
  onSelectTask?: (id: string) => void;
};

export function BlockersPanel({
  projectId,
  tasks,
  callOffs,
  approvedVariationIds,
  onSelectTask,
}: Props) {
  const canEditPlanner = useCan("edit.planner");
  const blocked = tasks
    .map((t) => ({ task: t, r: computeReadiness(t, tasks, { callOffs, approvedVariationIds }) }))
    .filter((x) => !x.r.ready && x.task.status !== "done");

  return (
    <Card>
      <CardHead
        title={`Blockers (${blocked.length})`}
        subtitle="Material · labour · predecessor · variation gates"
      />
      {blocked.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-[var(--ink-500)]">
          All upcoming tasks are ready to start. ✓
        </div>
      ) : (
        <ul className="divide-y divide-[var(--ink-200)]">
          {blocked.map(({ task, r }) => (
            <li key={task.id} className="flex items-start gap-3 px-5 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-500)]" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    className="text-[12.5px] font-semibold text-[var(--ink-900)] hover:text-[var(--accent-500)]"
                    onClick={() => onSelectTask?.(task.id)}
                  >
                    {task.id} · {task.title}
                  </button>
                  <span className="font-mono-num text-[10.5px] text-[var(--ink-500)]">
                    {task.start}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 text-[11.5px] text-[var(--ink-700)]">
                  {r.blockers.map((b, i) => (
                    <li key={i}>
                      <span className="font-semibold uppercase tracking-wider text-[var(--amber-500)]">
                        [{b.type}]
                      </span>{" "}
                      {b.note}
                    </li>
                  ))}
                </ul>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {canEditPlanner && r.suggestedStart && r.suggestedStart !== task.start && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10.5px]"
                      onClick={() => {
                        const delta = Math.round(
                          (parseISO(r.suggestedStart!).getTime() -
                            parseISO(task.start).getTime()) /
                            86_400_000,
                        );
                        moveTask(projectId, task.id, delta);
                        toast.success(`${task.id} pushed to ${r.suggestedStart}`);
                      }}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" /> Push to {r.suggestedStart}
                    </Button>
                  )}
                  {r.blockers.some((b) => b.type === "material") && (
                    <Link
                      to="/projects/$projectId/calloffs"
                      params={{ projectId }}
                      className="inline-flex h-6 items-center rounded border border-[var(--ink-200)] px-2 text-[10.5px] hover:border-[var(--accent-500)]"
                    >
                      Open call-offs
                    </Link>
                  )}
                  {r.blockers.some((b) => b.type === "variation") && (
                    <Link
                      to="/projects/$projectId/variations"
                      params={{ projectId }}
                      className="inline-flex h-6 items-center rounded border border-[var(--ink-200)] px-2 text-[10.5px] hover:border-[var(--accent-500)]"
                    >
                      Open variations
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}