import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileWarning, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  addVariation,
  RAISED_BY_OPTIONS,
  type VariationRaisedBy,
} from "@/lib/variations";
import { useProjectTasks, updateTask } from "@/lib/planner";

type Props = {
  projectId: string;
  issue: string;
  date: string; // ISO yyyy-mm-dd
};

// Try to extract a quantity + unit hint from the issue text ("4.5h overtime").
function extractHours(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*h\b/i);
  return m ? Number(m[1]) : undefined;
}

function classify(text: string): {
  kind: "dayworks" | "issue";
  raisedBy: VariationRaisedBy;
  defaultRate: number;
  defaultUnit: string;
} {
  const lower = text.toLowerCase();
  if (
    lower.includes("dayworks") ||
    lower.includes("overtime") ||
    lower.includes("daywork")
  ) {
    return { kind: "dayworks", raisedBy: "site", defaultRate: 45, defaultUnit: "h" };
  }
  return { kind: "issue", raisedBy: "site", defaultRate: 0, defaultUnit: "lot" };
}

export function RaiseVariationFromIssueDialog({ projectId, issue, date }: Props) {
  const [open, setOpen] = useState(false);
  const meta = useMemo(() => classify(issue), [issue]);
  const initialQty = useMemo(() => extractHours(issue) ?? 1, [issue]);
  const tasks = useProjectTasks(projectId);
  // Only offer tasks that overlap this date — keeps the picker focused.
  const candidateTasks = useMemo(
    () => tasks.filter((t) => t.start <= date && t.end >= date && t.status !== "done"),
    [tasks, date],
  );

  const [title, setTitle] = useState(() =>
    meta.kind === "dayworks"
      ? `Dayworks — ${issue.replace(/^Dayworks raised:?\s*/i, "").slice(0, 80)}`
      : issue.slice(0, 90),
  );
  const [reason, setReason] = useState(
    `Raised from Daily Site Report ${date}. Source note: "${issue}"`,
  );
  const [raisedBy, setRaisedBy] = useState<VariationRaisedBy>(meta.raisedBy);
  const [qty, setQty] = useState<number>(initialQty);
  const [unit, setUnit] = useState<string>(meta.defaultUnit);
  const [rate, setRate] = useState<number>(meta.defaultRate);
  const [timeDays, setTimeDays] = useState<number>(meta.kind === "dayworks" ? 0 : 1);
  const [linkTaskId, setLinkTaskId] = useState<string>("none");

  const lineTotal = Math.round(qty * rate * 100) / 100;

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const v = addVariation(projectId, {
      title: title.trim(),
      reason: reason.trim(),
      raisedBy,
      raisedDate: date,
      status: "draft",
      timeImpactDays: timeDays,
      attachments: [],
      source: "daily-report",
      sourceDate: date,
      sourceTaskId: linkTaskId !== "none" ? linkTaskId : undefined,
      changes: [
        {
          id: `chg-${Date.now().toString(36)}`,
          op: meta.kind === "dayworks" ? "add_line" : "add_line",
          description:
            meta.kind === "dayworks"
              ? `Dayworks labour — ${qty}${unit} @ £${rate.toFixed(2)}`
              : title.trim(),
          qty,
          unit,
          ratePerUnit: rate,
          lineTotal,
        },
      ],
    });
    // If linked to a planner task, mark the task as variation-gated so the
    // BlockersPanel surfaces it automatically.
    if (linkTaskId !== "none") {
      updateTask(projectId, linkTaskId, { variationId: v.id });
    }
    toast.success(`Variation ${v.id} drafted`, {
      description: `${v.title} · £${v.costImpact.toFixed(0)} · ${timeDays >= 0 ? "+" : ""}${timeDays}d`,
      action: {
        label: "Open",
        onClick: () => {
          window.location.href = "/variations";
        },
      },
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--amber-700,#92400e)] hover:bg-[var(--amber-500)]/20"
          title="Raise as Variation"
        >
          <FileWarning className="h-3 w-3" />
          Raise VO
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--ink-200)] px-6 py-4">
          <DialogTitle>
            Raise variation from {meta.kind === "dayworks" ? "dayworks" : "site issue"}
          </DialogTitle>
          <p className="mt-1 text-[12px] text-[var(--ink-500)]">
            Creates a draft VO on the Variations page. Cost feeds Financial; time impact feeds Planner.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-2.5 text-[12px] text-[var(--ink-700)]">
            <span className="font-semibold text-[var(--ink-500)]">From Daily Report:</span>{" "}
            {issue}
          </div>
          <div>
            <Label className="text-[11px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-[11px]">Reason / context</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Raised by</Label>
              <Select value={raisedBy} onValueChange={(v) => setRaisedBy(v as VariationRaisedBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RAISED_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Time impact (days)</Label>
              <Input
                type="number"
                step={0.5}
                value={timeDays}
                onChange={(e) => setTimeDays(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">
              Link to planner task <span className="text-[var(--ink-500)]">(optional)</span>
            </Label>
            <Select value={linkTaskId} onValueChange={setLinkTaskId}>
              <SelectTrigger>
                <SelectValue placeholder={candidateTasks.length ? "Pick a task" : "No active tasks on this date"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No link —</SelectItem>
                {candidateTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.id} · {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkTaskId !== "none" && (
              <p className="mt-1 text-[10.5px] text-[var(--ink-500)]">
                Task will be flagged with this VO in the Planner's Blockers panel until the VO is approved.
              </p>
            )}
          </div>
          <div className="rounded-md border border-[var(--ink-200)] p-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Cost line
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px]">Qty</Label>
                <Input
                  type="number"
                  step={0.5}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-[11px]">Unit</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Rate (£)</Label>
                <Input
                  type="number"
                  step={0.01}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-2 text-right text-[12px]">
              <span className="text-[var(--ink-500)]">Line total:</span>{" "}
              <span className="font-mono-num font-semibold text-[var(--ink-900)]">
                £{lineTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-[var(--ink-200)] px-6 py-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/variations">
              Open Variations <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Create draft VO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}