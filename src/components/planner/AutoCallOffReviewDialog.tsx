import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Truck, AlertTriangle, Clock, CheckCircle2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  acceptProposals,
  urgencyLabel,
  type CallOffProposal,
} from "@/lib/callOffPlanning";

export function AutoCallOffReviewDialog({
  projectId,
  proposals,
  open,
  onOpenChange,
}: {
  projectId: string;
  proposals: CallOffProposal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [supplierEdits, setSupplierEdits] = useState<Record<string, string>>({});

  // Default all to checked on first render of a new proposal set.
  const allKeys = useMemo(() => proposals.map((p) => p.key).sort().join("|"), [proposals]);
  useMemo(() => {
    const fresh: Record<string, boolean> = {};
    for (const p of proposals) fresh[p.key] = !p.supplierMissing;
    setSelected(fresh);
    setSupplierEdits({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allKeys]);

  const toggleAll = (on: boolean) => {
    const next: Record<string, boolean> = {};
    for (const p of proposals) next[p.key] = on;
    setSelected(next);
  };

  const acceptedKeys = proposals.filter((p) => selected[p.key]).map((p) => p.key);

  const canAccept =
    acceptedKeys.length > 0 &&
    proposals
      .filter((p) => selected[p.key])
      .every((p) => !p.supplierMissing || (supplierEdits[p.key] ?? "").trim().length > 0);

  const accept = () => {
    const toAccept = proposals.filter((p) => selected[p.key]);
    const edits = Object.fromEntries(
      Object.entries(supplierEdits).map(([k, v]) => [k, { supplier: v }]),
    );
    const ids = acceptProposals(projectId, toAccept, edits);
    toast.success(`${ids.length} call-off draft${ids.length === 1 ? "" : "s"} created`, {
      description: "Open Call-offs to review and send.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Auto-generated call-offs</DialogTitle>
          <DialogDescription>
            Suggested from planner tasks that have material requirements not yet covered by an
            existing call-off. Nothing leaves Quantix — these are saved as drafts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-[12px] text-[var(--ink-500)]">
          <span>
            {proposals.length} proposal{proposals.length === 1 ? "" : "s"} ·{" "}
            {acceptedKeys.length} selected
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => toggleAll(true)}>
              Select all
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => toggleAll(false)}>
              Clear
            </Button>
          </div>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
          {proposals.map((p) => (
            <ProposalCard
              key={p.key}
              proposal={p}
              checked={!!selected[p.key]}
              onToggle={(v) => setSelected((s) => ({ ...s, [p.key]: v }))}
              supplierOverride={supplierEdits[p.key] ?? ""}
              onSupplierChange={(v) => setSupplierEdits((s) => ({ ...s, [p.key]: v }))}
            />
          ))}
          {proposals.length === 0 && (
            <p className="rounded-md border border-dashed border-[var(--ink-200)] p-6 text-center text-[12px] text-[var(--ink-500)]">
              Everything material-side is covered.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={accept} disabled={!canAccept}>
            <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
            Create {acceptedKeys.length} draft{acceptedKeys.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProposalCard({
  proposal,
  checked,
  onToggle,
  supplierOverride,
  onSupplierChange,
}: {
  proposal: CallOffProposal;
  checked: boolean;
  onToggle: (v: boolean) => void;
  supplierOverride: string;
  onSupplierChange: (v: string) => void;
}) {
  const urgencyTone =
    proposal.urgency === "overdue"
      ? "bg-[var(--red-500)]/10 text-[var(--red-500)]"
      : proposal.urgency === "imminent"
        ? "bg-[var(--amber-500)]/15 text-[var(--amber-500)]"
        : "bg-[var(--green-600)]/10 text-[var(--green-600)]";
  const UrgencyIcon =
    proposal.urgency === "overdue" ? AlertTriangle : proposal.urgency === "imminent" ? Clock : CheckCircle2;
  return (
    <div
      className={cn(
        "rounded-md border p-3 transition",
        checked ? "border-[var(--accent-500)]/40 bg-[var(--accent-500)]/[0.03]" : "border-[var(--ink-200)] bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onToggle(v === true)}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-[var(--ink-500)]" />
            {proposal.supplierMissing ? (
              <Input
                value={supplierOverride}
                onChange={(e) => onSupplierChange(e.target.value)}
                placeholder="Pick supplier…"
                className="h-7 w-[200px] text-[12px]"
              />
            ) : (
              <span className="text-[13px] font-semibold text-[var(--ink-900)]">{proposal.supplier}</span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                urgencyTone,
              )}
            >
              <UrgencyIcon className="h-3 w-3" />
              {urgencyLabel(proposal.urgency, proposal.daysUntilSendBy)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--ink-500)]">
            Needed on site <span className="font-mono">{proposal.neededOn}</span> · send by{" "}
            <span className="font-mono">{proposal.sendBy}</span>
          </p>

          <ul className="mt-2 divide-y divide-[var(--ink-100)] rounded border border-[var(--ink-200)] text-[11.5px]">
            {proposal.lines.map((l) => (
              <li key={l.lineId} className="flex items-center justify-between px-2 py-1.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--ink-900)]">{l.material}</p>
                  <p className="text-[10.5px] text-[var(--ink-500)]">
                    {l.sourceTaskIds.join(", ")} · lead {l.leadTimeDays}d
                    {l.leadTimePresumed && (
                      <span className="ml-1 rounded bg-[var(--ink-100)] px-1 py-px text-[9.5px] uppercase tracking-wider text-[var(--ink-500)]">
                        assumed
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-mono text-[12px] tabular-nums text-[var(--ink-700)]">
                  {l.qty} {l.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}