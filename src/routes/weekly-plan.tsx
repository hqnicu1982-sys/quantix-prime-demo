import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Users, Clock, Upload, Calendar as CalIcon, ChevronDown, ChevronUp } from "lucide-react";
import { weeklyTasks, type Task, team } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weekly-plan")({
  head: () => ({ meta: [{ title: "Weekly Work Plan — Quantix Prime" }] }),
  component: WeeklyPlanWrapper,
});

const week1 = ["Mon 21/04", "Tue 22/04", "Wed 23/04", "Thu 24/04", "Fri 25/04"];
const week2 = ["Mon 28/04", "Tue 29/04", "Wed 30/04", "Thu 01/05", "Fri 02/05"];
const systems = ["L3 Partitions", "L2 Partitions", "L3 Ceilings"] as const;

const reasons = ["Material late", "Labour shortage", "Design change", "Weather", "Predecessor incomplete", "Permit delay", "Other"];

function ConstraintBadges({ c, compact = false }: { c: Task["constraints"]; compact?: boolean }) {
  const items = [
    { ok: c.materials, label: "M", full: "Materials" },
    { ok: c.labour, label: "L", full: "Labour" },
    { ok: c.preceding, label: "P", full: "Preceding" },
    { ok: c.permits, label: "✓", full: "Permits" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <span
          key={i.full}
          title={i.full}
          className={cn(
            "inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-bold",
            i.ok ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger",
            compact ? "h-4 w-5 justify-center" : "",
          )}
        >
          {compact ? (i.ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />) : (
            <>
              {i.ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              {i.full}
            </>
          )}
        </span>
      ))}
    </div>
  );
}

function CalendarTaskCard({ t }: { t: Task }) {
  const ribbon = t.status === "READY" ? "bg-success" : t.status === "AT_RISK" ? "bg-warning" : "bg-danger";
  return (
    <div className="group relative cursor-grab overflow-hidden rounded-md border bg-card p-2 shadow-sm transition-shadow hover:shadow-md">
      <div className={cn("absolute left-0 top-0 h-full w-1", ribbon)} />
      <p className="text-xs font-semibold leading-tight">{t.title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{t.crew} · {t.operatives} ops · {t.duration}</p>
      <div className="mt-1.5"><ConstraintBadges c={t.constraints} compact /></div>
    </div>
  );
}

function ListTaskCard({ t }: { t: Task }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button className="flex w-full items-start justify-between gap-2 p-3 text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">{t.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.crew} · {t.operatives} ops · {t.duration}</p>
          <div className="mt-2"><ConstraintBadges c={t.constraints} /></div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={t.status} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && t.reasonForVariance && (
        <div className="border-t bg-secondary/20 p-3 text-xs">
          <p><strong>Reason for variance:</strong> {t.reasonForVariance}</p>
        </div>
      )}
    </Card>
  );
}

function WeeklyPlanWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="weekly work plan" />;
  return <WeeklyPlan />;
}

function WeeklyPlan() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const ppc = 82;
  const ready = weeklyTasks.filter((t) => t.status === "READY").length;
  const blocked = weeklyTasks.filter((t) => t.status !== "READY").length;

  const handleSubmit = () => {
    setOpen(false);
    toast.success("Roadblock logged", { description: "Site team and QS notified" });
  };

  const handleImport = () => {
    setImportOpen(false);
    toast.success("Programme imported", { description: "Asta Powerproject XML — 84 activities loaded" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Work Plan</h1>
          <p className="text-sm text-muted-foreground">Mon 21/04 — Fri 02/05/2026 · 2-week look-ahead</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Import programme</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Import master programme</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Upload from Asta Powerproject (.xml), MS Project (.xml/.mpp), or Excel.</p>
                <div className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-secondary/30">
                  <Upload className="h-6 w-6" />
                  Drop file or click to browse
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                <Button onClick={handleImport}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add roadblock</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Log a roadblock</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Affected task</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                    <SelectContent>{weeklyTasks.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason for variance</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                    <SelectContent>{reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Impact description</Label>
                  <Textarea rows={2} placeholder="e.g. SIG delivery slipped — replacement order placed with CCF" />
                </div>
                <div>
                  <Label>Impact on programme (days)</Label>
                  <Input type="number" placeholder="3" />
                </div>
                <div>
                  <Label>Resolution owner</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Assign to" /></SelectTrigger>
                    <SelectContent>{team.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} — {m.role}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Photo (optional)</Label>
                  <div className="flex h-20 cursor-pointer items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-secondary/30">
                    <Upload className="mr-2 h-4 w-4" /> Drop photo
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Log roadblock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">PPC this week</p><p className="mt-1 text-2xl font-bold text-success">{ppc}%</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tasks ready</p><p className="mt-1 text-2xl font-bold">{ready}/{weeklyTasks.length}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Roadblocks</p><p className="mt-1 text-2xl font-bold text-danger">{blocked}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Window</p><p className="mt-1 text-sm font-semibold">2 weeks</p><p className="text-[10px] text-muted-foreground">21/04 — 02/05</p></Card>
      </div>

      {/* View toggle */}
      <div className="hidden gap-1 md:flex">
        <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}><CalIcon className="mr-1 h-3.5 w-3.5" />Calendar</Button>
        <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>List</Button>
      </div>

      {/* Desktop calendar */}
      {view === "calendar" && (
        <div className="hidden space-y-3 md:block">
          {[
            { label: "Week 1 (21/04 – 25/04)", days: week1, offset: 0 },
            { label: "Week 2 (28/04 – 02/05)", days: week2, offset: 5 },
          ].map((wk) => (
            <Card key={wk.label} className="overflow-hidden">
              <div className="border-b bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{wk.label}</div>
              <div className="grid grid-cols-[140px_repeat(5,1fr)] divide-x">
                <div></div>
                {wk.days.map((d) => (
                  <div key={d} className="bg-secondary/20 px-3 py-2 text-[11px] font-semibold text-muted-foreground">{d}</div>
                ))}
              </div>
              {systems.map((sys) => (
                <div key={sys} className="grid grid-cols-[140px_repeat(5,1fr)] divide-x border-t">
                  <div className="bg-secondary/20 px-3 py-2 text-[11px] font-semibold text-muted-foreground">{sys}</div>
                  {wk.days.map((_, dayIdx) => {
                    const realDay = wk.offset + dayIdx;
                    const tasks = weeklyTasks.filter((t) => t.day === realDay && t.system === sys);
                    return (
                      <div key={dayIdx} className="min-h-[90px] space-y-1.5 p-1.5">
                        {tasks.map((t) => <CalendarTaskCard key={t.id} t={t} />)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="hidden space-y-2 md:block">
          {weeklyTasks.map((t) => <ListTaskCard key={t.id} t={t} />)}
        </div>
      )}

      {/* Mobile list */}
      <div className="space-y-2 md:hidden">
        {weeklyTasks.map((t) => <ListTaskCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}
