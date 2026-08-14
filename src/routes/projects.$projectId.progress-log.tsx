import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { NoAccess } from "@/components/auth/NoAccess";
import { useCan } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";
import { useProject } from "@/lib/ProjectContext";
import { useProjectCrews } from "@/lib/labour";
import { useProjectVariations } from "@/lib/variations";
import {
  PLANNER_TODAY,
  addDays,
  computeReadiness,
  isoDate,
  useProjectTasks,
  type PlannerTask,
} from "@/lib/planner";
import {
  DELAY_CAUSE_LABEL,
  PERIOD_LABEL,
  buildDelayRegister,
  buildProgressRows,
  getCommentary,
  periodStartIso,
  setCommentary,
  useProgressLog,
  type ReportPeriod,
} from "@/lib/progressLog";
import {
  buildExecutiveSummary,
  expectedOverall,
  overallProgress,
  type BlockerRow,
} from "@/lib/progressNarrative";
import { exportProgressReportPdf, type ReportPayload } from "@/lib/progressReportPdf";
import { exportProgressReportXlsx } from "@/lib/progressReportXlsx";

export const Route = createFileRoute("/projects/$projectId/progress-log")({
  component: ProgressLogPage,
});

const CALL_OFFS: { id: string; status: "draft" | "pending" | "approved" | "delivered" }[] = [
  { id: "CO-247", status: "approved" },
  { id: "CO-246", status: "delivered" },
  { id: "CO-245", status: "delivered" },
  { id: "CO-248", status: "draft" },
  { id: "CO-249", status: "pending" },
];

const BLOCKER_OWNER: Record<string, { owner: string; action: string }> = {
  material: { owner: "Quantix procurement", action: "Confirm call-off and obtain delivery date from supplier." },
  labour: { owner: "Quantix site management", action: "Re-sequence crews or mobilise additional operatives." },
  design: { owner: "Main contractor / design team", action: "Issue revised information or approve the RFI response." },
  predecessor: { owner: "Main contractor", action: "Complete or hand over the preceding activity." },
  variation: { owner: "Main contractor / QS", action: "Instruct and approve the variation so works can be resourced." },
  sub: { owner: "Subcontractor", action: "Confirm attendance and resource." },
};

