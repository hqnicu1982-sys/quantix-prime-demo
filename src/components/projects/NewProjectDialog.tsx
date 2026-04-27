import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { addCustomProject, inferHealth } from "@/lib/customProjects";
import { toast } from "sonner";

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mainContractor, setMainContractor] = useState("");
  const [contractValue, setContractValue] = useState<string>("");
  const [margin, setMargin] = useState<string>("20");
  const [progress, setProgress] = useState<string>("0");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const reset = () => {
    setName("");
    setSubtitle("");
    setMainContractor("");
    setContractValue("");
    setMargin("20");
    setProgress("0");
    setStartDate("");
    setEndDate("");
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const canSave = name.trim().length > 0 && mainContractor.trim().length > 0 && contractValue !== "";

  const onSave = () => {
    if (!canSave) return;
    const cv = Number(contractValue) || 0;
    const mg = Number(margin) || 0;
    const pg = Math.min(100, Math.max(0, Number(progress) || 0));
    addCustomProject({
      name: name.trim(),
      subtitle: subtitle.trim() || "—",
      mainContractor: mainContractor.trim(),
      contractValue: cv,
      margin: mg,
      progress: pg,
      health: inferHealth(mg, pg),
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
    toast.success(`Project "${name.trim()}" created`);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>Set the basic details. You can refine systems and BoQ later.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="np-name">Project name *</Label>
            <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kings Cross Tower" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-sub">Subtitle</Label>
            <Input id="np-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Drylining · N1C · 24 floors" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-mc">Main contractor *</Label>
            <Input id="np-mc" value={mainContractor} onChange={(e) => setMainContractor(e.target.value)} placeholder="e.g. Kier Construction" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="np-cv">Contract value (£) *</Label>
              <Input id="np-cv" type="number" inputMode="numeric" value={contractValue} onFocus={(e) => e.target.select()} onChange={(e) => setContractValue(e.target.value)} placeholder="500000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-mg">Target margin (%)</Label>
              <Input id="np-mg" type="number" inputMode="numeric" value={margin} onFocus={(e) => e.target.select()} onChange={(e) => setMargin(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-pg">Progress (%)</Label>
              <Input id="np-pg" type="number" inputMode="numeric" value={progress} onFocus={(e) => e.target.select()} onChange={(e) => setProgress(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="np-sd">Start date</Label>
              <Input id="np-sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-ed">End date</Label>
              <Input id="np-ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!canSave}>Create project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}