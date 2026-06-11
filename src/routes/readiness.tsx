import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, CalendarRange } from "lucide-react";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useProject } from "@/lib/ProjectContext";
import { useProjectTasks, daysBetween, PLANNER_TODAY } from "@/lib/planner";
import { useProjectData } from "@/lib/projectData";
import { isLineCovered } from "@/lib/callOffPlanning";
import { useProjectCrews } from "@/lib/labour";

export const Route = createFileRoute("/readiness")({ component: Readiness });

type Row = {
  id: string;
  task: string;
  start: string;
  crew: string;
  status: "READY" | "AT_RISK" | "BLOCKED";
  required: { name: string; qty: string }[];
  note: string;
  action?: string;
};

function Readiness() {
  const { current } = useProject();
  const tasks = useProjectTasks(current.id);
  const data = useProjectData(current.id);
  const crews = useProjectCrews(current.id);
  const lineById = new Map(data.boqLines.map((l) => [l.id, l]));
  const draftIds = new Set(data.callOffs.filter((c) => c.status === "draft").flatMap((c) => c.lineIds));

  const rows: Row[] = tasks
    .filter((t) => t.status !== "done")
    .map((t) => {
      const days = daysBetween(PLANNER_TODAY, new Date(t.start));
      return { t, days };
    })
    .filter(({ days }) => days >= -7 && days <= 21)
    .sort((a, b) => a.days - b.days)
    .map(({ t, days }) => {
      const required = t.boqLineIds
        .map((id) => lineById.get(id))
        .filter(Boolean)
        .map((l) => ({ name: l!.material, qty: `${l!.qty} ${l!.unit}` }));
      const uncovered = t.boqLineIds.filter((id) => !isLineCovered(id, data.callOffs));
      const onlyDraft = t.boqLineIds.length > 0 && uncovered.length === 0 && t.boqLineIds.some((id) => draftIds.has(id));
      const blocked = t.status === "blocked";
      let status: Row["status"] = "READY";
      let note = "All linked materials covered by a sent or delivered call-off.";
      let action: string | undefined;
      if (blocked) {
        status = "BLOCKED";
        note = t.notes ?? "Task flagged as blocked.";
      } else if (t.boqLineIds.length === 0) {
        status = "AT_RISK";
        note = "No BoQ lines linked — auto call-off can't be proposed. Link materials from the task editor.";
      } else if (uncovered.length > 0) {
        status = "AT_RISK";
        note = `${uncovered.length} material${uncovered.length === 1 ? "" : "s"} not yet on a call-off.`;
        action = "Raise call-off";
      } else if (onlyDraft) {
        status = "AT_RISK";
        note = "Materials only on a draft call-off — confirm to send to supplier.";
        action = "Confirm draft";
      }
      const crew = crews.find((c) => c.assignment.memberId === t.crewId);
      return {
        id: t.id,
        task: t.title,
        start: `${t.start} (${days >= 0 ? `in ${days}d` : `${-days}d ago`})`,
        crew: crew ? `${crew.crewName}` : "Unassigned",
        status,
        required: required.length ? required : [{ name: "— no materials linked —", qty: "" }],
        note,
        action,
      };
    });

  const ready = rows.filter((r) => r.status === "READY").length;
  const atRisk = rows.filter((r) => r.status === "AT_RISK").length;
  const blocked = rows.filter((r) => r.status === "BLOCKED").length;
  const pct = rows.length ? Math.round((ready / rows.length) * 100) : 0;
  return (
    <Section
      title="Material Readiness"
      subtitle={`3-week look-ahead · ${rows.length} upcoming tasks · ${ready} green · ${atRisk} needs attention · ${blocked} blocked`}
    >
      <ProjectBanner scope="Material Readiness" />
      <div className="flex justify-center">
        <Card className="flex items-center gap-6 p-6">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-200)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green-600)" strokeWidth="2.5" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-[24px] font-bold">{pct}%</p>
              <p className="text-[10px] text-[var(--ink-500)]">Ready</p>
            </div>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--green-600)]" /> {ready} Ready</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--amber-500)]" /> {atRisk} At risk</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--red-500)]" /> {blocked} Blocked</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && (
          <Card className="p-6 text-center text-[12.5px] text-[var(--ink-500)]">
            No tasks in the next 3 weeks for {current.name}. Add tasks in the <Link to="/planner" className="text-[var(--accent-500)] underline">Planner</Link>.
          </Card>
        )}
        {rows.map((r) => {
          const tone = r.status === "READY" ? "success" : r.status === "AT_RISK" ? "warning" : "danger";
          return (
            <Card key={r.id} className={`border-l-4 ${r.status === "READY" ? "border-l-[var(--green-600)]" : r.status === "AT_RISK" ? "border-l-[var(--amber-500)]" : "border-l-[var(--red-500)]"}`}>
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-semibold">{r.task}</h4>
                    <StatusBadge tone={tone} dot>{r.status === "READY" ? "Ready" : r.status === "AT_RISK" ? "At risk" : "Blocked"}</StatusBadge>
                  </div>
                  <p className="text-[12px] text-[var(--ink-500)]">Starts {r.start} · {r.crew}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.required.map((m, i) => (
                      <span key={i} className="rounded bg-[var(--ink-50)] px-2 py-1 text-[11.5px]">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1 text-[var(--ink-500)]">{m.qty}</span>
                      </span>
                    ))}
                  </div>
                  <p className={`mt-3 flex items-start gap-2 text-[12px] ${r.status === "AT_RISK" ? "text-[var(--amber-500)]" : "text-[var(--ink-500)]"}`}>
                    {r.status === "AT_RISK" && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>{r.note}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                  {r.action && (
                    <Button size="sm" asChild>
                      <Link to="/calloffs/new">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> {r.action}
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/planner">
                      <CalendarRange className="mr-1.5 h-3.5 w-3.5" /> View in planner
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
