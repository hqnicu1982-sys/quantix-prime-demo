import { Card, CardHead } from "@/components/Primitives";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Sparkles, FileCheck2, PackageCheck, Users, Info } from "lucide-react";
import {
  computeReadiness,
  moveTask,
  parseISO,
  taskPlannedCost,
  type PlannerTask,
} from "@/lib/planner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { useNavigate } from "@tanstack/react-router";
import { scoreCandidates, type ScoredRecAction } from "@/lib/recommendedAction";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const navigate = useNavigate();
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
                  {(() => {
                    const scored = scoreCandidates({
                      blockers: r.blockers,
                      suggestedStart: r.suggestedStart,
                      task,
                      canEdit: canEditPlanner,
                      plannedCost: taskPlannedCost(task, projectId),
                    });
                    const rec = scored[0];
                    if (!rec) return null;
                    const Icon = iconFor(rec);
                    const tone =
                      rec.urgencyTier === "overdue" || rec.impactTier === "high"
                        ? "bg-[var(--red-500)] hover:bg-[var(--red-600)]"
                        : "";
                    return (
                      <>
                      <Button
                        size="sm"
                        className={`h-6 gap-1 text-[10.5px] ${tone}`}
                        title={rec.reason}
                        onClick={() => {
                          if (rec.kind === "push") {
                            const delta = Math.round(
                              (parseISO(r.suggestedStart!).getTime() -
                                parseISO(task.start).getTime()) /
                                86_400_000,
                            );
                            moveTask(projectId, task.id, delta);
                            toast.success(`${task.id} pushed to ${r.suggestedStart}`, {
                              description: rec.reason,
                            });
                          } else if (rec.kind === "reassign-crew") {
                            onSelectTask?.(task.id);
                          } else if (rec.kind === "navigate-variations") {
                            navigate({ to: "/projects/$projectId/variations", params: { projectId } });
                          } else if (rec.kind === "navigate-calloffs") {
                            navigate({ to: "/projects/$projectId/calloffs", params: { projectId } });
                          }
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        <Icon className="h-3 w-3" />
                        {rec.label}
                      </Button>
                      <ScoreBreakdownPopover scored={scored} />
                      </>
                    );
                  })()}
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

function iconFor(rec: ScoredRecAction) {
  switch (rec.kind) {
    case "navigate-variations":
      return FileCheck2;
    case "navigate-calloffs":
      return PackageCheck;
    case "push":
      return ArrowRight;
    case "reassign-crew":
      return Users;
  }
}

function ScoreBreakdownPopover({ scored }: { scored: ScoredRecAction[] }) {
  const top = scored[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 text-[10.5px]"
          title="Why this action?"
        >
          <Info className="h-3 w-3" />
          Why?
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] p-0">
        <div className="border-b border-[var(--ink-200)] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Recommendation scoring
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--ink-600)]">
            Score = weight + urgency + P&amp;L impact. Highest wins.
          </div>
        </div>
        <table className="w-full text-[11px]">
          <thead className="bg-[var(--ink-50)] text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold">Candidate</th>
              <th className="px-2 py-1.5 text-right font-semibold">Weight</th>
              <th className="px-2 py-1.5 text-right font-semibold">Urgency</th>
              <th className="px-2 py-1.5 text-right font-semibold">P&amp;L</th>
              <th className="px-3 py-1.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-200)]">
            {scored.map((s, i) => (
              <tr
                key={`${s.kind}-${i}`}
                className={i === 0 ? "bg-[var(--accent-50)] font-semibold" : ""}
              >
                <td className="px-3 py-1.5">
                  <div className="text-[11px] text-[var(--ink-900)]">{s.label}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                    {s.blockerType}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right font-mono-num">{s.weightScore}</td>
                <td className="px-2 py-1.5 text-right font-mono-num">
                  {s.urgencyScore}
                  <div className="text-[9.5px] uppercase text-[var(--ink-500)]">
                    {s.urgencyTier}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right font-mono-num">
                  {s.impactScore}
                  <div className="text-[9.5px] uppercase text-[var(--ink-500)]">
                    {s.impactTier}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right font-mono-num text-[var(--ink-900)]">
                  {s.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-[var(--ink-200)] px-3 py-2 text-[10.5px] text-[var(--ink-600)]">
          <span className="font-semibold text-[var(--ink-900)]">Picked:</span> {top.reason}
        </div>
      </PopoverContent>
    </Popover>
  );
}