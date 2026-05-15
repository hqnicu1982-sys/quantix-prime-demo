import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/lib/customProjects";
import type { Project } from "@/lib/mockData";
import { toast } from "sonner";

// Convert "dd/mm/yyyy" → "yyyy-mm-dd" for <input type="date">.
function toIso(display: string): string {
  if (!display || display === "—") return "";
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // already iso?
  if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
  return "";
}
function fromIso(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function EditProjectDialog({
  project, open, onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState(project.name);
  const [subtitle, setSubtitle] = useState(project.subtitle);
  const [mainContractor, setMainContractor] = useState(project.mainContractor);
  const [contractValue, setContractValue] = useState(String(project.contractValue));
  const [margin, setMargin] = useState(String(project.margin));
  const [progress, setProgress] = useState(String(project.progress));
  const [startDate, setStartDate] = useState(toIso(project.startDate));
  const [endDate, setEndDate] = useState(toIso(project.endDate));

  useEffect(() => {
    if (open) {
      setName(project.name);
      setSubtitle(project.subtitle);
      setMainContractor(project.mainContractor);
      setContractValue(String(project.contractValue));
      setMargin(String(project.margin));
      setProgress(String(project.progress));
      setStartDate(toIso(project.startDate));
      setEndDate(toIso(project.endDate));
    }
  }, [open, project]);

  const canSave = name.trim().length > 0 && mainContractor.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    updateProject(project.id, {
      name: name.trim(),
      subtitle: subtitle.trim() || "—",
      mainContractor: mainContractor.trim(),
      contractValue: Number(contractValue) || 0,
      margin: Number(margin) || 0,
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      startDate: fromIso(startDate),
      endDate: fromIso(endDate),
    });
    toast.success("Project updated", { description: name.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update the project details. Changes save instantly.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ep-name">Project name *</Label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ep-sub">Subtitle</Label>
            <Input id="ep-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ep-mc">Main contractor *</Label>
            <Input id="ep-mc" value={mainContractor} onChange={(e) => setMainContractor(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ep-cv">Contract value (£)</Label>
              <Input id="ep-cv" type="number" value={contractValue} onFocus={(e) => e.target.select()} onChange={(e) => setContractValue(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ep-mg">Margin (%)</Label>
              <Input id="ep-mg" type="number" value={margin} onFocus={(e) => e.target.select()} onChange={(e) => setMargin(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ep-pg">Progress (%)</Label>
              <Input id="ep-pg" type="number" value={progress} onFocus={(e) => e.target.select()} onChange={(e) => setProgress(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ep-sd">Start date</Label>
              <Input id="ep-sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ep-ed">End date</Label>
              <Input id="ep-ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!canSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
