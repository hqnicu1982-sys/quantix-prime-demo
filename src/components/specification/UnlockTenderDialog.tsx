import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Unlock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { unlockTender } from "@/lib/drawingRegistry";
import { useCurrentUser } from "@/lib/currentUser";

export function UnlockTenderDialog({
  projectId, open, onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const [reason, setReason] = useState("");

  function handleUnlock() {
    const r = unlockTender(projectId, me.name, reason);
    if (!r.ok) {
      toast.error(r.error === "needs-reason" ? "Provide a reason" : "Tender is not locked");
      return;
    }
    toast.success("Tender baseline unlocked");
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-[var(--red-500)]" />
            Unlock tender baseline
          </DialogTitle>
          <DialogDescription>
            Tender revisions become editable again. Use only when the client re-issues the tender set.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 rounded-md border border-[var(--red-500)]/30 bg-[var(--red-500)]/10 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--red-500)] mt-0.5" />
            <p className="text-[11.5px] text-[var(--ink-700)]">
              Any in-flight compare against the previous baseline becomes ambiguous.
              The unlock is logged in the audit trail.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unlock-reason">Reason*</Label>
            <Textarea
              id="unlock-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client re-issued package B with revised scope on 18 Jun."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleUnlock} disabled={!reason.trim()}>
            <Unlock className="mr-1.5 h-3.5 w-3.5" /> Unlock baseline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}