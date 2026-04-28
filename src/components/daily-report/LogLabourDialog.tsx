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
import { useProjectCrews, usePriceWorkRates } from "@/lib/labour";
import { useProjectTasks } from "@/lib/planner";
import { addLabourLog, computeHours } from "@/lib/laborLog";
import { toast } from "sonner";

type Props = { projectId: string; date: string };

export function LogLabourDialog({ projectId, date }: Props) {
  const crews = useProjectCrews(projectId);
  const tasks = useProjectTasks(projectId);
  const pwRates = usePriceWorkRates(projectId);
  const [open, setOpen] = useState(false);
  const [payMode, setPayMode] = useState<"hourly" | "pw">("hourly");
  const [memberId, setMemberId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("none");
  const [inTime, setInTime] = useState("07:00");
  const [outTime, setOutTime] = useState("16:30");
  const [work, setWork] = useState("");
  const [pwRateId, setPwRateId] = useState<string>("");
  const [pwQty, setPwQty] = useState<number>(1);

  const hours = useMemo(() => computeHours(inTime, outTime), [inTime, outTime]);
  const crew = crews.find((c) => c.assignment.memberId === memberId);
  const cost = crew ? hours * crew.rate : 0;
  const selectedPw = pwRates.find((p) => p.id === pwRateId);
  const pwAmount = selectedPw ? (selectedPw.unit === "lump" ? selectedPw.rate : pwQty * selectedPw.rate) : 0;

  const reset = () => {
    setPayMode("hourly");
    setMemberId("");
    setTaskId("none");
    setInTime("07:00");
    setOutTime("16:30");
    setWork("");
    setPwRateId("");
    setPwQty(1);
  };

  const onPickPw = (id: string) => {
    setPwRateId(id);
    const r = pwRates.find((p) => p.id === id);
    if (r) {
      if (!work.trim()) setWork(r.scope);
      if (r.taskId && taskId === "none") setTaskId(r.taskId);
      if (r.unit === "lump") setPwQty(1);
    }
  };

  const submit = () => {
    if (!memberId) {
      toast.error("Select a crew member");
      return;
    }
    if (payMode === "hourly" && hours <= 0) {
      toast.error("Out time must be after in time");
      return;
    }
    if (payMode === "pw") {
      if (!selectedPw) {
        toast.error("Select a Price Work rate");
        return;
      }
      if (selectedPw.unit !== "lump" && (!pwQty || pwQty <= 0)) {
        toast.error("Quantity must be greater than 0");
        return;
      }
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
      payMode,
      pwRateId: payMode === "pw" ? pwRateId : undefined,
      pwQty: payMode === "pw" ? (selectedPw?.unit === "lump" ? 1 : pwQty) : undefined,
      pwAmount: payMode === "pw" ? pwAmount : undefined,
    });
    toast.success(payMode === "pw" ? "PW entry logged" : "Hours logged", {
      description: payMode === "pw"
        ? `${selectedPw?.code} · £${pwAmount.toFixed(0)}`
        : `${hours.toFixed(1)}h · £${cost.toFixed(0)}`,
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
        {/* Pay-mode toggle */}
        <div className="flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-1 text-[12px]">
          <button
            type="button"
            onClick={() => setPayMode("hourly")}
            className={`flex-1 rounded px-3 py-1.5 font-semibold transition-colors ${payMode === "hourly" ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--ink-700)]"}`}
          >
            Hourly
          </button>
          <button
            type="button"
            onClick={() => setPayMode("pw")}
            className={`flex-1 rounded px-3 py-1.5 font-semibold transition-colors ${payMode === "pw" ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--ink-700)]"}`}
          >
            Price Work
          </button>
        </div>
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
          {payMode === "pw" && (
            <>
              <div className="col-span-2">
                <Label className="text-[11px]">Price Work rate</Label>
                <Select value={pwRateId} onValueChange={onPickPw}>
                  <SelectTrigger>
                    <SelectValue placeholder={pwRates.length ? "Select PW rate" : "No PW rates — define on Team page"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pwRates.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} · {p.scope} · £{p.rate.toFixed(2)}{p.unit === "lump" ? " lump" : `/${p.unit}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-[11px]">
                  Quantity {selectedPw ? (selectedPw.unit === "lump" ? "(lump)" : `(${selectedPw.unit})`) : ""}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={pwQty}
                  disabled={selectedPw?.unit === "lump"}
                  onChange={(e) => setPwQty(Number(e.target.value))}
                />
              </div>
            </>
          )}
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
            <Label className="text-[11px]">In time {payMode === "pw" && <span className="text-[var(--ink-500)]">(attendance)</span>}</Label>
            <Input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-[11px]">Out time {payMode === "pw" && <span className="text-[var(--ink-500)]">(attendance)</span>}</Label>
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
          {payMode === "hourly" ? (
            <>
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
            </>
          ) : (
            <>
              <span className="text-[var(--ink-500)]">PW cost:</span>{" "}
              {selectedPw ? (
                <>
                  <span className="font-mono-num">{selectedPw.unit === "lump" ? "lump" : `${pwQty} ${selectedPw.unit}`}</span>
                  {selectedPw.unit !== "lump" && (
                    <>
                      {" × "}
                      <span className="font-mono-num">£{selectedPw.rate.toFixed(2)}</span>
                    </>
                  )}
                  {" = "}
                  <span className="font-mono-num font-semibold text-[var(--ink-900)]">
                    £{pwAmount.toFixed(0)}
                  </span>
                  <span className="ml-2 text-[var(--ink-500)]">· {hours.toFixed(1)}h on site</span>
                </>
              ) : (
                <span className="text-[var(--ink-500)]">Pick a PW rate</span>
              )}
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