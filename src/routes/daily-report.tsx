import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Cloud, Sun, CloudRain, ChevronDown, Camera, Save, Send, Plus, Check, AlertTriangle } from "lucide-react";
import { roadblocks, labourVsBoq } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily-report")({
  head: () => ({ meta: [{ title: "Daily Site Report — Quantix Prime" }] }),
  component: DailyReportWrapper,
});

function DailyReportWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="daily site report" />;
  return <DailyReport />;
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-secondary/30">
            <h2 className="font-semibold">{title}</h2>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t p-4">{children}</CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function DailyReport() {
  const [weather, setWeather] = useState<"sun" | "cloud" | "rain">("cloud");
  const [temp, setTemp] = useState("14");
  const [date] = useState(new Date().toLocaleDateString("en-GB"));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Site Report</h1>
        <p className="text-sm text-muted-foreground">Hotel Fitzrovia · Site Manager: Nick Popescu</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Date</Label>
            <Input defaultValue={date} />
          </div>
          <div>
            <Label>Operatives on site</Label>
            <Input type="number" defaultValue="14" />
          </div>
        </div>
        <div className="mt-3">
          <Label>Weather</Label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {([
              { key: "sun", icon: Sun, label: "Sunny" },
              { key: "cloud", icon: Cloud, label: "Cloudy" },
              { key: "rain", icon: CloudRain, label: "Rain" },
            ] as const).map((w) => (
              <button
                key={w.key}
                onClick={() => setWeather(w.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium",
                  weather === w.key ? "border-accent bg-accent/10 text-accent" : "text-muted-foreground hover:bg-secondary/30",
                )}
              >
                <w.icon className="h-4 w-4" /> {w.label}
              </button>
            ))}
            <Input className="w-20" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} />
            <span className="text-sm text-muted-foreground">°C</span>
          </div>
        </div>
        <div className="mt-3">
          <Label>Subcontractors on site</Label>
          <p className="mt-1 text-sm text-muted-foreground">MTech Electrical · Heritage Joinery · ABC Firestopping</p>
        </div>
      </Card>

      <Section title="1. Work completed today" defaultOpen>
        <ul className="space-y-2">
          {labourVsBoq.slice(0, 3).map((r) => (
            <li key={r.task} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
              <div>
                <p className="font-medium">{r.task}</p>
                <p className="text-xs text-muted-foreground">{r.progress}</p>
              </div>
              <span className="text-xs font-semibold text-success">{r.hours}h</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="mt-3"><Plus className="mr-1 h-3.5 w-3.5" />Add additional work</Button>
      </Section>

      <Section title="2. RAMS & Safety">
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Site induction completed for new operatives (2 today)</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Toolbox talk conducted — topic: <strong>Working at height</strong></label>
          <label className="flex items-center gap-2 text-sm"><Checkbox /> RAMS reviewed for new task: Firestopping L2</label>
        </div>
        <div className="mt-3 space-y-2">
          <Label>Incidents today</Label>
          <Textarea rows={2} placeholder="None reported" />
          <Label>Near misses</Label>
          <Textarea rows={2} placeholder="One — operative caught loose board edge near scaffold (no injury, board secured)" />
        </div>
      </Section>

      <Section title="3. Inspections & quality checks">
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 p-2.5 text-sm">
            <span><Check className="mr-1.5 inline h-4 w-4 text-success" />Partition L3 grid 1-3 — line & level</span>
            <span className="text-xs font-semibold text-success">PASS</span>
          </li>
          <li className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-2.5 text-sm">
            <span><AlertTriangle className="mr-1.5 inline h-4 w-4 text-warning-foreground" />Ceiling L2 perimeter trim alignment</span>
            <span className="text-xs font-semibold text-warning-foreground">SNAG</span>
          </li>
        </ul>
      </Section>

      <Section title="4. Delays & issues">
        <ul className="space-y-2 text-sm">
          {roadblocks.map((r) => (
            <li key={r.id} className="rounded-md border bg-card p-2.5">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.reason}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="5. Substitutions requested">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between rounded-md border p-2.5">
            <span>SIG Wallboard 12.5mm → CCF equivalent (price hike)</span>
            <span className="rounded bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">Pending MC</span>
          </li>
        </ul>
      </Section>

      <Section title="6. Notes & handover">
        <Label>End-of-day notes</Label>
        <Textarea rows={3} placeholder="Crew A finishing partition grid 4 tomorrow. Need MF channel arriving 09:00 — confirmed with SIG dispatch." />
        <Label className="mt-3">Tomorrow's priorities</Label>
        <Textarea rows={2} placeholder="1. Complete grid 4-5 partitions L3&#10;2. Begin tape & joint L4 corridor" />
      </Section>

      <Card className="p-4">
        <Label>Site photos</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex aspect-square items-center justify-center rounded-md bg-gradient-to-br from-secondary to-muted text-muted-foreground">
              <Camera className="h-5 w-5" aria-hidden />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full"><Plus className="mr-1 h-3.5 w-3.5" />Add photos</Button>
      </Card>

      <div className="sticky bottom-20 flex gap-2 lg:bottom-4">
        <Button variant="outline" className="flex-1" onClick={() => toast("Draft saved")}>
          <Save className="mr-1.5 h-4 w-4" />Save draft
        </Button>
        <Button className="flex-1" onClick={() => toast.success("Daily report submitted", { description: "Shared with John Smith (QS) and office team" })}>
          <Send className="mr-1.5 h-4 w-4" />Submit & share
        </Button>
      </div>
    </div>
  );
}
