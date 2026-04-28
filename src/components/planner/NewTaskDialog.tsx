import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { addDays, addTask, isoDate, PLANNER_TODAY } from "@/lib/planner";
import { useProjectCrews } from "@/lib/labour";
import { toast } from "sonner";

export function NewTaskDialog({ projectId }: { projectId: string }) {
  const crews = useProjectCrews(projectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("L4");
  const [crewId, setCrewId] = useState<string | undefined>(undefined);
  const [start, setStart] = useState(isoDate(PLANNER_TODAY));
  const [end, setEnd] = useState(addDays(isoDate(PLANNER_TODAY), 5));
  const [plannedHours, setPlannedHours] = useState<string>("");

  const reset = () => {
    setTitle("");
    setLevel("L4");
    setCrewId(undefined);
    setStart(isoDate(PLANNER_TODAY));
    setEnd(addDays(isoDate(PLANNER_TODAY), 5));
    setPlannedHours("");
  };

  const submit = () => {
    if (!title.trim()) return;
    const hrs = plannedHours ? Number(plannedHours) : undefined;
    addTask(projectId, {
      projectId,
      title: title.trim(),
      level,
      crewId,
      start,
      end,
      progress: 0,
      status: "scheduled",
      boqLineIds: [],
      calloffIds: [],
      dependsOn: [],
      plannedHours: hrs && Number.isFinite(hrs) && hrs > 0 ? hrs : undefined,
    });
    toast.success("Task added", { description: title.trim() });
    reset();
    setOpen(false);
  };

  const selectedCrew = crews.find((c) => c.assignment.memberId === crewId);
  const hrs = Number(plannedHours);
  const showCost = selectedCrew && Number.isFinite(hrs) && hrs > 0;
  const estCost = showCost ? hrs * selectedCrew.rate : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New planner task</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="L5 Bedroom partitions" />
          </div>
          <div>
            <Label className="text-[11px]">Level</Label>
            <Input value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div>
            <Label className="text-[11px]">Crew</Label>
            <Select value={crewId ?? "none"} onValueChange={(v) => setCrewId(v === "none" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
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
            <Label className="text-[11px]">Start</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-[11px]">End</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Planned hours (man-hours)</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={plannedHours}
              onChange={(e) => setPlannedHours(e.target.value)}
              placeholder="e.g. 80"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">
              {showCost ? (
                <>
                  {hrs} h × £{selectedCrew!.rate.toFixed(2)}/h ={" "}
                  <span className="font-semibold text-[var(--ink-900)]">£{estCost.toFixed(0)}</span>{" "}
                  estimated cost
                </>
              ) : crewId ? (
                "Enter hours to see estimated cost"
              ) : (
                "Assign a crew to see estimated cost"
              )}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}