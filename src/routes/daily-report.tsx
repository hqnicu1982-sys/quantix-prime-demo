import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Section, Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { dailyReport, team } from "@/lib/mockData";
import { Download, Send, Cloud, Clock, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useProject } from "@/lib/ProjectContext";
import { useLabourLogsForDate, deleteLabourLog, approveLabourLog, rejectLabourLog, computeEntryCost } from "@/lib/laborLog";
import { useProjectCrews, usePriceWorkRates } from "@/lib/labour";
import { LogLabourDialog } from "@/components/daily-report/LogLabourDialog";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { useDailyReportSubmission, recordDailyReportSubmission } from "@/lib/dailyReportSubmissions";
import { CheckCircle2 } from "lucide-react";
import { RaiseVariationFromIssueDialog } from "@/components/daily-report/RaiseVariationFromIssueDialog";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/daily-report")({
  head: () => ({ meta: [{ title: "Daily Site Report — Quantix Prime" }] }),
  component: DailyReport,
});

function DailyReport() {
  const { current } = useProject();
  const me = useCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const allLogs = useLabourLogsForDate(current.id, today);
  const submission = useDailyReportSubmission(current.id, dailyReport.date);
  const crews = useProjectCrews(current.id);
  const pwRates = usePriceWorkRates(current.id);
  const canApprove = useCan("approve.labour");
  const canDelete = useCan("log.labour.others"); // same gate as editing others
  const canSeeAll = useCan("log.labour.others");

  // Scope toggle — Operatives default to "mine" since they can't act on others.
  const [scope, setScope] = useState<"mine" | "all">(canSeeAll ? "all" : "mine");
  const myCrewMemberIds = useMemo(() => {
    const myCrew = crews.find((c) => c.assignment.memberId === me.id);
    if (!myCrew) return new Set([me.id]);
    return new Set(crews.filter((c) => c.crewName === myCrew.crewName).map((c) => c.assignment.memberId));
  }, [crews, me.id]);
  const isMine = (memberId: string) => myCrewMemberIds.has(memberId);
  const logs = scope === "mine" ? allLogs.filter((l) => isMine(l.memberId)) : allLogs;

  const approvedLogs = logs.filter((l) => (l.status ?? "submitted") === "approved");
  const pendingLogs = logs.filter((l) => (l.status ?? "submitted") === "submitted");
  const totalHours = approvedLogs.reduce((s, l) => s + l.hours, 0);
  const totalCost = approvedLogs.reduce((s, l) => s + computeEntryCost(l), 0);
  const pwCount = approvedLogs.filter((l) => l.payMode === "pw").length;
  const pendingHours = pendingLogs.reduce((s, l) => s + l.hours, 0);

  return (
    <Section
      title={`Daily Site Report — ${dailyReport.date}`}
      subtitle="Unified view of site activity · submitted to main contractor at end of day"
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast("PDF preview", { description: `Daily report ${dailyReport.date} ready` })}><Download className="mr-1.5 h-3.5 w-3.5" />Preview PDF</Button>
          {canApprove && (submission ? (
            <StatusBadge tone="success" dot>
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              Submitted to {dailyReport.mainContractor} · {new Date(submission.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </StatusBadge>
          ) : (
            <Button size="sm" onClick={() => {
              if (pendingLogs.length > 0) {
                toast.warning(`${pendingLogs.length} labour ${pendingLogs.length === 1 ? "entry" : "entries"} pending approval`, { description: "Approve or reject before submitting to Kier." });
                return;
              }
              recordDailyReportSubmission({
                projectId: current.id,
                date: dailyReport.date,
                mainContractor: dailyReport.mainContractor,
                note: `${approvedLogs.length} entries · ${totalHours}h · £${Math.round(totalCost).toLocaleString()}`,
              });
              toast.success("Submitted to Kier", { description: `Daily report ${dailyReport.date} sent to ${dailyReport.mainContractor}` });
            }}>
              <Send className="mr-1.5 h-3.5 w-3.5" />Submit to Kier
            </Button>
          ))}
        </>
      }
    >
      <ProjectBanner scope="Daily Report" />
      {/* Site header */}
      <Card className="overflow-hidden bg-[var(--navy-950)] text-white">
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date" value={dailyReport.date} dark />
          <Field label="Weather" value={dailyReport.weather} dark icon={<Cloud className="h-3.5 w-3.5" />} />
          <Field label="Hours on site" value={dailyReport.hours} dark icon={<Clock className="h-3.5 w-3.5" />} />
          <Field label="Project ref" value={dailyReport.projectRef} dark />
          <Field label="Main contractor" value={dailyReport.mainContractor} dark />
          <Field label="Signed in" value={`${dailyReport.signedIn} operatives`} dark />
          <Field label="Signed out" value={`${dailyReport.signedOut} so far`} dark />
        </div>
      </Card>

      {/* Labour */}
      <Card>
        <CardHead
          title="Labour"
          subtitle={`${approvedLogs.length} approved · ${totalHours.toFixed(1)}h · £${totalCost.toFixed(0)}${pwCount ? ` · ${pwCount} PW` : ""}${pendingLogs.length ? ` · ${pendingLogs.length} pending (${pendingHours.toFixed(1)}h)` : ""}`}
          right={
            <div className="flex items-center gap-2">
              {canSeeAll && (
                <div className="inline-flex overflow-hidden rounded-lg border border-[var(--ink-200)] text-[11px] font-semibold">
                  <button
                    onClick={() => setScope("mine")}
                    className={`px-2.5 py-1 ${scope === "mine" ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-700)] hover:bg-[var(--ink-50)]"}`}
                  >My scope</button>
                  <button
                    onClick={() => setScope("all")}
                    className={`px-2.5 py-1 ${scope === "all" ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-700)] hover:bg-[var(--ink-50)]"}`}
                  >All</button>
                </div>
              )}
              <LogLabourDialog projectId={current.id} date={today} />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5">Crew</th>
                <th className="px-3 py-2.5">In</th>
                <th className="px-3 py-2.5">Out</th>
                <th className="px-3 py-2.5 text-right">Hours</th>
                <th className="px-3 py-2.5 text-right">Cost</th>
                <th className="px-3 py-2.5">Work</th>
                <th className="px-3 py-2.5">Status</th>
                {canDelete && <th className="px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">
                    No hours logged today. Click <strong>Log labour</strong> to add an entry.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const crew = crews.find((c) => c.assignment.memberId === l.memberId);
                  const member = team.find((m) => m.id === l.memberId);
                  const cost = computeEntryCost(l);
                  const status = l.status ?? "submitted";
                  const pw = l.payMode === "pw" ? pwRates.find((r) => r.id === l.pwRateId) : undefined;
                  const mine = isMine(l.memberId);
                  const isMe = l.memberId === me.id;
                  return (
                    <tr key={l.id} className={`${mine ? "bg-[var(--accent-500)]/[0.04] border-l-2 border-[var(--accent-500)]" : scope === "all" && canSeeAll ? "" : "opacity-70"}`}>
                      <td className="px-4 py-2.5 font-medium">
                        {member?.name ?? l.memberId}
                        {isMe && (
                          <span className="ml-1.5 rounded-full bg-[var(--accent-500)]/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--accent-500)]">You</span>
                        )}
                        {crew?.crewName && (
                          <span className="ml-1.5 text-[11.5px] font-normal text-[var(--ink-500)]">· {crew.crewName}</span>
                        )}
                        {l.payMode === "pw" && (
                          <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-500)]">PW</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">
                        {l.inTime} {l.late && <StatusBadge tone="warning" className="ml-1">Late</StatusBadge>}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{l.outTime}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">{l.hours}h</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">£{cost.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-[var(--ink-700)]">
                        {l.work}
                        {pw && (
                          <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--accent-500)]">
                            {pw.code}{pw.unit !== "lump" && l.pwQty ? ` · ${l.pwQty}${pw.unit}` : ""}
                          </span>
                        )}
                        {l.taskId && (
                          <span className="ml-1.5 rounded bg-[var(--ink-50)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--ink-500)]">{l.taskId}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {status === "approved" ? (
                          <StatusBadge tone="success">Approved</StatusBadge>
                        ) : status === "rejected" ? (
                          <StatusBadge tone="danger">Rejected</StatusBadge>
                        ) : canApprove ? (
                          <div className="flex gap-1">
                            <button
                              className="rounded border border-[var(--green-600)]/30 bg-[var(--green-600)]/10 p-1 text-[var(--green-600)] hover:bg-[var(--green-600)]/20"
                              onClick={() => { approveLabourLog(l.id, me.id); toast.success("Hours approved", { description: `${l.hours}h · ${member?.name ?? l.memberId}` }); }}
                              aria-label="Approve"
                            ><Check className="h-3 w-3" /></button>
                            <button
                              className="rounded border border-[var(--red-500)]/30 bg-[var(--red-500)]/10 p-1 text-[var(--red-500)] hover:bg-[var(--red-500)]/20"
                              onClick={() => { rejectLabourLog(l.id, me.id); toast.error("Hours rejected"); }}
                              aria-label="Reject"
                            ><X className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <StatusBadge tone="warning">Pending</StatusBadge>
                        )}
                      </td>
                      {canDelete && (
                        <td className="px-3 py-2.5 text-right">
                          <button
                            className="text-[var(--ink-500)] hover:text-[var(--red-500)]"
                            onClick={() => {
                              deleteLabourLog(l.id);
                              toast.success("Entry removed");
                            }}
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Materials */}
      <Card>
        <CardHead title="Materials received" />
        <div className="divide-y divide-[var(--ink-200)] text-[13px]">
          {dailyReport.materials.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div>
                <p className="font-medium">{m.supplier} · {m.ref !== "—" && <span className="font-mono text-[12px] text-[var(--ink-500)]">{m.ref}</span>}</p>
                <p className="text-[12px] text-[var(--ink-700)]">{m.item}</p>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-[var(--ink-500)]">
                <span>{m.time}</span>
                {m.signed !== "—" && <span>Signed {m.signed}</span>}
                <StatusBadge tone={m.status === "ok" ? "success" : "warning"} dot>{m.status === "ok" ? "Received" : "Pending"}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListCard title="Work done today" items={dailyReport.workDone} />
        <IssuesCard projectId={current.id} date={today} items={dailyReport.issues} />
      </div>

      <ListCard title="Tomorrow's plan" items={dailyReport.tomorrow} tone="info" />

      <Card className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[12px] text-[var(--ink-500)]">
        <span>Submitted by <strong className="text-[var(--ink-900)]">{dailyReport.submittedBy}</strong> · {dailyReport.submittedAt}</span>
        <StatusBadge tone="warning">Draft — not yet sent</StatusBadge>
      </Card>
    </Section>
  );
}

function Field({ label, value, dark, icon }: { label: string; value: string; dark?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className={`text-[10.5px] font-semibold uppercase tracking-wider ${dark ? "text-white/55" : "text-[var(--ink-500)]"}`}>{label}</p>
      <p className={`mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium ${dark ? "text-white" : "text-[var(--ink-900)]"}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone?: "warning" | "info" }) {
  const dotColor = tone === "warning" ? "bg-[var(--amber-500)]" : tone === "info" ? "bg-[var(--accent-500)]" : "bg-[var(--ink-500)]";
  return (
    <Card>
      <CardHead title={title} />
      <ul className="space-y-2.5 p-5 text-[13px] text-[var(--ink-700)]">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function IssuesCard({ projectId, date, items }: { projectId: string; date: string; items: string[] }) {
  return (
    <Card>
      <CardHead
        title="Issues / RAMS / Dayworks"
        subtitle="Raise any item as a draft Variation → flows into Planner (time) + Financial (cost)"
        right={
          <Link
            to="/variations"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--accent-500)] hover:underline"
          >
            View all VOs <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      <ul className="space-y-2.5 p-5 text-[13px] text-[var(--ink-700)]">
        {items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--amber-500)]" />
              <span>{item}</span>
            </div>
            <div className="shrink-0">
              <RaiseVariationFromIssueDialog projectId={projectId} date={date} issue={item} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
