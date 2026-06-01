import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SNOOZE_PRESETS, resolvePreset, recordSnooze } from "@/lib/focusSnooze";
import { Clock, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SnoozeDialog({
  open,
  onOpenChange,
  focusId,
  title,
  defaultDeliveryDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  focusId: string;
  title: string;
  defaultDeliveryDate?: string;
}) {
  const [preset, setPreset] = useState("4h");
  const [newDate, setNewDate] = useState(defaultDeliveryDate ?? "");
  const [reason, setReason] = useState("");

  const submit = () => {
    const until = resolvePreset(preset);
    recordSnooze({
      id: focusId,
      snoozedUntil: until.toISOString(),
      newDeliveryDate: newDate || undefined,
      reason: reason || undefined,
    });
    toast.success("Snoozed", {
      description: newDate
        ? `Hidden until ${until.toLocaleString()} · delivery moved to ${newDate}`
        : `Hidden until ${until.toLocaleString()}`,
    });
    onOpenChange(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--accent-500)]" /> Snooze focus item
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[var(--ink-700)]">Hide from Focus for</Label>
            <div className="grid grid-cols-2 gap-2">
              {SNOOZE_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setPreset(p.code)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-[12px] transition-colors",
                    preset === p.code
                      ? "border-[var(--accent-500)] bg-[var(--accent-500)]/5 text-[var(--ink-900)]"
                      : "border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--ink-50)]",
                  )}
                >
                  <p className="font-semibold">{p.label}</p>
                  <p className="mt-0.5 font-mono-num text-[10.5px] text-[var(--ink-500)]">
                    until {resolvePreset(p.code).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-700)]">
              <CalendarClock className="h-3.5 w-3.5" /> Reschedule delivery to <span className="font-normal text-[var(--ink-500)]">(optional)</span>
            </Label>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-9 text-[12px]" />
            <p className="text-[10.5px] text-[var(--ink-500)]">
              Pushes the call-off's required-by date in the workflow. Leave blank to only snooze the reminder.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[var(--ink-700)]">Reason <span className="font-normal text-[var(--ink-500)]">(optional)</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Awaiting confirmation from Minster on revised rate"
              className="text-[12px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Snooze</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}