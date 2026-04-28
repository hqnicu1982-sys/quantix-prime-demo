import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Calendar, User } from "lucide-react";
import {
  deleteVariation,
  setStatus,
  type ProjectVariation,
} from "@/lib/variations";
import { VariationStatusBadge } from "./VariationStatusBadge";
import { toast } from "sonner";

const fmtMoney = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

const raisedByLabel: Record<string, string> = {
  client: "Client",
  contractor: "Main contractor",
  designer: "Designer / MEP",
  site: "Site team",
};

export function VariationDetailDialog({
  projectId,
  variation,
  open,
  onOpenChange,
}: {
  projectId: string;
  variation: ProjectVariation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approvedValue, setApprovedValue] = useState<string>("");
  const [rejectedReason, setRejectedReason] = useState<string>("");

  if (!variation) return null;

  const v = variation;

  const handleSubmit = () => {
    setStatus(projectId, v.id, "submitted");
    toast.success(`${v.id} submitted to client`);
    onOpenChange(false);
  };
  const handleApprove = () => {
    const val = Number(approvedValue);
    setStatus(projectId, v.id, "approved", { approvedValue: Number.isFinite(val) ? val : v.costImpact });
    toast.success(`${v.id} approved`, { description: fmtMoney(Number.isFinite(val) ? val : v.costImpact) });
    setApproveOpen(false);
    onOpenChange(false);
  };
  const handleReject = () => {
    setStatus(projectId, v.id, "rejected", { rejectedReason });
    toast.error(`${v.id} rejected`);
    setRejectOpen(false);
    setRejectedReason("");
    onOpenChange(false);
  };
  const handleReopen = () => {
    setStatus(projectId, v.id, "draft");
    toast.message(`${v.id} reopened to draft`);
  };
  const handleDelete = () => {
    if (!confirm(`Delete ${v.id}? This cannot be undone.`)) return;
    deleteVariation(projectId, v.id);
    toast.message(`${v.id} deleted`);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--ink-100)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--ink-700)]">
                {v.id}
              </span>
              <VariationStatusBadge status={v.status} />
            </div>
            <DialogTitle className="pt-1">{v.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" /> {raisedByLabel[v.raisedBy] ?? v.raisedBy}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Raised {v.raisedDate}
              </span>
              {v.approvedDate && <span>· Approved {v.approvedDate}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {v.reason && (
              <div>
                <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Reason</p>
                <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">{v.reason}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-[var(--ink-200)] p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Cost impact</p>
                <p className={`mt-1 font-display text-[20px] font-semibold tabular-nums ${v.costImpact < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]"}`}>
                  {fmtMoney(v.costImpact)}
                </p>
              </div>
              {v.status === "approved" && v.approvedValue !== undefined && (
                <div className="rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--green-600)]">Approved value</p>
                  <p className="mt-1 font-display text-[20px] font-semibold tabular-nums text-[var(--green-600)]">
                    {fmtMoney(v.approvedValue)}
                  </p>
                </div>
              )}
              <div className="rounded-md border border-[var(--ink-200)] p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Time impact</p>
                <p className="mt-1 font-display text-[20px] font-semibold tabular-nums">
                  {v.timeImpactDays > 0 ? "+" : ""}{v.timeImpactDays} days
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                Changes ({v.changes.length})
              </p>
              <div className="overflow-hidden rounded-md border border-[var(--ink-200)]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[var(--ink-50)]/60 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                    <tr>
                      <th className="px-3 py-2 text-left">Op</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ink-200)]">
                    {v.changes.map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 capitalize text-[var(--ink-500)]">{c.op.replace("_", " ")}</td>
                        <td className="px-3 py-2">{c.description}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.qty ?? "—"}</td>
                        <td className="px-3 py-2">{c.unit ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.ratePerUnit !== undefined ? fmtMoney(c.ratePerUnit) : "—"}</td>
                        <td className={`px-3 py-2 text-right font-semibold tabular-nums ${c.lineTotal < 0 ? "text-[var(--red-500)]" : ""}`}>
                          {fmtMoney(c.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {v.attachments.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Attachments</p>
                <ul className="space-y-1">
                  {v.attachments.map((a, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-700)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--accent-500)]" /> {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {v.status === "rejected" && v.rejectedReason && (
              <div className="rounded-md border border-[var(--red-500)]/30 bg-[var(--red-500)]/5 p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--red-500)]">Rejected reason</p>
                <p className="mt-1 text-[13px] text-[var(--ink-700)]">{v.rejectedReason}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            {v.status === "draft" && (
              <>
                <Button variant="outline" onClick={handleDelete}>Delete</Button>
                <Button onClick={handleSubmit}>Submit to client</Button>
              </>
            )}
            {v.status === "submitted" && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
                <Button onClick={() => { setApprovedValue(String(v.costImpact)); setApproveOpen(true); }}>
                  Approve
                </Button>
              </>
            )}
            {(v.status === "approved" || v.status === "rejected") && (
              <Button variant="outline" onClick={handleReopen}>Reopen to draft</Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve {v.id}</DialogTitle>
            <DialogDescription>Confirm the value the client has approved. May differ from the calculated impact.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label htmlFor="approved-val">Approved value (£)</Label>
            <Input
              id="approved-val"
              type="number"
              value={approvedValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setApprovedValue(e.target.value)}
            />
            <p className="text-[11px] text-[var(--ink-500)]">Calculated impact: {fmtMoney(v.costImpact)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove}>Confirm approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {v.id}</DialogTitle>
            <DialogDescription>Add a short reason for the audit trail.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              rows={3}
              placeholder="e.g. Client confirmed original spec is sufficient."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={handleReject}>Reject variation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}