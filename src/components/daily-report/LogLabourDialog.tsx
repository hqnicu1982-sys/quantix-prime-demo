import { useMemo, useState } from "react";
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
import { useProjectCrews } from "@/lib/labour";
import { useProjectTasks } from "@/lib/planner";
import { addLabourLog, computeHours } from "@/lib/laborLog";
import { toast } from "sonner";

type Props = { projectId: string; date: string };

export function LogLabourDialog({ projectId, date }: Props) {
  const crews = useProjectCrews(projectId);
  const tasks = useProjectTasks(projectId);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("none");
  const [inTime, setInTime] = useState("07:00");
  const [outTime, setOutTime] = useState("16:30");
  const [work, setWork] = useState("");

  const hours = useMemo(() => computeHours(inTime, outTime), [inTime, outTime]);
  const crew = crews.find((c) => c.assignment.memberId === memberId);
  const cost = crew ? hours * crew.rate : 0;

  const reset = () => {
    setMemberId("");
    setTaskId("none");
    setInTime("07:00");
    setOutTime("16:30");
    setWork("");
  };

  const submit = () => {
    if (!memberId) {
      toast.error("Select a crew member");
      return;
    }
    if (hours <= 0) {
      toast.error("Out time must be after in time");
      return;
    }
    addLabourLog({
      projectId,
      date,
      memberId,
      taskId: taskId === "none" ? undefined : taskId,
      inTime,
      outTime,
      work: work.trim() || "—",
      late: inTime > "07:30",
    });
    toast.success("Hours logged", {
      description: `${hours.toFixed(1)}h · £${cost.toFixed(0)}`,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Log labour
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log labour hours · {date}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Crew member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Select crew" />
              </SelectTrigger>
              <SelectContent>
                {crews.map((c) => (
                  <SelectItem key={c.assignment.memberId} value={c.assignment.memberId}>
                    {c.member?.name ?? "?"} · {c.crewName} · £{c.rate.toFixed(2)}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Task (optional)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No task link —</SelectItem>
                {tasks
                  .filter((t) => t.status !== "done")
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id} · {t.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">In time</Label>
            <Input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-[11px]">Out time</Label>
            <Input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Work description</Label>
            <Input
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="L4 boarding"
            />
          </div>
        </div>
        <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-2.5 text-[12px]">
          <span className="text-[var(--ink-500)]">Computed:</span>{" "}
          <span className="font-mono-num font-semibold">{hours.toFixed(1)}h</span>
          {crew && (
            <>
              {" × "}
              <span className="font-mono-num">£{crew.rate.toFixed(2)}/h</span>
              {" = "}
              <span className="font-mono-num font-semibold text-[var(--ink-900)]">
                £{cost.toFixed(0)}
              </span>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Save log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}