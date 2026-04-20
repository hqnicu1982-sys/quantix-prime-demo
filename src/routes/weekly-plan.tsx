import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Users, Clock } from "lucide-react";
import { weeklyTasks, type Task } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weekly-plan")({
  head: () => ({ meta: [{ title: "Weekly Work Plan — Quantix Prime" }] }),
  component: WeeklyPlan,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function ConstraintBadges({ c }: { c: Task["constraints"] }) {
  const items = [
    { ok: c.materials, label: "Materials" },
    { ok: c.labour, label: "Labour" },
    { ok: c.preceding, label: "Preceding" },
    { ok: c.permits, label: "Permits" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
            i.ok ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger",
          )}
        >
          {i.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {i.label}
        </span>
      ))}
    </div>
  );
}

function TaskCard({ t }: { t: Task }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">{t.title}</p>
        <StatusBadge status={t.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t.crew} ({t.operatives})</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration}</span>
      </div>
      <ConstraintBadges c={t.constraints} />
    </div>
  );
}

function WeeklyPlan() {
  const [open, setOpen] = useState(false);
  const ppc = 78;
  const ready = weeklyTasks.filter((t) => t.status === "READY").length;
  const blocked = weeklyTasks.filter((t) => t.status !== "READY").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Work Plan</h1>
          <p className="text-sm text-muted-foreground">Look-ahead — week of 21/04/2025</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" />Add roadblock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a roadblock</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Affected task</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>{weeklyTasks.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason for variance</Label>
                <Textarea placeholder="e.g. SIG delivery slipped — replacement order placed with CCF" />
              </div>
              <div>
                <Label>Impact on programme (days)</Label>
                <Input type="number" placeholder="3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Log roadblock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Percent Plan Complete</p>
          <p className="mt-1 text-2xl font-bold text-success">{ppc}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasks ready</p>
          <p className="mt-1 text-2xl font-bold">{ready}/{weeklyTasks.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Roadblocks</p>
          <p className="mt-1 text-2xl font-bold text-danger">{blocked}</p>
        </Card>
      </div>

      {/* Desktop calendar grid */}
      <Card className="hidden overflow-hidden md:block">
        <div className="grid grid-cols-5 border-b bg-secondary/50">
          {days.map((d) => (
            <div key={d} className="border-r px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 p-2 min-h-[420px]">
          {days.map((_, dayIdx) => (
            <div key={dayIdx} className="space-y-2 border-r pr-2 last:border-r-0">
              {weeklyTasks.filter((t) => t.day === dayIdx).map((t) => (
                <TaskCard key={t.id} t={t} />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Mobile list */}
      <div className="space-y-2 md:hidden">
        {weeklyTasks.map((t) => <TaskCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}
