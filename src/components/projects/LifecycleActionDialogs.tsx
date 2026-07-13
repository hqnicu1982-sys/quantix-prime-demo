import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/mockData";
import { fmtMoney } from "@/lib/mockData";
import { sendQuote, markActive, markLost, cloneAsTender } from "@/lib/projectLifecycle";
import { toast } from "sonner";
import { Send, Trophy, XCircle, Copy, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SendQuoteButton({ project, size = "sm" }: { project: Project; size?: "sm" | "default" }) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        sendQuote(project.id);
        toast.success(`Quote sent — ${project.name} moved to Awaiting`, {
          description: "Follow-up reminder set for 14 days from today.",
        });
      }}
    >
      <Send className="mr-1.5 h-3.5 w-3.5" /> Send quote
    </Button>
  );
}

export function MarkActiveDialog({ project, trigger }: { project: Project; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger ?? (
          <Button variant="default" size="sm">
            <Trophy className="mr-1.5 h-3.5 w-3.5" /> Mark as Active
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] tracking-tight">Award {project.name}?</DialogTitle>
          <DialogDescription className="pt-1">
            Move this bid from <strong>{project.status === "tender" ? "Tender" : "Awaiting"}</strong> to <strong>Active</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 p-3 text-[12.5px] text-[var(--ink-700)]">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-500)]" />
            <div>
              <p className="font-semibold text-[var(--ink-900)]">Estimator baseline will be frozen</p>
              <p className="mt-1">V1 pricing (BoQ + Costed BoQ) is locked as the contractual baseline. All future variations are measured against this snapshot.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12.5px]">
          <div><p className="text-[var(--ink-500)]">Main contractor</p><p className="font-semibold">{project.mainContractor}</p></div>
          <div><p className="text-[var(--ink-500)]">Contract value</p><p className="font-mono-num font-semibold">{fmtMoney(project.contractValue)}</p></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            markActive(project.id);
            setOpen(false);
            toast.success(`${project.name} is now Active`, { description: "Estimator baseline frozen. Project setup checklist unlocked." });
          }}>
            <Trophy className="mr-1.5 h-4 w-4" /> Confirm & activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const LOST_REASONS = [
  "Price — above winning bid",
  "Programme — couldn't hit dates",
  "Client relationship / incumbent",
  "Scope mismatch",
  "No feedback given",
  "Other",
];

export function MarkLostDialog({ project, trigger }: { project: Project; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [competitor, setCompetitor] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Mark as Lost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] tracking-tight">Mark {project.name} as Lost</DialogTitle>
          <DialogDescription className="pt-1">
            Capture why so we improve future bids.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[12px]">Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--ink-200)] bg-transparent px-3 py-2 text-[13px]"
            >
              {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px]">Notes (optional)</Label>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. 8% above winning bid, feedback from Sarah at Skanska…"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-[12px]">Lost to (competitor)</Label>
            <Input
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              placeholder="e.g. Rival Drylining Ltd"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              const combinedReason = detail.trim() ? `${reason} — ${detail.trim()}` : reason;
              markLost(project.id, combinedReason, competitor.trim() || "Unknown");
              setOpen(false);
              toast.success(`${project.name} marked as Lost`);
            }}
          >
            Confirm loss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CloneTenderButton({ project }: { project: Project }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        const cloned = cloneAsTender(project);
        toast.success(`Cloned as new tender: ${cloned.name}`);
        navigate({ to: "/projects", search: { stage: "tender" } });
      }}
    >
      <Copy className="mr-1.5 h-3.5 w-3.5" /> Clone
    </Button>
  );
}