function ProgressLogPage() {
  const { projectId: PID } = Route.useParams();
  const allowed = useCan("view.progressLog");
  const { all } = useProject();
  const project = all.find((p) => p.id === PID);
  const me = useCurrentUser();
  const tasks = useProjectTasks(PID);
  const events = useProgressLog(PID);
  const crews = useProjectCrews(PID);
  const variations = useProjectVariations(PID);
  const approvedVariationIds = variations.filter((v) => v.status === "approved").map((v) => v.id);

  const [period, setPeriod] = useState<ReportPeriod>("fortnight");
  const [commentary, setCommentaryState] = useState<string>(() => getCommentary(PID));

  const sinceIso = periodStartIso(period);
  const crewName = (t: PlannerTask) =>
    crews.find((c) => c.assignment.memberId === t.crewId)?.crewName ?? "Unassigned";

  const rows = useMemo(
    () => buildProgressRows(tasks, events, crewName),
    [tasks, events, crews],
  );
  const delays = useMemo(
    () => buildDelayRegister(tasks, events, sinceIso),
    [tasks, events, sinceIso],
  );
  const comments = useMemo(
    () => events.filter((e) => isoDate(new Date(e.at)) >= sinceIso),
    [events, sinceIso],
  );

  const blockers: BlockerRow[] = useMemo(() => {
    const out: BlockerRow[] = [];
    for (const t of tasks) {
      if (t.status === "done") continue;
      const r = computeReadiness(t, tasks, { callOffs: CALL_OFFS, approvedVariationIds });
      for (const b of r.blockers) {
        const map = BLOCKER_OWNER[b.type] ?? { owner: "Quantix", action: "Resolve before mobilisation." };
        out.push({ taskId: t.id, taskTitle: t.title, type: b.type, note: b.note, ...map });
      }
    }
    return out;
  }, [tasks, approvedVariationIds]);

  const lookAheadRaw = useMemo(() => {
    const from = isoDate(PLANNER_TODAY);
    const to = addDays(from, 14);
    return tasks
      .filter((t) => t.status !== "done" && t.start >= from && t.start <= to)
      .sort((a, b) => (a.start < b.start ? -1 : 1))
      .map((t) => {
        const r = computeReadiness(t, tasks, { callOffs: CALL_OFFS, approvedVariationIds });
        return { task: t, ready: r.ready, note: r.blockers.map((b) => b.note).join(" · ") };
      });
  }, [tasks, approvedVariationIds]);

  const summary = useMemo(
    () =>
      buildExecutiveSummary({
        projectName: project?.name ?? PID,
        periodLabel: PERIOD_LABEL[period],
        rows,
        delays,
        blockers,
        lookAhead: lookAheadRaw.map((l) => ({ task: l.task, ready: l.ready })),
      }),
    [project?.name, PID, period, rows, delays, blockers, lookAheadRaw],
  );

  if (!allowed) return <div className="py-8"><NoAccess cap="view.progressLog" title="Progress report restricted" /></div>;

  const payload = (): ReportPayload => ({
    projectName: project?.name ?? PID,
    projectClient: project?.subtitle,
    periodLabel: PERIOD_LABEL[period],
    preparedBy: me.name,
    generatedAt: new Date(),
    summary,
    rows,
    delays,
    blockers,
    comments,
    lookAhead: lookAheadRaw.map((l) => ({
      id: l.task.id,
      title: l.task.title,
      start: l.task.start,
      crew: crewName(l.task),
      ready: l.ready,
      note: l.ready ? "Clear to start — materials, labour and predecessors satisfied." : l.note,
    })),
    commentary,
  });

  const actual = overallProgress(rows);
  const expected = expectedOverall(rows);
  const daysLost = delays.reduce((s, d) => s + d.daysLost, 0);

  return (
    <div className="space-y-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-semibold">Progress &amp; Delay Report</h2>
          <p className="text-[12.5px] text-[var(--ink-500)]">
            Auto-compiled from the planner — progress, slippage, causes, constraints and every
            comment recorded on site. Issue to the main contractor as PDF or Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="h-8 w-[160px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABEL) as ReportPeriod[]).map((p) => (
                <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportProgressReportPdf(payload());
              toast.success("Progress report exported", { description: "PDF downloaded" });
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await exportProgressReportXlsx(payload());
              toast.success("Progress report exported", { description: "XLSX downloaded" });
            }}
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Progress vs programme"
          value={`${actual}%`}
          delta={`${expected}% due to date`}
          tone={actual >= expected ? "success" : "warning"}
          trend={actual >= expected ? "up" : "down"}
        />
        <Kpi label="Recorded delays" value={String(delays.length)} delta={`${daysLost} days lost`} tone={delays.length ? "warning" : "success"} />
        <Kpi label="Open constraints" value={String(blockers.length)} delta={blockers.length ? "action required" : "all clear"} tone={blockers.length ? "danger" : "success"} />
        <Kpi label="Entries logged" value={String(comments.length)} delta={PERIOD_LABEL[period].toLowerCase()} />
      </div>

      <Card>
        <CardHead
          title="Executive summary"
          subtitle="Generated from the planner data, delay register and site comments"
          right={<Sparkles className="h-4 w-4 text-[var(--accent-500)]" />}
        />
        <div className="space-y-3 px-5 pb-5 text-[13px] leading-relaxed text-[var(--ink-700)]">
          {summary.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Commentary / mitigation" subtitle="Your own note — included in both exports" />
        <div className="px-5 pb-5">
          <Textarea
            rows={3}
            value={commentary}
            placeholder="e.g. Additional taping crew mobilised from Monday to recover the 4 days lost on L5. Extension of time reserved for the lobby access delay."
            onChange={(e) => setCommentaryState(e.target.value)}
            onBlur={() => {
              setCommentary(PID, commentary);
              toast.success("Commentary saved");
            }}
          />
        </div>
      </Card>

      <Card>
        <CardHead title="Progress against programme" subtitle={`${rows.length} activities`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--ink-50)] text-left text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2">Ref</th>
                <th className="px-4 py-2">Activity</th>
                <th className="px-4 py-2">Crew</th>
                <th className="px-4 py-2">Planned</th>
                <th className="px-4 py-2">Current</th>
                <th className="px-4 py-2 text-right">% done</th>
                <th className="px-4 py-2 text-right">% due</th>
                <th className="px-4 py-2 text-right">Var</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.taskId} className="border-t border-[var(--ink-200)]">
                  <td className="px-4 py-2 font-mono-num text-[11px] text-[var(--ink-500)]">{r.taskId}</td>
                  <td className="px-4 py-2">
                    <span className="font-medium">{r.title}</span>
                    <span className="ml-2 text-[11px] text-[var(--ink-500)]">{r.level}</span>
                  </td>
                  <td className="px-4 py-2 text-[var(--ink-500)]">{r.crew}</td>
                  <td className="px-4 py-2 font-mono-num text-[11px]">{r.plannedStart} → {r.plannedEnd}</td>
                  <td className="px-4 py-2 font-mono-num text-[11px]">{r.currentStart} → {r.currentEnd}</td>
                  <td className="px-4 py-2 text-right font-mono-num">{r.progress}%</td>
                  <td className="px-4 py-2 text-right font-mono-num text-[var(--ink-500)]">{r.expected}%</td>
                  <td className={`px-4 py-2 text-right font-mono-num ${r.varianceDays < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-500)]"}`}>
                    {r.varianceDays === 0 ? "—" : r.varianceDays > 0 ? `+${r.varianceDays}` : r.varianceDays}
                  </td>
                  <td className="px-4 py-2 capitalize text-[var(--ink-500)]">{r.status.replace("-", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Delay register" subtitle="Every date movement in the period, with the reason recorded at the time" />
        <div className="space-y-3 px-5 pb-5">
          {delays.length === 0 && (
            <p className="text-[12.5px] text-[var(--ink-500)]">
              No date changes recorded in this period.
            </p>
          )}
          {delays.map((d) => (
            <div key={d.taskId} className="rounded-md border-l-4 border-l-[var(--amber-500)] border border-[var(--ink-200)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-num text-[11px] text-[var(--ink-500)]">{d.taskId}</span>
                <span className="text-[13px] font-semibold">{d.taskTitle}</span>
                <StatusBadge tone="warning" dot>{d.daysLost}d lost</StatusBadge>
                <span className="rounded bg-[var(--ink-50)] px-2 py-0.5 text-[11px]">{DELAY_CAUSE_LABEL[d.cause]}</span>
              </div>
              <p className="mt-1 font-mono-num text-[11px] text-[var(--ink-500)]">
                {d.originalStart} → {d.originalEnd}  ⇒  {d.currentStart} → {d.currentEnd}
              </p>
              <p className="mt-1.5 text-[12.5px] text-[var(--ink-700)]">{d.explanation}</p>
              <p className="mt-1 text-[11px] text-[var(--ink-500)]">
                Recorded by {d.recordedBy} · {new Date(d.recordedAt).toLocaleDateString("en-GB")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Constraint / blocker register" subtitle="Live from the planner readiness engine" />
        <div className="space-y-2 px-5 pb-5">
          {blockers.length === 0 && (
            <p className="text-[12.5px] text-[var(--ink-500)]">No open constraints.</p>
          )}
          {blockers.map((b, i) => (
            <div key={i} className="rounded-md border border-[var(--ink-200)] p-3 text-[12.5px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-num text-[11px] text-[var(--ink-500)]">{b.taskId}</span>
                <span className="font-semibold">{b.taskTitle}</span>
                <span className="rounded bg-[var(--red-500)]/10 px-2 py-0.5 text-[11px] capitalize text-[var(--red-500)]">{b.type}</span>
              </div>
              <p className="mt-1 text-[var(--ink-700)]">{b.note}</p>
              <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                Owner: {b.owner} · {b.action}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Two-week look ahead" subtitle="Activities starting within 14 days and whether they are clear" />
        <div className="space-y-2 px-5 pb-5">
          {lookAheadRaw.length === 0 && (
            <p className="text-[12.5px] text-[var(--ink-500)]">Nothing scheduled to start in the next two weeks.</p>
          )}
          {lookAheadRaw.map((l) => (
            <div key={l.task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--ink-200)] p-3 text-[12.5px]">
              <div>
                <span className="font-mono-num text-[11px] text-[var(--ink-500)]">{l.task.id}</span>{" "}
                <span className="font-medium">{l.task.title}</span>
                <span className="ml-2 text-[11.5px] text-[var(--ink-500)]">starts {l.task.start} · {crewName(l.task)}</span>
                {!l.ready && <p className="mt-0.5 text-[11.5px] text-[var(--amber-500)]">{l.note}</p>}
              </div>
              <StatusBadge tone={l.ready ? "success" : "warning"} dot>
                {l.ready ? "Clear to start" : "Not clear"}
              </StatusBadge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Site comment log" subtitle={`${comments.length} entries · ${PERIOD_LABEL[period].toLowerCase()}`} />
        <div className="space-y-2 px-5 pb-5">
          {comments.length === 0 && (
            <p className="text-[12.5px] text-[var(--ink-500)]">No entries recorded in this period.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 border-b border-[var(--ink-200)] pb-2 text-[12.5px] last:border-0">
              <span className="w-[86px] shrink-0 font-mono-num text-[11px] text-[var(--ink-500)]">
                {new Date(c.at).toLocaleDateString("en-GB")}
              </span>
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{c.taskTitle}</span>{" "}
                  <span className="text-[11px] text-[var(--ink-500)]">{c.taskId} · {c.author}</span>
                </p>
                <p className="text-[var(--ink-700)]">
                  {c.reason ?? `${c.kind}: ${c.from ?? ""} → ${c.to ?? ""}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
