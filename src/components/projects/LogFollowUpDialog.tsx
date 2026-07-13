import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/lib/currentUser";
import { updateProject } from "@/lib/customProjects";
import { awardProject, markLost } from "@/lib/projectLifecycle";
import { team } from "@/lib/mockData";
import {
  logFollowUp, updateFollowUp, outcomesForStatus,
  computeNextReminderOffset, inputDateToDisplay, displayToInputDate,
  type FollowUpOutcome, type ManualFollowUp,
} from "@/lib/tenderDetails";
import type { Project } from "@/lib/mockData";
import { toast } from "sonner";
import { Trophy, XCircle } from "lucide-react";

type Channel = "email" | "call" | "meeting";

export function LogFollowUpDialog({
  project, open, onOpenChange, existing,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** If set, dialog runs in edit mode for that follow-up. */
  existing?: ManualFollowUp;
}) {
  const me = useCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const outcomes = outcomesForStatus(project.status);
  const isEdit = !!existing;
  const preLifecycle = project.status === "tender" || project.status === "awaiting";

  const [channel, setChannel] = useState<Channel>("email");
  const [date, setDate] = useState<string>(today);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<FollowUpOutcome | "">("");
  const [reminderDate, setReminderDate] = useState<string>("");
  const [reminderTouched, setReminderTouched] = useState(false);
  const [applyLifecycle, setApplyLifecycle] = useState(true);
  const [competitor, setCompetitor] = useState("");

  // Prime state whenever the dialog opens or the target entry changes.
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setChannel(existing.channel);
      setDate(existing.isoDate.slice(0, 10));
      setNote(existing.note);
      setOutcome(existing.outcome ?? "");
      setReminderDate(displayToInputDate(existing.nextReminderDate));
      setReminderTouched(true);
    } else {
      const first = outcomes[0]?.code ?? ("no-response" as FollowUpOutcome);
      setChannel("email");
      setDate(today);
      setNote("");
      setOutcome(first);
      const offset = computeNextReminderOffset(first);
      setReminderDate(offset != null ? isoAfter(today, offset) : "");
      setReminderTouched(false);
    }
    setApplyLifecycle(true);
    setCompetitor("");
  }, [open, existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-suggest next reminder when the outcome changes (unless the user has
  // already typed something).
  useEffect(() => {
    if (reminderTouched || !outcome) return;
    const offset = computeNextReminderOffset(outcome as FollowUpOutcome);
    setReminderDate(offset != null ? isoAfter(date, offset) : "");
  }, [outcome, date, reminderTouched]);

  const canSave = note.trim().length > 0 && !!date;
  const showLifecycleWon = preLifecycle && outcome === "won";
  const showLifecycleLost = preLifecycle && outcome === "lost";

  function handleSave() {
    if (!canSave) return;
    const iso = new Date(`${date}T12:00:00`).toISOString();
    const reminder = reminderDate ? inputDateToDisplay(reminderDate) : undefined;

    if (isEdit && existing) {
      updateFollowUp(existing.id, {
        channel, isoDate: iso, note: note.trim(),
        outcome: outcome || undefined, nextReminderDate: reminder,
      });
      toast.success("Follow-up updated");
    } else {
      logFollowUp({
        projectId: project.id,
        isoDate: iso,
        channel,
        by: me.name,
        note: note.trim(),
        outcome: outcome || undefined,
        nextReminderDate: reminder,
      });
      toast.success("Follow-up logged", {
        description: reminder ? `Next reminder set for ${reminder}` : undefined,
      });
    }

    // Sync reminder onto the project so pipeline "overdue" badges pick it up.
    if (reminder) {
      updateProject(project.id, { followUpReminderDate: reminder });
    }

    // Optional lifecycle transition when the tender outcome is decisive.
    if (!isEdit && applyLifecycle) {
      if (showLifecycleWon) {
        // Award = frozen baseline + procurement seed + default team.
        // User can re-assign later on Team & Roles. Defaults mirror the
        // active seed team so the demo shows a full handoff immediately.
        const active = team.filter((t) => t.status === "active");
        const result = awardProject(project, {
          assignedPm: active.find((t) => t.tier === "Admin")?.id,
          assignedQs: active.find((t) => t.tier === "Pro Control")?.id,
          assignedSiteLead: active.find((t) => t.role.toLowerCase().includes("site"))?.id,
          actor: me.name,
        });
        toast.success(`${project.name} awarded & handed off`, {
          description: `Baseline frozen · ${result.seededCallOffs} draft call-offs · ${result.assignments} team assignments.`,
        });
      } else if (showLifecycleLost) {
        markLost(project.id, note.trim() || "Follow-up outcome", competitor.trim() || "Unknown");
        toast.success(`${project.name} marked as Lost`);
      }
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit follow-up" : "Log follow-up"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this entry — history and reminder refresh immediately."
              : "Record an email, call or meeting. Added to the history immediately."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fu-channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                <SelectTrigger id="fu-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fu-date">Date</Label>
              <Input
                id="fu-date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fu-outcome">Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as FollowUpOutcome)}>
              <SelectTrigger id="fu-outcome"><SelectValue placeholder="Select outcome" /></SelectTrigger>
              <SelectContent>
                {outcomes.map((o) => (
                  <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fu-note">Notes</Label>
            <Textarea
              id="fu-note"
              placeholder="e.g. Spoke with James, said pricing review by Friday."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fu-reminder" className="flex items-center justify-between">
              <span>Next follow-up</span>
              {reminderDate && (
                <button
                  type="button"
                  onClick={() => { setReminderDate(""); setReminderTouched(true); }}
                  className="text-[10.5px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                >
                  Clear
                </button>
              )}
            </Label>
            <Input
              id="fu-reminder"
              type="date"
              min={today}
              value={reminderDate}
              onChange={(e) => { setReminderDate(e.target.value); setReminderTouched(true); }}
            />
            <p className="text-[10.5px] text-[var(--ink-500)]">
              Auto-suggested from the outcome. Overrides the project&apos;s current reminder.
            </p>
          </div>

          {!isEdit && showLifecycleWon && (
            <label className="flex items-start gap-2 rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/10 p-2.5 text-[12px]">
              <input
                type="checkbox"
                checked={applyLifecycle}
                onChange={(e) => setApplyLifecycle(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1 font-semibold text-[var(--ink-900)]">
                  <Trophy className="h-3.5 w-3.5 text-[var(--green-600)]" />
                  Also mark {project.name} as Active
                </span>
                <span className="text-[var(--ink-500)]">
                  Freezes the estimator baseline (V1 BoQ becomes the contractual snapshot).
                </span>
              </span>
            </label>
          )}
          {!isEdit && showLifecycleLost && (
            <div className="space-y-2 rounded-md border border-[var(--red-500)]/30 bg-[var(--red-500)]/10 p-2.5 text-[12px]">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={applyLifecycle}
                  onChange={(e) => setApplyLifecycle(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-1 font-semibold text-[var(--ink-900)]">
                    <XCircle className="h-3.5 w-3.5 text-[var(--red-500)]" />
                    Also mark {project.name} as Lost
                  </span>
                  <span className="text-[var(--ink-500)]">
                    Uses this note as the reason. Bid moves to the Lost stage.
                  </span>
                </span>
              </label>
              {applyLifecycle && (
                <Input
                  placeholder="Lost to (competitor, optional)"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  className="h-8 text-[12px]"
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEdit ? "Save changes" : "Save follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Add `days` calendar days to a yyyy-mm-dd input value; return yyyy-mm-dd. */
function isoAfter(inputDate: string, days: number): string {
  const d = new Date(`${inputDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}