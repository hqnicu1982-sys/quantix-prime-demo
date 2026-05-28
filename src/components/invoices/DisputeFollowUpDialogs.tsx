import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordInvoiceAction, CHASE_CHANNELS, RESOLVE_OUTCOMES } from "@/lib/invoiceActions";
import type { DisputeRecord } from "@/lib/invoiceWorkflow";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = { row: DisputeRecord; open: boolean; onOpenChange: (v: boolean) => void };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-[var(--ink-700)]">{label}</Label>
      {children}
      {hint && <p className="text-[10.5px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}

function Summary({ row }: { row: DisputeRecord }) {
  return (
    <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] p-3 text-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono-num font-semibold">{row.ref} · {row.supplier}</p>
          <p className="text-[11px] text-[var(--ink-500)]">raised {row.raised} · owner {row.owner}</p>
        </div>
        <p className="font-mono-num text-[13px] font-semibold text-[var(--red-500)]">£{row.amount.toLocaleString()}</p>
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--ink-700)]">{row.reason}</p>
    </div>
  );
}

// ── Chase supplier ──────────────────────────────────────────────────────────
export function ChaseDialog({ row, open, onOpenChange }: Props) {
  const [channel, setChannel] = useState("email");
  const [contact, setContact] = useState(`accounts@${row.supplier.toLowerCase().replace(/\s+/g, "")}.co.uk`);
  const [msg, setMsg] = useState(`Following up on dispute for ${row.ref} (£${row.amount.toLocaleString()}). Please confirm credit note ETA.`);
  const submit = () => {
    if (!msg.trim()) { toast.warning("Add a message"); return; }
    recordInvoiceAction({
      ref: row.ref,
      kind: "chase",
      stageAfter: "review",
      reasonCode: channel,
      reason: CHASE_CHANNELS.find((c) => c.code === channel)?.label,
      note: msg,
      amount: row.amount,
    });
    toast.success(`Chaser sent to ${row.supplier}`, { description: channel === "phone" ? "Call logged on dispute" : `Sent to ${contact}` });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--accent-500)]" /> Chase supplier</DialogTitle>
          <DialogDescription>Send a reminder and log the contact attempt against the dispute timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary row={row} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHASE_CHANNELS.map((c) => <SelectItem key={c.code} value={c.code} className="text-[12px]">{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contact" hint="Email, phone or portal user.">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} className="h-9 text-[12px]" />
            </Field>
          </div>
          <Field label="Message">
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="text-[12px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><Mail className="mr-1 h-3 w-3" /> Send chaser</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Resolve dispute ─────────────────────────────────────────────────────────
export function ResolveDisputeDialog({ row, open, onOpenChange }: Props) {
  const [outcome, setOutcome] = useState("credit-received");
  const [credit, setCredit] = useState(String(row.amount));
  const [note, setNote] = useState("");
  const submit = () => {
    const o = RESOLVE_OUTCOMES.find((x) => x.code === outcome)!;
    const num = parseFloat(credit) || 0;
    recordInvoiceAction({
      ref: row.ref,
      kind: "resolve-dispute",
      stageAfter: o.stage,
      reasonCode: outcome,
      reason: o.label,
      note,
      creditAmount: outcome === "credit-received" || outcome === "written-off" ? num : undefined,
      amount: row.amount,
    });
    toast.success(`${row.ref} resolved`, { description: `${o.label} · stage → ${o.stage}` });
    onOpenChange(false);
  };
  const showCredit = outcome === "credit-received" || outcome === "written-off";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--green-600)]" /> Resolve dispute</DialogTitle>
          <DialogDescription>Close the dispute and move the invoice to its next workflow stage.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Summary row={row} />
          <Field label="Outcome" hint="Determines the next workflow stage.">
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESOLVE_OUTCOMES.map((o) => <SelectItem key={o.code} value={o.code} className="text-[12px]">{o.label} <span className="ml-1 text-[10.5px] text-[var(--ink-500)]">→ {o.stage}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          {showCredit && (
            <Field label={outcome === "written-off" ? "Write-off amount (£)" : "Credit applied (£)"}>
              <Input type="number" min={0} value={credit} onChange={(e) => setCredit(e.target.value)} className="h-9 text-[12px] font-mono-num" />
            </Field>
          )}
          <Field label="Resolution note">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="text-[12px]" placeholder="e.g. credit note CN-4421 received 22 Apr — posted against PO-00245" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><CheckCircle2 className="mr-1 h-3 w-3" /> Close dispute</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}