import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { issueTenderSet, useDrawings, groupByDrawing } from "@/lib/drawingRegistry";
import { useCurrentUser } from "@/lib/currentUser";

export function IssueTenderSetDialog({
  projectId, open, onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const state = useDrawings(projectId);
  const tenderRevs = state.revisions.filter((r) => r.isTender);
  const groups = groupByDrawing(state).filter((g) => g.tender);

  function handleIssue() {
    const r = issueTenderSet(projectId, me.name);
    if (!r.ok) {
      toast.error(r.error === "already-locked" ? "Tender set already issued" : "No tender revisions to issue");
      return;
    }
    toast.success(`Tender set issued · ${tenderRevs.length} drawings frozen`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--amber-500)]" />
            Issue tender set
          </DialogTitle>
          <DialogDescription>
            Freezes the tender baseline so future revisions can be compared against it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--amber-500)] mt-0.5" />
            <p className="text-[11.5px] text-[var(--ink-700)]">
              After issue, these {tenderRevs.length} drawings become read-only.
              New uploads will enter review before becoming current.
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-md border border-[var(--ink-200)] divide-y divide-[var(--ink-200)]">
            {groups.map((g) => (
              <div key={g.drawingNumber} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">{g.drawingNumber}</p>
                  <p className="truncate text-[11px] text-[var(--ink-500)]">{g.title ?? g.discipline}</p>
                </div>
                <span className="rounded bg-[var(--ink-50)] px-1.5 py-0.5 text-[10.5px] font-semibold">
                  {g.tender!.revisionCode}
                </span>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="p-4 text-center text-[11.5px] text-[var(--ink-500)]">No tender revisions to issue.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleIssue} disabled={tenderRevs.length === 0}>
            <Lock className="mr-1.5 h-3.5 w-3.5" /> Issue & lock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}