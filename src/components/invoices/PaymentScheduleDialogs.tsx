import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordInvoiceAction, PAY_METHODS, PAYMENT_BATCHES } from "@/lib/invoiceActions";
import type { ScheduledPayment } from "@/lib/invoiceWorkflow";
import { CalendarPlus, Banknote } from "lucide-react";
import { toast } from "sonner";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-[var(--ink-700)]">{label}</Label>
      {children}
      {hint && <p className="text-[10.5px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}

function Summary({ row }: { row: ScheduledPayment }) {
  return (
    <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] p-3 text-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono-num font-semibold">{row.ref} · {row.supplier}</p>
        <p className="font-mono-num text-[13px] font-semibold">£{row.amount.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ── Add invoice to a payment batch ──────────────────────────────────────────
export function AddToBatchDialog({ row, open, onOpenChange }: { row: ScheduledPayment; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [batch, setBatch] = useState(PAYMENT_BATCHES[0].code);
  const [note, setNote] = useState("");
  const submit = () => {
    const b = PAYMENT_BATCHES.find((x) => x.code === batch)!;
    recordInvoiceAction({
      ref: row.ref,
      kind: "schedule",
      stageAfter: "scheduled",
      paymentBatch: b.code,
      payDate: b.payDate,
      note,
      amount: row.amount,
    });
    toast.success(`${row.ref} added to ${b.code}`, { description: `Pay date ${b.payDate}` });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-[var(--accent-500)]" /> Add to payment batch</DialogTitle>
          <DialogDescription>Schedules the invoice into a pay run. Moves workflow stage to <strong>Scheduled</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary row={row} />
          <Field label="Payment batch">
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_BATCHES.map((b) => (
                  <SelectItem key={b.code} value={b.code} className="text-[12px]">
                    {b.label} <span className="ml-1 text-[10.5px] text-[var(--ink-500)]">· {b.payDate}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Note (optional)" hint="Visible to Finance on the batch.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-[12px]" placeholder="e.g. priority — supplier offered 2% early-pay discount" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><CalendarPlus className="mr-1 h-3 w-3" /> Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mark paid ───────────────────────────────────────────────────────────────
export function MarkPaidDialog({ row, open, onOpenChange }: { row: ScheduledPayment; open: boolean; onOpenChange: (v: boolean) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [method, setMethod] = useState("faster");
  const [reference, setReference] = useState(`PAY-${row.ref}`);
  const [payDate, setPayDate] = useState(today);
  const [amount, setAmount] = useState(String(row.amount));
  const submit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.warning("Enter the paid amount"); return; }
    if (!reference.trim()) { toast.warning("Add a bank reference"); return; }
    recordInvoiceAction({
      ref: row.ref,
      kind: "pay",
      stageAfter: "paid",
      reasonCode: method,
      reason: PAY_METHODS.find((m) => m.code === method)?.label,
      note: `Ref ${reference}`,
      amount: num,
      payDate,
      paymentBatch: row.batch,
    });
    toast.success(`${row.ref} marked paid`, { description: `£${num.toLocaleString()} · ${PAY_METHODS.find((m) => m.code === method)?.label} · ${reference}` });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Banknote className="h-4 w-4 text-[var(--green-600)]" /> Mark invoice paid</DialogTitle>
          <DialogDescription>Records the payment, locks the value into actuals and closes the workflow at <strong>Paid</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary row={row} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pay method">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAY_METHODS.map((m) => <SelectItem key={m.code} value={m.code} className="text-[12px]">{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pay date">
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-9 text-[12px]" />
            </Field>
            <Field label="Amount paid (£)" hint="Allow part-payments by reducing this.">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-[12px] font-mono-num" />
            </Field>
            <Field label="Bank reference">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="h-9 text-[12px] font-mono-num" />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><Banknote className="mr-1 h-3 w-3" /> Confirm payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New batch (project-level action, not tied to a single invoice) ──────────
export function NewBatchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const next = PAYMENT_BATCHES[0];
  const [code, setCode] = useState(`PAY-2026-${String(12 + Math.floor(Math.random() * 4)).padStart(2, "0")}`);
  const [payDate, setPayDate] = useState(next.payDate);
  const [note, setNote] = useState("");
  const submit = () => {
    if (!code.trim()) { toast.warning("Add a batch code"); return; }
    recordInvoiceAction({
      ref: "BATCH",          // not tied to a single invoice
      kind: "create-batch",
      stageAfter: "scheduled",
      paymentBatch: code,
      payDate,
      note,
    });
    toast.success(`Batch ${code} created`, { description: `Pay date ${payDate}` });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-[var(--accent-500)]" /> New payment batch</DialogTitle>
          <DialogDescription>Open a new pay-run so QS can drop approved invoices into it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Batch code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-[12px] font-mono-num" />
          </Field>
          <Field label="Pay date">
            <Input type="text" value={payDate} onChange={(e) => setPayDate(e.target.value)} placeholder="e.g. 24 May" className="h-9 text-[12px]" />
          </Field>
          <Field label="Note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-[12px]" placeholder="e.g. month-end run · cap £50k" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><CalendarPlus className="mr-1 h-3 w-3" /> Create batch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}