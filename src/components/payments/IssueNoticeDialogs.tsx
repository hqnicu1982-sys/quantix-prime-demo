import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import {
  type PaymentApplication,
  issuePaymentNotice,
  issuePayLessNotice,
  issueCertificate,
  recordPayment,
} from "@/lib/paymentCycle";
import { addInvoice } from "@/lib/invoiceRegistry";
import { fmtMoney } from "@/lib/mockData";

// ---------- Payment Notice ---------------------------------------------------

export function PaymentNoticeDialog({
  open, onOpenChange, projectId, application,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  application: PaymentApplication | null;
}) {
  const [amount, setAmount] = useState(application?.netThisApplication ?? 0);
  const [notes, setNotes] = useState("");

  if (!application) return null;

  const handle = () => {
    const parsed = z.object({ amount: z.number().min(0), notes: z.string().max(500).optional() }).safeParse({ amount, notes });
    if (!parsed.success) {
      toast.error("Invalid input", { description: parsed.error.issues[0].message });
      return;
    }
    issuePaymentNotice(projectId, { applicationId: application.id, certifiedAmount: amount, notes });
    toast.success("Payment Notice issued", { description: `${application.appNumber} · ${fmtMoney(amount)} certified` });
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Payment Notice — {application.appNumber}</DialogTitle>
          <DialogDescription>
            Subbie applied for <strong>{fmtMoney(application.netThisApplication)}</strong>. Enter the amount you certify as due.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cert-amt">Certified amount £</Label>
            <Input id="cert-amt" type="number" min={0} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Reasons for any reduction…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle}>Issue Notice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Pay Less Notice --------------------------------------------------

export function PayLessNoticeDialog({
  open, onOpenChange, projectId, application,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  application: PaymentApplication | null;
}) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  if (!application || !application.noticeId) return null;

  const handle = () => {
    const parsed = z.object({
      amount: z.number().min(0.01, "Withholding must be > 0"),
      reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500),
    }).safeParse({ amount, reason });
    if (!parsed.success) {
      toast.error("Check the form", { description: parsed.error.issues[0].message });
      return;
    }
    issuePayLessNotice(projectId, {
      applicationId: application.id,
      noticeId: application.noticeId!,
      withholdingAmount: amount,
      reason,
    });
    toast.success("Pay Less Notice issued", { description: `${fmtMoney(amount)} withheld` });
    setAmount(0); setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Pay Less Notice — {application.appNumber}</DialogTitle>
          <DialogDescription>
            Must be issued at least 1 day before the final date for payment ({application.finalDateForPayment}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="wh-amt">Amount being withheld £</Label>
            <Input id="wh-amt" type="number" min={0} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="wh-reason">Reason for withholding (required)</Label>
            <Textarea id="wh-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle} className="bg-[var(--amber-500)] hover:bg-[var(--amber-500)]/90">Issue Pay Less</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Certificate ------------------------------------------------------

export function CertificateDialog({
  open, onOpenChange, projectId, application, ourRole, counterparty,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  application: PaymentApplication | null;
  ourRole: "subcontractor" | "main_contractor";
  counterparty: string;
}) {
  const [amount, setAmount] = useState(application?.netThisApplication ?? 0);

  if (!application) return null;

  const handle = () => {
    if (amount < 0) { toast.error("Amount must be ≥ 0"); return; }
    const cert = issueCertificate(projectId, { applicationId: application.id, finalAmount: amount });
    // Mirror into invoice registry so cashflow stays in sync.
    addInvoice({
      projectId,
      direction: ourRole === "main_contractor" ? "payable" : "receivable",
      counterparty,
      reference: cert.certificateNumber,
      issued: cert.issuedAt,
      due: application.finalDateForPayment,
      amount,
      status: "outstanding",
    });
    toast.success("Certificate issued", { description: `${cert.certificateNumber} · ${fmtMoney(amount)} due ${application.finalDateForPayment}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Certificate — {application.appNumber}</DialogTitle>
          <DialogDescription>
            Final amount due. This will create an entry in the invoice register and feed cashflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="final-amt">Final certified amount £</Label>
            <Input id="final-amt" type="number" min={0} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="rounded bg-[var(--ink-50)] p-2 text-[12px] text-[var(--ink-500)]">
            Final date for payment: <strong className="text-[var(--ink-900)]">{application.finalDateForPayment}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle}>Issue Certificate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Record Payment ---------------------------------------------------

export function RecordPaymentDialog({
  open, onOpenChange, projectId, application, certificateAmount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  application: PaymentApplication | null;
  certificateAmount: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [paidAt, setPaidAt] = useState(today);
  const [reference, setReference] = useState("");

  if (!application || !application.certificateId) return null;

  const handle = () => {
    recordPayment(projectId, {
      applicationId: application.id,
      certificateId: application.certificateId!,
      paidAt,
      paymentReference: reference || undefined,
    });
    toast.success("Payment recorded", { description: `${application.appNumber} · ${fmtMoney(certificateAmount)} marked paid` });
    setReference("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment — {application.appNumber}</DialogTitle>
          <DialogDescription>Mark certificate {application.certificateId} as paid.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="paid-at">Date paid</Label>
            <Input id="paid-at" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ref">Payment reference (optional)</Label>
            <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={64} placeholder="BACS-12345" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle}>Record payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}