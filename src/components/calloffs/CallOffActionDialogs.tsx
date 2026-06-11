import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { recordCallOffAction, REJECT_REASONS } from "@/lib/callOffActions";
import { logGrn } from "@/lib/grnRegistry";
import { useProject } from "@/lib/ProjectContext";
import { currentUser } from "@/lib/mockData";
import { X, PackageCheck } from "lucide-react";
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

type RejectProps = {
  ref: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function RejectCallOffDialog({ ref, open, onOpenChange }: RejectProps) {
  const [code, setCode] = useState("price");
  const [note, setNote] = useState("");
  const submit = () => {
    const label = REJECT_REASONS.find((r) => r.code === code)?.label ?? code;
    recordCallOffAction({
      ref,
      kind: "reject",
      stateAfter: "draft",
      reason: label,
      note,
    });
    toast.error(`${ref} rejected`, { description: `${label} · returned to Site Manager` });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><X className="h-4 w-4 text-[var(--red-500)]" /> Reject call-off</DialogTitle>
          <DialogDescription>The call-off returns to <strong>Draft</strong> with your reason attached.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Reason">
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REJECT_REASONS.map((r) => <SelectItem key={r.code} value={r.code} className="text-[12px]">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to change before re-submission?" rows={3} className="text-[12px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Reject & return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type GrnProps = {
  ref: string;
  defaultQty?: string;
  supplier?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function LogGrnDialog({ ref, defaultQty, supplier, open, onOpenChange }: GrnProps) {
  const [qty, setQty] = useState(defaultQty ?? "");
  const [partial, setPartial] = useState(false);
  const [note, setNote] = useState("");
  const { current } = useProject();
  const submit = () => {
    if (!qty.trim()) { toast.error("Enter the received quantity"); return; }
    recordCallOffAction({
      ref,
      kind: "log-grn",
      stateAfter: partial ? "in-delivery" : "closed",
      grnQty: qty,
      grnPartial: partial,
      note,
    });
    logGrn({
      callOffRef: ref,
      projectId: current?.id,
      supplier: supplier ?? "—",
      qty,
      partial,
      note,
      signedBy: currentUser.name,
    });
    toast.success(partial ? "Partial GRN logged" : "GRN logged · call-off closed", {
      description: `${ref} · ${qty}${note ? " · " + note : ""}`,
    });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-[var(--green-600)]" /> Log GRN</DialogTitle>
          <DialogDescription>Record what arrived on site. A full GRN closes the call-off; a partial GRN keeps it open for the balance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Received quantity">
            <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 1,200 m² boards" className="h-9 text-[12px]" />
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <Checkbox checked={partial} onCheckedChange={(v) => setPartial(v === true)} />
            <span>Partial delivery — keep call-off open for balance</span>
          </label>
          <Field label="Note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Damage, missing items, signed-for-by, etc." rows={3} className="text-[12px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Log GRN</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
