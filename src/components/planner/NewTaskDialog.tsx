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

  const reset = () => {
    setTitle("");
    setLevel("L4");
    setCrewId(undefined);
    setStart(isoDate(PLANNER_TODAY));
    setEnd(addDays(isoDate(PLANNER_TODAY), 5));
  };

  const submit = () => {
    if (!title.trim()) return;
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
    });
    toast.success("Task added", { description: title.trim() });
    reset();
    setOpen(false);
  };

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
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}