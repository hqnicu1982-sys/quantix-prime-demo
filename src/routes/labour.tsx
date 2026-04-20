import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Camera, Clock, ChevronRight, ChevronLeft, Check, Plus } from "lucide-react";
import { operatives, boqItems, labourVsBoq, dayworks } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/labour")({
  head: () => ({ meta: [{ title: "Labour Tracking — Quantix Prime" }] }),
  component: LabourWrapper,
});

function LabourWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="labour tracking" />;
  return <Labour />;
}

function Labour() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [hours, setHours] = useState("7.5");
  const [area, setArea] = useState("12");
  const [boq, setBoq] = useState(boqItems[0]);

  const toggle = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const reset = () => { setStep(1); setSelected([]); setSheetOpen(false); setHours("7.5"); setArea("12"); };

  const submit = () => {
    const total = selected.length * Number(hours) * 32; // approx £32/hr
    toast.success("Hours logged", { description: `${selected.length} ops · ${hours}h · £${total.toFixed(0)} against ${boq.split(" — ")[0]}` });
    reset();
  };

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl space-y-5 lg:max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Labour Tracking</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Today on site</h2>
          <span className="text-xs font-medium text-success">{operatives.length} of {operatives.length} clocked in</span>
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
                  <p className="text-xs text-muted-foreground">{o.role} · {o.crew} · £{o.dayRate}/day</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{o.clockIn}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) reset(); setSheetOpen(v); }}>
        <SheetTrigger asChild>
          <Button size="lg" className="h-14 w-full text-base">Log hours for crew</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Log hours — Step {step} of 5</SheetTitle>
          </SheetHeader>
          <div className="my-4 flex gap-1">
            {[1,2,3,4,5].map((s) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-accent" : "bg-secondary")} />
            ))}
          </div>
          <div className="space-y-3">
            {step === 1 && (
              <>
                <p className="text-sm font-medium">Select crew members</p>
                <button className="text-xs text-accent hover:underline" onClick={() => setSelected(operatives.map((o) => o.id))}>Select all</button>
                <div className="space-y-1.5">
                  {operatives.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 hover:bg-secondary/30">
                      <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                      <div className="flex-1">
                        <p className="text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.crew} · £{o.dayRate}/day</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Label>BoQ item</Label>
                <Select value={boq} onValueChange={setBoq}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{boqItems.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Progress on this item</p>
                  <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-accent" style={{ width: "25%" }} />
                  </div>
                  <p className="mt-1 text-xs">60m² of 240m² (25%)</p>
                </Card>
              </>
            )}
            {step === 3 && (
              <>
                <div>
                  <Label>Hours worked</Label>
                  <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} step="0.25" />
                  <p className="mt-1 text-xs text-muted-foreground">Default: hours since clock-in</p>
                </div>
                <div>
                  <Label>Area completed (m²)</Label>
                  <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea rows={2} placeholder="e.g. completed grid 1-3, started grid 4" />
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <Label>Photo proof (optional)</Label>
                <button className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-secondary/30">
                  <Camera className="h-7 w-7" /> Take photo
                </button>
                <p className="text-center text-xs text-muted-foreground">— or —</p>
                <Button variant="outline" className="w-full">Upload from gallery</Button>
              </>
            )}
            {step === 5 && (
              <Card className="p-4">
                <p className="text-sm font-semibold">Review & confirm</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Operatives</span><span className="font-medium">{selected.length || 4}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Hours each</span><span className="font-medium">{hours}h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-medium">{area}m²</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">BoQ</span><span className="text-right font-medium">{boq.split(" — ")[0]}</span></div>
                  <div className="mt-3 flex justify-between border-t pt-2">
                    <span className="font-semibold">Estimated value</span>
                    <span className="font-bold text-success">£{((selected.length || 4) * Number(hours) * 32).toFixed(0)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
          <SheetFooter className="mt-4 flex-row gap-2">
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1" disabled={step === 1 && selected.length === 0}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} className="flex-1"><Check className="mr-1 h-4 w-4" />Confirm & submit</Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">This week's labour against BoQ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Task</th>
                <th className="px-3 py-2.5 text-right">Hours</th>
                <th className="px-3 py-2.5 text-right">Allowance</th>
                <th className="px-3 py-2.5">Progress</th>
                <th className="px-3 py-2.5 text-right">Variance</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {labourVsBoq.map((r) => (
                <tr key={r.task}>
                  <td className="px-4 py-3 font-medium">{r.task}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.hours}h</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.allowance}h</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{r.progress}</td>
                  <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", r.variance < 0 ? "text-success" : "text-danger")}>
                    {r.variance < 0 ? "−" : "+"}£{Math.abs(r.variance)}
                  </td>
                  <td className="px-3 py-3"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Subcontractor dayworks this week</h2>
          <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" />Log dayworks</Button>
        </div>
        <ul className="divide-y">
          {dayworks.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{d.supplier}</p>
                <p className="text-xs text-muted-foreground">{d.description} · £{d.amount.toLocaleString()}</p>
                {d.approver && <p className="mt-0.5 text-[11px] text-success">Approved by {d.approver}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  d.status === "approved" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning-foreground",
                )}>
                  {d.status}
                </span>
                <Button size="sm" variant={d.status === "pending" ? "default" : "ghost"}>{d.status === "pending" ? "Review" : "View"}</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
