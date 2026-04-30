import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { fitzrovia, fitzroviaSystems, fitzroviaHealth, fitzroviaActivity, fmtMoney } from "@/lib/mockData";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { useProjectTasks } from "@/lib/planner";
import { useAssignments, usePriceWorkRates } from "@/lib/labour";
import { useLabourLogs } from "@/lib/laborLog";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { MyScopeCard } from "@/components/dashboard/MyScopeCard";
import { ApprovalInboxCard } from "@/components/dashboard/ApprovalInboxCard";
import { LiveLabourCostCard } from "@/components/financial/LiveLabourCostCard";
import { PaymentCycleKpiStrip } from "@/components/payments/PaymentCycleKpiStrip";

export const Route = createFileRoute("/projects/$projectId/")({ component: Overview });

function Overview() {
  const { projectId } = Route.useParams();
  const { all } = useProject();
  const project = all.find((p) => p.id === projectId);
  const me = useCurrentUser();
  const canSeeFinancials = useCan("view.financials");
  const canSeeFinancialsLite = useCan("view.financials.lite");
  const canSeePayments = useCan("view.payments");
  const myAssignments = useAssignments(projectId);
  const isOnProject = myAssignments.some((a) => a.memberId === me.id);
  const isOperative = me.tier === "Operative" || me.tier === "Site User";

  // Fitzrovia uses curated mock data; other projects show generic project KPIs derived from the project record.
  if (projectId !== "fitzrovia") {
    if (!project) return null;
    const spent = project.contractValue * (project.progress / 100) * 0.85;
    return (
      <div className="space-y-5">
        {canSeeFinancials ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Contract" value={fmtMoney(project.contractValue, { compact: true })} />
            <Kpi label="Spent" value={fmtMoney(spent, { compact: true })} delta={`${project.progress}% complete`} />
            <Kpi label="Forecast margin" value={`${project.margin.toFixed(1)}%`} tone={project.margin >= 18 ? "success" : project.margin >= 12 ? "warning" : "danger"} />
            <Kpi label="Progress" value={`${project.progress}%`} />
          </div>
        ) : canSeeFinancialsLite ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Kpi label="Spent vs budget" value={`${Math.round((spent / project.contractValue) * 100)}%`} delta={`${fmtMoney(spent, { compact: true })} of ${fmtMoney(project.contractValue, { compact: true })}`} />
            <Kpi label="Progress" value={`${project.progress}%`} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Kpi label="Progress" value={`${project.progress}%`} />
            <Kpi label="Health" value={project.health} />
          </div>
        )}
        {isOnProject && <MyScopeCard projectId={projectId} />}
        <ApprovalInboxCard />
        {canSeePayments && <PaymentCycleKpiStrip projectId={projectId} />}
        <ProjectSetupChecklist projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {canSeeFinancials ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Contract" value={fmtMoney(fitzrovia.contractValue, { compact: true })} />
          <Kpi label="Spent" value={fmtMoney(fitzrovia.spent, { compact: true })} delta={`${fitzrovia.spentPct}% of budget`} tone="warning" />
          <Kpi label="Forecast margin" value={`${fitzrovia.forecastMargin}%`} delta={`${fmtMoney(fitzrovia.forecastProfit, { compact: true })} projected profit`} tone="success" />
          <Kpi label="Progress" value={`${fitzrovia.progress}%`} delta={`${fitzrovia.programmeAhead} days ahead of programme`} tone="success" trend="up" />
        </div>
      ) : canSeeFinancialsLite ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi label="Spent vs budget" value={`${fitzrovia.spentPct}%`} delta={`${fmtMoney(fitzrovia.spent, { compact: true })} of ${fmtMoney(fitzrovia.contractValue, { compact: true })}`} tone="warning" />
          <Kpi label="Progress" value={`${fitzrovia.progress}%`} delta={`${fitzrovia.programmeAhead} days ahead`} tone="success" trend="up" />
          <Kpi label="Programme variance" value={`+${fitzrovia.programmeAhead}d`} tone="success" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Kpi label="Progress" value={`${fitzrovia.progress}%`} delta={`${fitzrovia.programmeAhead} days ahead`} tone="success" trend="up" />
          <Kpi label="Programme variance" value={`+${fitzrovia.programmeAhead}d`} tone="success" />
        </div>
      )}

      {isOnProject && <MyScopeCard projectId={projectId} />}

      <ApprovalInboxCard />

      {canSeePayments && <PaymentCycleKpiStrip projectId={projectId} />}

      {(canSeeFinancials || canSeeFinancialsLite) && <LiveLabourCostCard projectId={projectId} />}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {canSeeFinancials && (
          <Card>
            <CardHead title="Three-way cost comparison" subtitle="Estimated → Priced → Actual" />
            <div className="space-y-4 p-5 text-[13px]">
              {[
                { label: "Estimated (BoQ)", value: fitzrovia.estimatedBoq, color: "var(--ink-500)" },
                { label: "Priced (Costed BoQ)", value: fitzrovia.pricedBoq, color: "var(--accent-500)" },
                { label: "Actual to date", value: fitzrovia.actualToDate, color: "var(--green-600)" },
              ].map((r) => {
                const max = fitzrovia.estimatedBoq;
                const pct = (r.value / max) * 100;
                return (
                  <div key={r.label}>
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">{r.label}</span>
                      <span className="font-mono-num font-semibold">{fmtMoney(r.value)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--ink-50)]">
                      <div className="h-full" style={{ width: `${pct}%`, background: r.color }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-md bg-[var(--green-600)]/10 p-3">
                <span className="text-[12px] font-medium text-[var(--green-600)]">Saved vs estimate</span>
                <span className="font-display text-[16px] font-semibold text-[var(--green-600)]">–{fmtMoney(fitzrovia.savedVsEstimate)}</span>
              </div>
            </div>
          </Card>
          )}

          <Card>
            <CardHead title="Systems on this project" />
            <div className="divide-y divide-[var(--ink-200)]">
              {fitzroviaSystems.map((s) => (
                <div key={s.name} className="flex items-center gap-4 px-5 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold text-white ${
                    s.color === "blue" ? "bg-[var(--accent-500)]" : s.color === "green" ? "bg-[var(--green-600)]" : s.color === "amber" ? "bg-[var(--amber-500)]" : "bg-purple-500"
                  }`}>
                    {s.name.split(" ")[0].slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{s.name}</p>
                    <p className="text-[11.5px] text-[var(--ink-500)]">{s.area}{canSeeFinancialsLite ? ` · ${fmtMoney(s.value)}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono-num text-[14px] font-semibold ${s.readiness >= 95 ? "text-[var(--green-600)]" : "text-[var(--amber-500)]"}`}>{s.readiness}%</p>
                    <p className="text-[10.5px] text-[var(--ink-500)]">readiness</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead title="Project health" />
            <div className="space-y-4 p-5">
              {fitzroviaHealth.map((h) => (
                <div key={h.label}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="font-medium">{h.label}</span>
                    <span className={`font-mono-num font-semibold ${h.status === "healthy" ? "text-[var(--green-600)]" : h.status === "watch" ? "text-[var(--amber-500)]" : "text-[var(--red-500)]"}`}>{h.value}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
                    <div className={`h-full ${h.status === "healthy" ? "bg-[var(--green-600)]" : h.status === "watch" ? "bg-[var(--amber-500)]" : "bg-[var(--red-500)]"}`} style={{ width: `${h.value}%` }} />
                  </div>
                  <p className="mt-1 text-[10.5px] text-[var(--ink-500)]">{h.note}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Recent activity" />
            <div className="space-y-3 p-5">
              {fitzroviaActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.tone === "success" ? "bg-[var(--green-600)]" : a.tone === "warning" ? "bg-[var(--amber-500)]" : "bg-[var(--accent-500)]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-tight">{a.title}</p>
                    <p className="text-[10.5px] text-[var(--ink-500)]">{a.who} · {a.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          to="/projects/$projectId/costed-boq"
          params={{ projectId }}
          className="text-[12.5px] font-medium text-[var(--accent-500)] hover:underline"
        >
          Open Costed BoQ →
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Project setup checklist — auto-checks each step from real project data
// ============================================================================
type SetupStep = {
  key: string;
  title: string;
  hint: string;
  done: boolean;
  autoDone: boolean;
  detail?: string;
  to: "/projects/$projectId/specification" | "/projects/$projectId/costed-boq" | "/projects/$projectId/planner" | "/projects/$projectId/team" | "/projects/$projectId/calloffs" | "/daily-report";
  cta: string;
};

function ProjectSetupChecklist({ projectId }: { projectId: string }) {
  const data = useProjectData(projectId);
  const tasks = useProjectTasks(projectId);
  const assignments = useAssignments(projectId);
  const pwRates = usePriceWorkRates(projectId);
  const labourLogs = useLabourLogs(projectId);

  // Manual overrides — lets the user tick steps that can't be auto-detected (e.g. spec uploaded outside app)
  const overridesKey = `qp-setup-overrides:${projectId}`;
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(overridesKey);
      setOverrides(raw ? JSON.parse(raw) : {});
    } catch { setOverrides({}); }
  }, [overridesKey]);
  const toggleOverride = (key: string, currentlyDone: boolean) => {
    const next = { ...overrides, [key]: !currentlyDone };
    setOverrides(next);
    try { localStorage.setItem(overridesKey, JSON.stringify(next)); } catch {}
  };

  const auto: Omit<SetupStep, "done">[] = [
    {
      key: "spec",
      title: "Upload specification",
      hint: "Drawings, NBS spec, performance schedules",
      autoDone: data.systems.length > 0,
      detail: data.systems.length > 0 ? `${data.systems.length} system${data.systems.length === 1 ? "" : "s"} captured` : undefined,
      to: "/projects/$projectId/specification",
      cta: "Open Specification",
    },
    {
      key: "boq",
      title: "Build a Costed BoQ",
      hint: "Add systems from the calculator and price them",
      autoDone: data.boqLines.length > 0,
      detail: data.boqLines.length > 0 ? `${data.boqLines.length} line${data.boqLines.length === 1 ? "" : "s"} on the BoQ` : undefined,
      to: "/projects/$projectId/costed-boq",
      cta: "Open Costed BoQ",
    },
    {
      key: "planner",
      title: "Create a Planner programme",
      hint: "Sequence tasks, set durations and dependencies",
      autoDone: tasks.length > 0,
      detail: tasks.length > 0 ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} scheduled` : undefined,
      to: "/projects/$projectId/planner",
      cta: "Open Planner",
    },
    {
      key: "team",
      title: "Assign your team & labour rates",
      hint: "Invite members, pick crews, set day-rates",
      autoDone: assignments.length > 0,
      detail: assignments.length > 0 ? `${assignments.length} member${assignments.length === 1 ? "" : "s"} on project` : undefined,
      to: "/projects/$projectId/team",
      cta: "Open Team",
    },
    {
      key: "pw",
      title: "Set Price Work rates (optional)",
      hint: "Negotiated £/m², £/lm or lump-sum rates per scope",
      autoDone: pwRates.length > 0,
      detail: pwRates.length > 0 ? `${pwRates.length} PW rate${pwRates.length === 1 ? "" : "s"} defined` : undefined,
      to: "/projects/$projectId/team",
      cta: "Open Team",
    },
    {
      key: "calloffs",
      title: "Issue first call-off",
      hint: "Convert priced lines into supplier orders",
      autoDone: data.callOffs.length > 0,
      detail: data.callOffs.length > 0 ? `${data.callOffs.length} call-off${data.callOffs.length === 1 ? "" : "s"} raised` : undefined,
      to: "/projects/$projectId/calloffs",
      cta: "Open Call-offs",
    },
    {
      key: "firstReport",
      title: "Log first daily report",
      hint: "Capture hours, PW and progress on site",
      autoDone: labourLogs.length > 0,
      detail: labourLogs.length > 0 ? `${labourLogs.length} entr${labourLogs.length === 1 ? "y" : "ies"} logged` : undefined,
      to: "/daily-report",
      cta: "Open Daily Report",
    },
  ];

  const steps: SetupStep[] = auto.map((s) => ({
    ...s,
    done: s.autoDone || overrides[s.key] === true,
  }));

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card>
      <CardHead
        title="Project setup"
        subtitle={allDone ? "All set up — project is ready to run" : `Complete each step to get this project running · ${steps.length - doneCount} left`}
        right={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono-num text-[14px] font-semibold text-[var(--ink-900)]">{doneCount}/{steps.length}</p>
              <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">complete</p>
            </div>
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--ink-200)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={allDone ? "var(--green-600)" : "var(--accent-500)"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--ink-900)]">{pct}%</span>
            </div>
          </div>
        }
      />
      {allDone && (
        <div className="flex items-center gap-2 border-b border-[var(--ink-200)] bg-[var(--green-600)]/[0.06] px-5 py-2.5">
          <Sparkles className="h-4 w-4 text-[var(--green-600)]" />
          <p className="text-[12px] font-semibold text-[var(--green-600)]">Project is fully set up — financial dashboards now reflect live data.</p>
        </div>
      )}
      <ul className="divide-y divide-[var(--ink-200)]">
        {steps.map((s, i) => {
          const isNext = !s.done && s === nextStep;
          const manuallyDone = !s.autoDone && s.done;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                isNext ? "bg-[var(--accent-500)]/[0.04]" : "hover:bg-[var(--ink-50)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleOverride(s.key, s.done)}
                disabled={s.autoDone}
                title={s.autoDone ? "Auto-detected from project data" : s.done ? "Click to mark as not done" : "Click to mark as done manually"}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${s.autoDone ? "cursor-default" : "cursor-pointer hover:bg-[var(--ink-100)]"}`}
              >
                {s.done ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--green-600)]" />
                ) : (
                  <Circle className={`h-5 w-5 ${isNext ? "text-[var(--accent-500)]" : "text-[var(--ink-200)]"}`} />
                )}
              </button>
              <span className="font-mono-num w-5 text-[11px] font-semibold text-[var(--ink-500)]">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[13.5px] font-semibold ${s.done ? "text-[var(--ink-500)] line-through decoration-[var(--ink-200)]" : "text-[var(--ink-900)]"}`}>
                    {s.title}
                  </p>
                  {isNext && (
                    <span className="rounded-full bg-[var(--accent-500)]/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
                      Next
                    </span>
                  )}
                  {s.done && s.detail && (
                    <span className="text-[11px] font-medium text-[var(--green-600)]">· {s.detail}</span>
                  )}
                  {manuallyDone && (
                    <span className="rounded-full bg-[var(--ink-100)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Manual</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--ink-500)]">{s.hint}</p>
              </div>
              <Link
                to={s.to}
                {...(s.to.includes("$projectId") ? { params: { projectId } } : {})}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  isNext
                    ? "bg-[var(--accent-500)] text-white hover:opacity-90"
                    : s.done
                    ? "text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                    : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
                }`}
              >
                {s.done ? "Review" : s.cta} <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
