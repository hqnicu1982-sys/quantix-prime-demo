import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormWizard } from "@/components/forms/FormWizard";
import { SignaturePad } from "@/components/forms/SignaturePad";
import { PhotoDropzone } from "@/components/forms/PhotoDropzone";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useProject } from "@/lib/ProjectContext";
import { recordDailyReportSubmission, useDailyReportSubmission } from "@/lib/dailyReportSubmissions";
import { dailyReport } from "@/lib/mockData";

export const Route = createFileRoute("/forms/daily-report")({ component: Guarded });

function Guarded() {
  const allowed = useCan("approve.labour");
  if (!allowed) return <NoAccess cap="approve.labour" title="Only Site Manager / QS / Admin can submit a daily report" />;
  return <DailyReportForm />;
}

type CrewLine = { trade: string; headcount: number };
type ProgressLine = { task: string; pctComplete: number };
type IssueLine = { description: string; severity: "low" | "med" | "high"; raiseVo: boolean };

function DailyReportForm() {
  const nav = useNavigate();
  const { current } = useProject();
  const today = new Date().toISOString().slice(0, 10);
  const existing = useDailyReportSubmission(current.id, today);

  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<"day" | "night">("day");
  const [weather, setWeather] = useState("Clear · 14°C");
  const [hours, setHours] = useState("07:30 → 17:00");
  const [crews, setCrews] = useState<CrewLine[]>([
    { trade: "Dryliners", headcount: 6 },
    { trade: "Tapers", headcount: 3 },
  ]);
  const [progress, setProgress] = useState<ProgressLine[]>([
    { task: "L5 corridor — board side B", pctComplete: 65 },
  ]);
  const [issues, setIssues] = useState<IssueLine[]>([
    { description: "", severity: "low", raiseVo: false },
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | undefined>();
  const [submittedBy, setSubmittedBy] = useState("Nick Andrei");
  const [note, setNote] = useState("");

  const totalHeadcount = crews.reduce((s, c) => s + (Number(c.headcount) || 0), 0);
  const realIssues = issues.filter((i) => i.description.trim().length > 0);
  const willRaiseVo = realIssues.filter((i) => i.raiseVo);
  const canSubmit = !existing && totalHeadcount > 0 && !!signature && !!submittedBy.trim();

  const submit = () => {
    recordDailyReportSubmission({
      projectId: current.id,
      date,
      mainContractor: dailyReport.mainContractor,
      note: [
        `${totalHeadcount} on site · ${crews.map((c) => `${c.headcount} ${c.trade}`).join(", ")}`,
        progress.map((p) => `${p.task} ${p.pctComplete}%`).join(" · "),
        note,
      ].filter(Boolean).join(" · "),
    });
    toast.success("Daily report submitted", {
      description: `${date} · sent to ${dailyReport.mainContractor}`,
    });
    // Optionally queue VOs as deep links — we route to variations form per flagged issue.
    if (willRaiseVo.length > 0) {
      const first = willRaiseVo[0];
      nav({
        to: "/forms/variation",
        search: { source: "daily-report", sourceDate: date, title: first.description },
      });
    } else {
      nav({ to: "/daily-report" });
    }
  };

  return (
    <div className="space-y-4">
      <Button asChild size="sm" variant="ghost">
        <Link to="/daily-report"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to today's report</Link>
      </Button>

      <FormWizard
        title="Submit daily report"
        subtitle={`4-step form · ${current.name} → ${dailyReport.mainContractor}`}
        submitLabel={existing ? "Already submitted today" : willRaiseVo.length > 0 ? `Submit & raise ${willRaiseVo.length} VO` : "Submit to main contractor"}
        canSubmit={canSubmit}
        onSubmit={submit}
        onCancel={() => nav({ to: "/daily-report" })}
        steps={[
          {
            id: "day",
            label: "Day & crew",
            canAdvance: () => totalHeadcount > 0,
            render: () => (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <Labeled label="Date">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-[12.5px]" />
                  </Labeled>
                  <Labeled label="Shift">
                    <select value={shift} onChange={(e) => setShift(e.target.value as "day" | "night")} className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[12.5px]">
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                    </select>
                  </Labeled>
                  <Labeled label="Hours on site">
                    <Input value={hours} onChange={(e) => setHours(e.target.value)} className="h-9 text-[12.5px]" />
                  </Labeled>
                  <Labeled label="Weather">
                    <Input value={weather} onChange={(e) => setWeather(e.target.value)} className="h-9 text-[12.5px]" />
                  </Labeled>
                </div>
                <div className="rounded-md border border-[var(--ink-200)]">
                  <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                      Crew on site · {totalHeadcount} total
                    </p>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11.5px]" onClick={() => setCrews((a) => [...a, { trade: "", headcount: 0 }])}>
                      <Plus className="h-3 w-3" /> Add trade
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--ink-200)]">
                    {crews.map((c, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2">
                        <Input value={c.trade} onChange={(e) => setCrews((arr) => arr.map((x, j) => j === i ? { ...x, trade: e.target.value } : x))} placeholder="Trade" className="col-span-7 h-8 text-[12.5px]" />
                        <Input type="number" value={c.headcount || ""} onChange={(e) => setCrews((arr) => arr.map((x, j) => j === i ? { ...x, headcount: Number(e.target.value) } : x))} placeholder="Headcount" className="col-span-4 h-8 text-right text-[12.5px]" />
                        <button type="button" onClick={() => setCrews((arr) => arr.filter((_, j) => j !== i))} className="col-span-1 flex items-center justify-end text-[var(--ink-500)] hover:text-[var(--red-500)]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "progress",
            label: "Progress",
            render: () => (
              <div className="rounded-md border border-[var(--ink-200)]">
                <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Work done today</p>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[11.5px]" onClick={() => setProgress((a) => [...a, { task: "", pctComplete: 0 }])}>
                    <Plus className="h-3 w-3" /> Add task
                  </Button>
                </div>
                <div className="divide-y divide-[var(--ink-200)]">
                  {progress.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2">
                      <Input value={p.task} onChange={(e) => setProgress((arr) => arr.map((x, j) => j === i ? { ...x, task: e.target.value } : x))} placeholder="Task description" className="col-span-9 h-8 text-[12.5px]" />
                      <Input type="number" min={0} max={100} value={p.pctComplete || ""} onChange={(e) => setProgress((arr) => arr.map((x, j) => j === i ? { ...x, pctComplete: Number(e.target.value) } : x))} placeholder="% complete" className="col-span-2 h-8 text-right text-[12.5px]" />
                      <button type="button" onClick={() => setProgress((arr) => arr.filter((_, j) => j !== i))} className="col-span-1 flex items-center justify-end text-[var(--ink-500)] hover:text-[var(--red-500)]">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: "issues",
            label: "Issues",
            render: () => (
              <div className="rounded-md border border-[var(--ink-200)]">
                <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Issues / blockers</p>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[11.5px]" onClick={() => setIssues((a) => [...a, { description: "", severity: "low", raiseVo: false }])}>
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                <div className="divide-y divide-[var(--ink-200)]">
                  {issues.map((it, i) => (
                    <div key={i} className="space-y-2 px-3 py-2">
                      <div className="grid grid-cols-12 gap-2">
                        <Input value={it.description} onChange={(e) => setIssues((arr) => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Describe the issue or blocker" className="col-span-8 h-8 text-[12.5px]" />
                        <select value={it.severity} onChange={(e) => setIssues((arr) => arr.map((x, j) => j === i ? { ...x, severity: e.target.value as IssueLine["severity"] } : x))} className="col-span-3 h-8 rounded border border-[var(--ink-200)] bg-transparent px-2 text-[12.5px]">
                          <option value="low">Low</option>
                          <option value="med">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <button type="button" onClick={() => setIssues((arr) => arr.filter((_, j) => j !== i))} className="col-span-1 flex items-center justify-end text-[var(--ink-500)] hover:text-[var(--red-500)]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-[11.5px] text-[var(--ink-700)]">
                        <Checkbox checked={it.raiseVo} onCheckedChange={(v) => setIssues((arr) => arr.map((x, j) => j === i ? { ...x, raiseVo: v === true } : x))} />
                        <span>Raise a variation for this issue on submit</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: "sign",
            label: "Photos & sign-off",
            render: () => (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-[12px] font-semibold">Site photos</Label>
                  <PhotoDropzone value={photos} onChange={setPhotos} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Labeled label="Submitted by">
                    <Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} className="h-9 text-[12.5px]" />
                  </Labeled>
                  <Labeled label="Notes for main contractor">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-[12.5px]" />
                  </Labeled>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12px] font-semibold">Site manager signature</Label>
                  <SignaturePad value={signature} onChange={setSignature} />
                </div>
                {existing && (
                  <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-3 text-[12px] text-[var(--ink-700)]">
                    <AlertTriangle className="mr-1 inline h-3 w-3 text-[var(--amber-500)]" />
                    A daily report for {date} is already submitted.
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold">{label}</Label>
      {children}
    </div>
  );
}