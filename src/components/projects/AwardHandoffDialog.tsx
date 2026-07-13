import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Lock, Users, PackageCheck, FileLock2 } from "lucide-react";
import { team, fmtMoney, type Project } from "@/lib/mockData";
import { awardProject } from "@/lib/projectLifecycle";
import { getProjectData } from "@/lib/projectData";
import { getDrawings } from "@/lib/drawingRegistry";
import { useCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";

/**
 * Award handoff wizard — replaces the old "just flip status" flow.
 * Confirming here freezes the commercial baseline, promotes tender drawings,
 * seeds draft call-offs from the BoQ, assigns the delivery team, and logs
 * an audit trail. Everything runs atomically inside awardProject().
 */
export function AwardHandoffDialog({
  project, open, onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const active = useMemo(() => team.filter((t) => t.status === "active"), []);
  const pmDefault = active.find((t) => t.tier === "Admin")?.id ?? active[0]?.id;
  const qsDefault = active.find((t) => t.tier === "Pro Control")?.id;
  const siteDefault = active.find((t) => t.role.toLowerCase().includes("site"))?.id
                     ?? active.find((t) => t.tier === "Pro")?.id;

  const [pm, setPm] = useState<string | undefined>(pmDefault);
  const [qs, setQs] = useState<string | undefined>(qsDefault);
  const [siteLead, setSiteLead] = useState<string | undefined>(siteDefault);
  const [notes, setNotes] = useState("");

  // Preview counts so the QS knows what's about to be materialised.
  const preview = useMemo(() => {
    if (!open) return { boq: 0, systems: 0, tenderDrawings: 0 };
    const data = getProjectData(project.id);
    const dr = getDrawings(project.id);
    return {
      boq: data.boqLines.length,
      systems: data.systems.length,
      tenderDrawings: dr.revisions.filter((r) => r.isTender && r.status === "current").length,
    };
  }, [open, project.id]);

  function handleConfirm() {
    const result = awardProject(project, {
      assignedPm: pm, assignedQs: qs, assignedSiteLead: siteLead,
      actor: me.name, notes: notes.trim() || undefined,
    });
    toast.success(`${project.name} is now Active`, {
      description: `Baseline frozen · ${result.seededCallOffs} draft call-offs · ${result.assignments} team assignments.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] tracking-tight">
            Award {project.name}
          </DialogTitle>
          <DialogDescription className="pt-1">
            One confirmation, four automated steps. This is the moment tender assumptions
            become the contract of record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 p-3 text-[12.5px] text-[var(--ink-700)]">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-500)]" />
              <div>
                <p className="font-semibold text-[var(--ink-900)]">Commercial baseline will be frozen</p>
                <p className="mt-0.5">
                  Contract value <strong>{fmtMoney(project.contractValue)}</strong>,
                  {" "}{preview.boq} BoQ line{preview.boq === 1 ? "" : "s"}, {preview.systems} system{preview.systems === 1 ? "" : "s"}
                  {" "}and {preview.tenderDrawings} tender drawing{preview.tenderDrawings === 1 ? "" : "s"} become the C0 contract set. Variations track against this snapshot.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/60 p-3 text-[12.5px]">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--ink-900)]">
              <Users className="h-3.5 w-3.5" /> Assign delivery team
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TeamPicker label="Project Manager" value={pm} onChange={setPm} members={active} />
              <TeamPicker label="Commercial QS" value={qs} onChange={setQs} members={active} />
              <TeamPicker label="Site Lead" value={siteLead} onChange={setSiteLead} members={active} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <SideNote icon={PackageCheck} title="Procurement seed"
              body={`Draft call-offs auto-generated per supplier from the ${preview.boq} BoQ lines. QS approves before sending.`} />
            <SideNote icon={FileLock2} title="Drawing baseline"
              body={`${preview.tenderDrawings} tender revisions become the C0 contract set — future revisions flag as potential variations.`} />
          </div>

          <div>
            <Label className="text-[12px]">Award notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. LoI signed 14/07, main contract to follow within 4 weeks."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>
            <Trophy className="mr-1.5 h-4 w-4" /> Confirm award & handoff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamPicker({
  label, value, onChange, members,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  members: typeof team;
}) {
  return (
    <div>
      <Label className="text-[11px] text-[var(--ink-500)]">{label}</Label>
      <Select value={value ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? undefined : v)}>
        <SelectTrigger className="mt-1 h-9 text-[13px]"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">Unassigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.name} · {m.role}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SideNote({
  icon: Icon, title, body,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-md border border-[var(--ink-200)] p-2.5">
      <p className="flex items-center gap-1.5 font-semibold text-[var(--ink-900)]">
        <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" /> {title}
      </p>
      <p className="mt-0.5 text-[var(--ink-600)]">{body}</p>
    </div>
  );
}