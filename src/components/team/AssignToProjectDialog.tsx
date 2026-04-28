import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2 } from "lucide-react";
import { team } from "@/lib/mockData";
import { addAssignment, getAssignments, getMemberRate } from "@/lib/labour";
import { toast } from "sonner";

export function AssignToProjectDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const existing = useMemo(() => new Set(getAssignments(projectId).map((a) => a.memberId)), [open, projectId]);
  const candidates = team.filter((m) => m.status !== "pending" && !existing.has(m.id));

  const [memberId, setMemberId] = useState<string>(candidates[0]?.id ?? "");
  const [projectRole, setProjectRole] = useState("");
  const [crewName, setCrewName] = useState("");
  const [overrideOn, setOverrideOn] = useState(false);
  const [rateOverride, setRateOverride] = useState<number>(0);

  const baseRate = getMemberRate(memberId)?.rate ?? 0;

  const onMember = (id: string) => {
    setMemberId(id);
    const m = team.find((t) => t.id === id);
    if (m) {
      setProjectRole(m.role);
      setCrewName(`${m.name.split(" ")[0]}'s crew`);
      setRateOverride(getMemberRate(id)?.rate ?? 0);
    }
  };

  const submit = () => {
    if (!memberId) return;
    addAssignment({
      projectId,
      memberId,
      projectRole: projectRole || undefined,
      crewName: crewName || undefined,
      rateOverride: overrideOn ? Number(rateOverride) : undefined,
    });
    toast.success("Assigned to project");
    setOpen(false);
    setOverrideOn(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && candidates[0]) onMember(candidates[0].id); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users2 className="mr-1.5 h-3.5 w-3.5" /> Assign existing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign team member to project</DialogTitle>
          <DialogDescription>Pick from the directory. Override rate only if this project differs from their default.</DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-[12.5px] text-[var(--ink-500)]">All active members are already assigned to this project.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[11px]">Member</Label>
              <Select value={memberId} onValueChange={onMember}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {candidates.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · {m.role} · £{(getMemberRate(m.id)?.rate ?? 0).toFixed(2)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Project role</Label>
              <Input value={projectRole} onChange={(e) => setProjectRole(e.target.value)} placeholder="e.g. Drylining L4" />
            </div>
            <div>
              <Label className="text-[11px]">Crew name</Label>
              <Input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="e.g. Marcin's Crew" />
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 px-3 py-2">
              <input id="override" type="checkbox" checked={overrideOn} onChange={(e) => setOverrideOn(e.target.checked)} />
              <Label htmlFor="override" className="text-[11.5px] font-normal">
                Override rate for this project (default £{baseRate.toFixed(2)}/h)
              </Label>
              {overrideOn && (
                <Input type="number" step="0.5" value={rateOverride} onChange={(e) => setRateOverride(Number(e.target.value))} className="ml-auto h-7 w-28" />
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!memberId}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
