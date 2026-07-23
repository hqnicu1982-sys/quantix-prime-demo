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
import { Plus, Upload, FileText, Calendar as CalIcon } from "lucide-react";
import { addCustomProject, inferHealth, saveProjectExtras } from "@/lib/customProjects";
import { toast } from "sonner";
import type { ProjectStatus } from "@/lib/mockData";

const STAGES: { id: ProjectStatus; label: string; activeClass: string }[] = [
  { id: "tender", label: "Tender", activeClass: "border-[var(--accent-500)] bg-[var(--accent-500)]/10 font-semibold text-[var(--accent-500)]" },
  { id: "awaiting", label: "Awaiting", activeClass: "border-[var(--amber-500)] bg-[var(--amber-500)]/10 font-semibold text-[var(--amber-500)]" },
  { id: "active", label: "Active", activeClass: "border-[var(--green-600)] bg-[var(--green-600)]/10 font-semibold text-[var(--green-600)]" },
];

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stage, setStage] = useState<ProjectStatus>("tender");
  const [subtitle, setSubtitle] = useState("");
  const [mainContractor, setMainContractor] = useState("");
  const [contractValue, setContractValue] = useState<string>("");
  const [margin, setMargin] = useState<string>("20");
  const [progress, setProgress] = useState<string>("0");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [specsFileName, setSpecsFileName] = useState<string>("");
  const [plannerTemplate, setPlannerTemplate] =
    useState<"drylining-standard" | "fitout-standard" | "custom">("drylining-standard");
  const [plannerFileName, setPlannerFileName] = useState<string>("");

  const reset = () => {
    setName("");
    setStage("tender");
    setSubtitle("");
    setMainContractor("");
    setContractValue("");
    setMargin("20");
    setProgress("0");
    setStartDate("");
    setEndDate("");
    setSpecsFileName("");
    setPlannerTemplate("drylining-standard");
    setPlannerFileName("");
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
    const created = addCustomProject({
      name: name.trim(),
      subtitle: subtitle.trim() || "—",
      mainContractor: mainContractor.trim(),
      contractValue: cv,
      margin: mg,
      progress: pg,
      health: inferHealth(mg, pg),
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      status: stage,
    });
    saveProjectExtras(created.id, {
      specsFileName: specsFileName || undefined,
      plannerTemplate,
      plannerFileName: plannerFileName || undefined,
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
            <Label>Stage</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={`rounded border px-2 py-1.5 text-[12px] transition-colors ${
                    stage === s.id ? s.activeClass : "border-[var(--ink-200)] hover:bg-[var(--ink-50)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--ink-500)]">
              Tender and Awaiting projects can be re-costed freely. Active projects have a committed BoQ — changes go through variations.
            </p>
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

          <div className="rounded-md border border-[var(--ink-200)] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <FileText className="h-3 w-3" /> Specifications
            </p>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-dashed border-[var(--ink-200)] px-3 py-1.5 text-[12px] hover:bg-[var(--ink-50)]">
                <Upload className="h-3.5 w-3.5" />
                <span>{specsFileName ? "Replace file" : "Upload PDF / CSV"}</span>
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx"
                  className="hidden"
                  onChange={(e) => setSpecsFileName(e.target.files?.[0]?.name ?? "")}
                />
              </label>
              {specsFileName && (
                <span className="truncate text-[12px] text-[var(--ink-700)]">{specsFileName}</span>
              )}
            </div>
          </div>

          <div className="rounded-md border border-[var(--ink-200)] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <CalIcon className="h-3 w-3" /> Planner template
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "drylining-standard", label: "Drylining" },
                { id: "fitout-standard", label: "Fit-out" },
                { id: "custom", label: "Custom" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlannerTemplate(t.id)}
                  className={`rounded border px-2 py-1.5 text-[12px] transition-colors ${
                    plannerTemplate === t.id
                      ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 font-semibold text-[var(--accent-500)]"
                      : "border-[var(--ink-200)] hover:bg-[var(--ink-50)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {plannerTemplate === "custom" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-dashed border-[var(--ink-200)] px-3 py-1.5 text-[12px] hover:bg-[var(--ink-50)]">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{plannerFileName ? "Replace file" : "Upload .mpp / .xlsx"}</span>
                  <input
                    type="file"
                    accept=".mpp,.xlsx,.csv"
                    className="hidden"
                    onChange={(e) => setPlannerFileName(e.target.files?.[0]?.name ?? "")}
                  />
                </label>
                {plannerFileName && (
                  <span className="truncate text-[12px] text-[var(--ink-700)]">{plannerFileName}</span>
                )}
              </div>
            )}
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