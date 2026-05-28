import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import type { Invoice } from "@/lib/mockData";
import { recordInvoiceAction, VARIANCE_REASONS, DISPUTE_REASONS, CREDIT_REASONS } from "@/lib/invoiceActions";
import { ShieldCheck, X, Mail } from "lucide-react";
import { toast } from "sonner";

type Props = { inv: Invoice; open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-[var(--ink-700)]">{label}</Label>
      {children}
      {hint && <p className="text-[10.5px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}

function Summary({ inv, tone }: { inv: Invoice; tone: "warning" | "danger" | "info" }) {
  return (
    <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] p-3 text-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono-num font-semibold">{inv.id} · {inv.supplier}</p>
          <p className="text-[11px] text-[var(--ink-500)]">{inv.poRef} · {inv.callOffRef} · received {inv.received}</p>
        </div>
        <div className="text-right">
          <p className="font-mono-num text-[13px] font-semibold">£{inv.invoiced.toLocaleString()}</p>
          {inv.variance > 0 && (
            <StatusBadge tone={tone}>+£{inv.variance.toLocaleString()} ({inv.variancePct}%)</StatusBadge>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--ink-700)]">{inv.lineDetail}</p>
    </div>
  );
}

// ── Accept variance ─────────────────────────────────────────────────────────
export function AcceptVarianceDialog({ inv, open, onOpenChange, onDone }: Props) {
  const [reason, setReason] = useState("framework-rate");
  const [note, setNote] = useState("");
  const submit = () => {
    recordInvoiceAction({
      ref: inv.id,
      kind: "accept-variance",
      stageAfter: "approved",
      reasonCode: reason,
      reason: VARIANCE_REASONS.find((r) => r.code === reason)?.label,
      note,
      amount: inv.variance,
    });
    toast.success(`${inv.id} approved`, { description: `Variance £${inv.variance.toLocaleString()} accepted · cleared for next pay run` });
    onOpenChange(false);
    onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--green-600)]" /> Accept variance</DialogTitle>
          <DialogDescription>Approve the invoice despite the variance. The decision is audit-logged and moves the invoice to <strong>Approved</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary inv={inv} tone="warning" />
          <Field label="Reason code" hint="Why the variance is acceptable. Required for commercial sign-off.">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VARIANCE_REASONS.map((r) => <SelectItem key={r.code} value={r.code} className="text-[12px]">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="QS note" hint="Visible to Finance on the payment schedule.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. agreed verbally with Sam at CCF on 18 Apr — applies to all Q2 orders" rows={3} className="text-[12px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={reason === "other" && !note.trim()}>
            <ShieldCheck className="mr-1 h-3 w-3" /> Accept & approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dispute ─────────────────────────────────────────────────────────────────
export function DisputeDialog({ inv, open, onOpenChange, onDone }: Props) {
  const [reason, setReason] = useState("over-delivery");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const submit = () => {
    if (!note.trim()) { toast.warning("Add a description"); return; }
    recordInvoiceAction({
      ref: inv.id,
      kind: "dispute",
      stageAfter: "review",
      reasonCode: reason,
      reason: DISPUTE_REASONS.find((r) => r.code === reason)?.label,
      note,
      amount: inv.variance,
    });
    toast.error(`${inv.id} disputed`, { description: notify ? `${inv.supplier} notified by email` : "Dispute logged internally" });
    onOpenChange(false);
    onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><X className="h-4 w-4 text-[var(--red-500)]" /> Dispute invoice</DialogTitle>
          <DialogDescription>Reject the invoice and put it back to the supplier. Stays in <strong>QS review</strong> until resolved or a credit note is received.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary inv={inv} tone="danger" />
          <Field label="Dispute reason">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((r) => <SelectItem key={r.code} value={r.code} className="text-[12px]">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Detail" hint="Will be sent to the supplier and stored on the audit log.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. site signed for 420 m² on DEL-9918 — invoice claims 445 m². Please re-issue or send credit." rows={4} className="text-[12px]" />
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-3.5 w-3.5" />
            Email <strong>{inv.supplier}</strong> with the dispute now
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" variant="destructive" onClick={submit}>
            <X className="mr-1 h-3 w-3" /> Raise dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Request credit note ─────────────────────────────────────────────────────
export function RequestCreditDialog({ inv, open, onOpenChange, onDone }: Props) {
  const [reason, setReason] = useState("rate-correction");
  const [amount, setAmount] = useState(String(inv.variance || 0));
  const [note, setNote] = useState("");
  const submit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.warning("Enter a credit amount"); return; }
    recordInvoiceAction({
      ref: inv.id,
      kind: "request-credit",
      stageAfter: "review",
      reasonCode: reason,
      reason: CREDIT_REASONS.find((r) => r.code === reason)?.label,
      note,
      creditAmount: num,
    });
    toast.success("Credit note requested", { description: `${inv.supplier} asked for £${num.toLocaleString()} credit` });
    onOpenChange(false);
    onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--accent-500)]" /> Request credit note</DialogTitle>
          <DialogDescription>Ask the supplier for a credit note that offsets the variance. The invoice remains in <strong>QS review</strong> with a credit-pending flag.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary inv={inv} tone="info" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reason">
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CREDIT_REASONS.map((r) => <SelectItem key={r.code} value={r.code} className="text-[12px]">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Credit amount (£)" hint="Pre-filled with the variance.">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-[12px] font-mono-num" />
            </Field>
          </div>
          <Field label="Message to supplier">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Please issue a credit note for £${inv.variance.toLocaleString()} against ${inv.id} — see attached GRN.`} rows={3} className="text-[12px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>
            <Mail className="mr-1 h-3 w-3" /> Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Combined trigger row used across the module ─────────────────────────────
export function InvoiceActionButtons({ inv, size = "sm" }: { inv: Invoice; size?: "sm" | "default" }) {
  const [open, setOpen] = useState<null | "accept" | "dispute" | "credit">(null);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size={size} onClick={() => setOpen("accept")}><ShieldCheck className="mr-1 h-3 w-3" /> Accept variance</Button>
        <Button size={size} variant="outline" onClick={() => setOpen("dispute")}><X className="mr-1 h-3 w-3" /> Dispute</Button>
        <Button size={size} variant="outline" onClick={() => setOpen("credit")}><Mail className="mr-1 h-3 w-3" /> Request credit note</Button>
      </div>
      <AcceptVarianceDialog inv={inv} open={open === "accept"} onOpenChange={(v) => setOpen(v ? "accept" : null)} />
      <DisputeDialog inv={inv} open={open === "dispute"} onOpenChange={(v) => setOpen(v ? "dispute" : null)} />
      <RequestCreditDialog inv={inv} open={open === "credit"} onOpenChange={(v) => setOpen(v ? "credit" : null)} />
    </>
  );
}