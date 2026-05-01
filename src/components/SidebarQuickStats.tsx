import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Receipt, ListChecks } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { useLabourLogs } from "@/lib/laborLog";
import { useInvoices } from "@/lib/invoiceRegistry";
import { useProjectData } from "@/lib/projectData";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const HEALTH_DOT: Record<string, string> = {
  healthy: "bg-emerald-400",
  watch: "bg-amber-400",
  risk: "bg-red-400",
  starting: "bg-sky-400",
};

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`;
  return `£${n}`;
}

export function SidebarQuickStats() {
  const { current } = useProject();
  const projectId = current.id;

  const canApproveLabour = useCan("approve.labour");
  const canSignInvoices = useCan("sign.invoices");
  const canApproveCalloffs = useCan("approve.calloffs");

  const labourLogs = useLabourLogs(projectId);
  const invoices = useInvoices(projectId);
  const data = useProjectData(projectId);

  const approvals = canApproveLabour
    ? labourLogs.filter((l) => (l.status ?? "submitted") === "submitted").length
    : 0;
  const overdue = canSignInvoices
    ? invoices.filter((i) => i.status === "overdue").length
    : 0;
  const drafts = canApproveCalloffs
    ? data.callOffs.filter((c) => c.status === "draft").length
    : 0;

  const showStats = canApproveLabour || canSignInvoices || canApproveCalloffs;

  type Stat = {
    key: string;
    value: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
    params?: Record<string, string>;
    accent?: boolean;
  };

  const stats: Stat[] = [];
  if (canApproveLabour)
    stats.push({ key: "appr", value: approvals, label: "Approvals", icon: ClipboardCheck, to: "/daily-report", accent: approvals > 0 });
  if (canSignInvoices)
    stats.push({ key: "inv", value: overdue, label: "Overdue", icon: Receipt, to: "/invoices", accent: overdue > 0 });
  if (canApproveCalloffs)
    stats.push({ key: "co", value: drafts, label: "Drafts", icon: ListChecks, to: "/projects/$projectId/calloffs", params: { projectId } });

  const visibleStats = stats.slice(0, 3);
  const cols = visibleStats.length === 1 ? "grid-cols-1" : visibleStats.length === 2 ? "grid-cols-2" : "grid-cols-3";
  const dot = HEALTH_DOT[current.health] ?? "bg-white/40";

  return (
    <div className="space-y-2">
      {/* Project header */}
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        className="block rounded-md border border-white/10 bg-white/5 p-2.5 transition-colors hover:bg-white/10"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
            {current.name}
          </p>
          <span className={cn("mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full", dot)} title={current.health} />
        </div>
        <p className="mt-0.5 truncate text-[10.5px] text-white/55">
          {fmtMoney(current.contractValue)} · {current.mainContractor}
        </p>
      </Link>

      {/* Stats grid */}
      {showStats && visibleStats.length > 0 && (
        <div className={cn("grid gap-1.5", cols)}>
          {visibleStats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.key}
                to={s.to as "/"}
                params={s.params as never}
                className={cn(
                  "group flex flex-col items-center rounded-md border px-1.5 py-2 text-center transition-colors",
                  s.accent
                    ? "border-[var(--accent-500)]/40 bg-[var(--accent-500)]/10 hover:bg-[var(--accent-500)]/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                )}
              >
                <Icon className={cn("h-3 w-3 mb-0.5", s.accent ? "text-[var(--accent-100)]" : "text-white/40")} />
                <span className={cn("font-display text-[15px] font-semibold leading-none", s.accent ? "text-[var(--accent-100)]" : "text-white")}>
                  {s.value}
                </span>
                <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-white/55">
                  {s.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      <Link
        to="/"
        className="flex items-center justify-between rounded px-1 py-1 text-[10.5px] font-medium text-white/50 hover:text-white"
      >
        <span>Open dashboard</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
