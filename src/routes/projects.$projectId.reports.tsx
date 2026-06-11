import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { FileText, Download, ClipboardList } from "lucide-react";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useProject } from "@/lib/ProjectContext";
import { CashflowForecastCard } from "@/components/payments/CashflowForecastCard";
import { PaymentCycleKpiStrip } from "@/components/payments/PaymentCycleKpiStrip";
import { useProjectDailyReports } from "@/lib/dailyReportSubmissions";
import { useProjectVariations } from "@/lib/variations";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/reports")({ component: GuardedReportsPage });

function GuardedReportsPage() {
  const allowed = useCan("view.financials.lite");
  if (!allowed) return <NoAccess cap="view.financials.lite" title="Reports restricted" />;
  return <ReportsPage />;
}

const tone = {
  Daily: "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  Weekly: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  QA: "bg-purple-500/10 text-purple-600",
  Variation: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

type ReportType = keyof typeof tone;
type ReportRow = { id: string; title: string; who: string; when: string; type: ReportType; href?: string };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return `today ${d.toTimeString().slice(0, 5)}`;
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `yesterday ${d.toTimeString().slice(0, 5)}`;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

function ReportsPage() {
  const { projectId } = Route.useParams();
  const { current } = useProject();
  const canSeePayments = useCan("view.payments");
  const ourRole = current.ourRole ?? "subcontractor";
  const counterparty = current.mainContractor;
  const daily = useProjectDailyReports(projectId);
  const variations = useProjectVariations(projectId);

  const dailyRows: ReportRow[] = daily.map((d, i) => ({
    id: `DR-${String(daily.length - i).padStart(3, "0")}`,
    title: `Daily site report — ${new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
    who: d.actor,
    when: formatWhen(d.ts),
    type: "Daily",
  }));
  const variationRows: ReportRow[] = variations.slice(0, 5).map((v) => ({
    id: v.id,
    title: `${v.title}${v.reference ? ` — ${v.reference}` : ""}`,
    who: v.raisedByName ?? "—",
    when: v.submittedAt ? formatWhen(v.submittedAt) : formatWhen(v.createdAt),
    type: "Variation",
  }));

  const allReports = [...dailyRows, ...variationRows].slice(0, 20);
  const dailyMTD = daily.filter((d) => d.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Daily reports MTD" value={String(dailyMTD)} delta={`${daily.length} all-time`} />
        <Kpi label="Variations" value={String(variations.length)} delta={`${variations.filter((v) => v.status === "approved").length} approved`} tone={variations.length > 0 ? "info" : "neutral"} />
        <Kpi label="On-time submission" value={daily.length > 0 ? "—" : "n/a"} delta="based on submitted dailies" tone="neutral" />
        <Kpi label="Open RFIs" value="—" delta="not tracked yet" tone="neutral" />
      </div>

      {canSeePayments && (
        <>
          <PaymentCycleKpiStrip projectId={projectId} />
          <CashflowForecastCard projectId={projectId} counterparty={counterparty} ourRole={ourRole} />
        </>
      )}

      <Card>
        <CardHead
          title="Project reports"
          subtitle="Daily site reports and variation register"
          right={<Button size="sm" asChild><Link to="/daily-report"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Open daily report</Link></Button>}
        />
        <div className="divide-y divide-[var(--ink-200)]">
          {allReports.length === 0 && (
            <div className="px-5 py-10 text-center text-[12.5px] text-[var(--ink-500)]">
              No reports yet. Submit a daily report or raise a variation to populate this view.
            </div>
          )}
          {allReports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--ink-50)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ink-50)]">
                <FileText className="h-4 w-4 text-[var(--ink-500)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{r.title}</p>
                <p className="text-[11px] text-[var(--ink-500)]">{r.who} · {r.when} · {r.id}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${tone[r.type]}`}>{r.type}</span>
              <button className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Download">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
