import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Clock, ChevronRight } from "lucide-react";
import { operatives, boqItems, labourVsBoq } from "@/lib/mockData";

export const Route = createFileRoute("/labour")({
  head: () => ({ meta: [{ title: "Labour Tracking — Quantix Prime" }] }),
  component: Labour,
});

function Labour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const reset = () => { setStep(1); setSelected([]); setOpen(false); };

  return (
    <div className="mx-auto max-w-2xl space-y-5 lg:max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Labour Tracking</h1>
        <p className="text-sm text-muted-foreground">Hotel Fitzrovia — Tuesday 22/04/2025</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Today's crew on site</h2>
          <span className="text-xs text-muted-foreground">{operatives.length} operatives</span>
        </div>
        <ul className="divide-y">
          {operatives.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {o.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.role} · {o.crew}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{o.clockIn}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Button size="lg" className="h-14 w-full text-base" onClick={() => setOpen(true)}>
        Log hours for crew
      </Button>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">This week's labour against BoQ</h2>
        </div>
        <div className="divide-y">
          <div className="hidden grid-cols-4 gap-3 bg-secondary/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Task</span><span className="text-right">Hours logged</span><span className="text-right">BoQ allowance</span><span className="text-right">Variance</span>
          </div>
          {labourVsBoq.map((r) => (
            <div key={r.task} className="grid grid-cols-4 items-center gap-3 px-4 py-3 text-sm">
              <span className="col-span-4 font-medium sm:col-span-1">{r.task}</span>
              <span className="text-xs text-muted-foreground sm:text-right sm:text-sm sm:text-foreground">{r.hours}h</span>
              <span className="text-xs text-muted-foreground sm:text-right sm:text-sm sm:text-foreground">{r.allowance}h</span>
              <span className={`text-right text-sm font-semibold ${r.variance < 0 ? "text-success" : "text-danger"}`}>
                {r.variance < 0 ? "−" : "+"}£{Math.abs(r.variance)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Log hours flow */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log hours — Step {step} of 5</DialogTitle>
          </DialogHeader>
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select crew members</p>
              {operatives.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 hover:bg-secondary/30">
                  <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                  <span className="text-sm">{o.name} <span className="text-muted-foreground">· {o.crew}</span></span>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              <Label>BoQ item</Label>
              <Select defaultValue={boqItems[0]}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{boqItems.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-2">
              <Label>Hours worked (default: since clock-in)</Label>
              <Input type="number" defaultValue="7.5" step="0.25" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Optional photo</Label>
              <button className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-secondary/30">
                <Camera className="h-6 w-6" />
                Tap to add a site photo
              </button>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-2 rounded-md bg-secondary/40 p-4 text-sm">
              <p><strong>{selected.length || 3}</strong> operatives</p>
              <p>BoQ: <strong>{boqItems[0]}</strong></p>
              <p>Hours: <strong>7.5h</strong></p>
              <p className="pt-2 text-success">Estimated value: £253.13 against allowance</p>
            </div>
          )}
          <DialogFooter>
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={reset}>Confirm</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
