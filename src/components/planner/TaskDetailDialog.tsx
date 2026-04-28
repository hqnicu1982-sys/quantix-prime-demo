import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABEL,
  STATUS_TONE,
  computeReadiness,
  deleteTask,
  updateTask,
  taskPlannedCost,
  taskActualCost,
  type PlannerTask,
  type TaskStatus,
} from "@/lib/planner";
import { useProjectCrews } from "@/lib/labour";
import { getActualHoursForTask, getActualCostForTask } from "@/lib/laborLog";
import { AlertTriangle, CheckCircle2, Trash2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type Props = {
  projectId: string;
  task: PlannerTask | null;
  allTasks: PlannerTask[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  callOffs: { id: string; status: "draft" | "pending" | "approved" | "delivered" }[];
  approvedVariationIds: string[];
};

const STATUSES: TaskStatus[] = [
  "scheduled",
  "starting",
  "on-track",
  "behind",
  "blocked",
  "done",
];

export function TaskDetailDialog({
  projectId,
  task,
  allTasks,
  open,
  onOpenChange,
  callOffs,
  approvedVariationIds,
}: Props) {
  const [draft, setDraft] = useState<PlannerTask | null>(task);
  const crews = useProjectCrews(projectId);

  useEffect(() => setDraft(task), [task?.id]);

  if (!draft) return null;

  const readiness = computeReadiness(draft, allTasks, {
    callOffs,
    approvedVariationIds,
  });

  const selectedCrew = crews.find((c) => c.assignment.memberId === draft.crewId);
  const plannedCost = taskPlannedCost(draft, projectId);
  const actualHours = getActualHoursForTask(projectId, draft.id);
  // Use real cost from logs (respects PW vs hourly), fallback to rate × hours.
  const realCost = getActualCostForTask(projectId, draft.id);
  const actualCost = realCost > 0 ? realCost : taskActualCost(draft, projectId, actualHours);
  const variance = plannedCost > 0 ? ((actualCost - plannedCost) / plannedCost) * 100 : 0;

  const save = () => {
    updateTask(projectId, draft.id, {
      title: draft.title,
      level: draft.level,
      area: draft.area,
      crewId: draft.crewId,
      start: draft.start,
      end: draft.end,
      progress: draft.progress,
      status: draft.status,
      notes: draft.notes,
      plannedHours: draft.plannedHours,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono-num text-[12px] text-[var(--ink-500)]">{draft.id}</span>
            <span>{draft.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Readiness banner */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-[12px]",
            readiness.ready
              ? "border-[var(--green-600)]/30 bg-[var(--green-600)]/5 text-[var(--green-600)]"
              : "border-[var(--amber-500)]/40 bg-[var(--amber-500)]/5 text-[var(--amber-500)]",
          )}
        >
          {readiness.ready ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {readiness.ready ? "Ready to start" : `${readiness.blockers.length} blocker(s)`}
            </p>
            {readiness.blockers.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[11.5px]">
                {readiness.blockers.map((b, i) => (
                  <li key={i}>
                    <span className="font-semibold uppercase tracking-wider">[{b.type}]</span>{" "}
                    {b.note}
                  </li>
                ))}
              </ul>
            )}
            {!readiness.ready && readiness.suggestedStart && readiness.suggestedStart !== draft.start && (
              <button
                className="mt-1.5 underline"
                onClick={() => {
                  const dur =
                    new Date(draft.end).getTime() - new Date(draft.start).getTime();
                  const newStart = readiness.suggestedStart!;
                  const newEnd = new Date(new Date(newStart).getTime() + dur)
                    .toISOString()
                    .slice(0, 10);
                  setDraft({ ...draft, start: newStart, end: newEnd });
                }}
              >
                Push to ready date ({readiness.suggestedStart})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">Level</Label>
            <Input
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">Area</Label>
            <Input
              value={draft.area ?? ""}
              onChange={(e) => setDraft({ ...draft, area: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">Start</Label>
            <Input
              type="date"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">End</Label>
            <Input
              type="date"
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">Crew</Label>
            <Select
              value={draft.crewId ?? "none"}
              onValueChange={(v) => setDraft({ ...draft, crewId: v === "none" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                {crews.map((c) => (
                  <SelectItem key={c.assignment.memberId} value={c.assignment.memberId}>
                    {c.member?.name ?? "?"} · {c.crewName} · £{c.rate.toFixed(2)}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft({ ...draft, status: v as TaskStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Progress: {draft.progress}%</Label>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.progress}
              onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Planned hours (man-hours)</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={draft.plannedHours ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  plannedHours: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 80"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Notes</Label>
            <Textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        {/* Cost panel */}
        <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-3 text-[12px]">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Cost
          </p>
          {!selectedCrew ? (
            <p className="mt-1 text-[var(--ink-500)]">Assign a crew to see cost estimate.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              <div>
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Rate</p>
                <p className="font-mono-num font-semibold">£{selectedCrew.rate.toFixed(2)}/h</p>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Planned</p>
                <p className="font-mono-num font-semibold">
                  {draft.plannedHours ?? 0}h · £{plannedCost.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Actual</p>
                <p className="font-mono-num font-semibold">
                  {actualHours.toFixed(1)}h · £{actualCost.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Variance</p>
                <p
                  className={cn(
                    "font-mono-num font-semibold",
                    plannedCost === 0
                      ? "text-[var(--ink-500)]"
                      : variance > 0
                        ? "text-[var(--red-500)]"
                        : "text-[var(--green-600)]",
                  )}
                >
                  {plannedCost === 0
                    ? "—"
                    : `${variance > 0 ? "+" : ""}${variance.toFixed(1)}%`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Linked items */}
        <div className="space-y-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-3 text-[12px]">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Linked
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn("rounded px-2 py-0.5 text-[11px]", STATUS_TONE[draft.status])}
            >
              {STATUS_LABEL[draft.status]}
            </span>
            {draft.boqLineIds.map((b) => (
              <Link
                key={b}
                to="/projects/$projectId/costed-boq"
                params={{ projectId }}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] text-[var(--ink-700)] ring-1 ring-[var(--ink-200)] hover:ring-[var(--accent-500)]"
              >
                <LinkIcon className="h-3 w-3" /> {b}
              </Link>
            ))}
            {draft.calloffIds.map((c) => (
              <Link
                key={c}
                to="/projects/$projectId/calloffs"
                params={{ projectId }}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] text-[var(--ink-700)] ring-1 ring-[var(--ink-200)] hover:ring-[var(--accent-500)]"
              >
                <LinkIcon className="h-3 w-3" /> {c}
              </Link>
            ))}
            {draft.variationId && (
              <Link
                to="/projects/$projectId/variations"
                params={{ projectId }}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] text-[var(--ink-700)] ring-1 ring-[var(--ink-200)] hover:ring-[var(--accent-500)]"
              >
                <LinkIcon className="h-3 w-3" /> {draft.variationId}
              </Link>
            )}
            {draft.dependsOn.map((d) => (
              <span
                key={d}
                className="rounded bg-white px-2 py-0.5 text-[11px] text-[var(--ink-700)] ring-1 ring-[var(--ink-200)]"
              >
                ← {d}
              </span>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`Delete ${draft.id}?`)) {
                deleteTask(projectId, draft.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}