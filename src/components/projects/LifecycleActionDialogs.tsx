import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/mockData";
import { sendQuote, markLost, cloneAsTender } from "@/lib/projectLifecycle";
import { AwardHandoffDialog } from "./AwardHandoffDialog";
import { toast } from "sonner";
import { Send, Trophy, XCircle, Copy } from "lucide-react";
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
    <>
      <span onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        {trigger ?? (
          <Button variant="default" size="sm">
            <Trophy className="mr-1.5 h-3.5 w-3.5" /> Mark as Active
          </Button>
        )}
      </span>
      <AwardHandoffDialog project={project} open={open} onOpenChange={setOpen} />
    </>
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
