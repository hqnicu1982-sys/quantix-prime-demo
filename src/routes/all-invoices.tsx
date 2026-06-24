import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CircleDollarSign, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { Input } from "@/components/ui/input";
import { useInvoices } from "@/lib/invoiceRegistry";
import { useProject } from "@/lib/ProjectContext";
import { reconFlow, fmtMoney } from "@/lib/mockData";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/all-invoices")({
  head: () => ({ meta: [{ title: "All Invoices — Quantix Prime" }] }),
  component: Guarded,
});

function Guarded() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <AllInvoicesPage />;
}

type StatusFilter = "all" | "outstanding" | "overdue" | "paid" | "disputed";

function AllInvoicesPage() {
  const invoices = useInvoices();
  const { all: projectList } = useProject();
  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectList) m.set(p.id, p.name);
    return m;
  }, [projectList]);

  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // KPIs across ALL projects
  const kpis = useMemo(() => {
    let total = invoices.length;
    let outstandingAmt = 0;
    let overdueCount = 0;
    let thisMonth = 0;
    let disputedCount = 0;
    let disputedAmt = 0;
    for (const inv of invoices) {
      const isOutstanding = inv.status === "outstanding" || inv.status === "overdue";
      const isOverdue = isOutstanding && inv.due < today;
      if (isOutstanding) outstandingAmt += inv.amount;
      if (isOverdue) overdueCount += 1;
      if (inv.issued.startsWith(monthPrefix)) thisMonth += 1;
      // "Disputed" proxy: payable & overdue > 14d (no explicit disputed flag in registry)
      if (inv.direction === "payable" && isOverdue) {
        const days = Math.floor((Date.parse(today) - Date.parse(inv.due)) / 86400000);
        if (days >= 7) { disputedCount += 1; disputedAmt += inv.amount; }
      }
    }
    return { total, outstandingAmt, overdueCount, thisMonth, disputedCount, disputedAmt };
  }, [invoices, today, monthPrefix]);

  // Filter + sort: overdue first, then by due ascending
  const rows = useMemo(() => {
    const filtered = invoices.filter((inv) => {
      if (projectFilter !== "all" && inv.projectId !== projectFilter) return false;
      const isOutstanding = inv.status === "outstanding" || inv.status === "overdue";
      const isOverdue = isOutstanding && inv.due < today;
      if (statusFilter === "outstanding" && !isOutstanding) return false;
      if (statusFilter === "overdue" && !isOverdue) return false;
      if (statusFilter === "paid" && inv.status !== "paid") return false;
      if (statusFilter === "disputed") {
        if (!(inv.direction === "payable" && isOverdue)) return false;
        const days = Math.floor((Date.parse(today) - Date.parse(inv.due)) / 86400000);
        if (days < 7) return false;
      }
      if (q) {
        const needle = q.toLowerCase();
        const projName = projectNameById.get(inv.projectId) ?? "";
        if (![inv.reference, inv.counterparty, projName].some((s) => s.toLowerCase().includes(needle))) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      const aOverdue = (a.status === "outstanding") && a.due < today ? 1 : 0;
      const bOverdue = (b.status === "outstanding") && b.due < today ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return a.due.localeCompare(b.due);
    });
  }, [invoices, projectFilter, statusFilter, q, today, projectNameById]);

  return (
    <Section
      title="All Invoices"
      subtitle="Firm-wide · every invoice across all your projects"
      right={
        <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
          <Layers className="h-3 w-3" /> Portfolio view
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total invoices" value={`${kpis.total}`} delta={`${projectList.length} projects`} />
        <Kpi
          label="Outstanding"
          value={`£${(kpis.outstandingAmt / 1000).toFixed(0)}k`}
          delta={kpis.overdueCount > 0 ? `${kpis.overdueCount} overdue` : "all current"}
          tone={kpis.overdueCount > 0 ? "warning" : "success"}
        />
        <Kpi label="This month" value={`${kpis.thisMonth}`} delta="created" />
        <Kpi
          label="Disputed"
          value={`${kpis.disputedCount}`}
          delta={kpis.disputedAmt > 0 ? `£${kpis.disputedAmt.toLocaleString()} at risk` : "none flagged"}
          tone={kpis.disputedCount > 0 ? "danger" : "neutral"}
        />
      </div>

      <Card>
        <CardHead title="Reconciliation flow" subtitle="Aggregated across every project · BoQ → Committed → Invoiced → Paid" />
        <div className="flex flex-wrap items-center gap-3 p-5">
          {reconFlow.map((step, i) => (
            <div key={step.id} className="flex flex-1 items-center gap-3">
              <div className={cn(
                "flex-1 rounded-lg border-2 p-4 text-center",
                step.tone === "neutral" && "border-[var(--ink-200)] bg-[var(--ink-50)]",
                step.tone === "info" && "border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5",
                step.tone === "warning" && "border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5",
                step.tone === "success" && "border-[var(--green-600)]/30 bg-[var(--green-600)]/5",
              )}>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{step.label}</p>
                <p className="font-display mt-1.5 text-[20px] font-semibold tabular-nums">{fmtMoney(step.value, { compact: true })}</p>
                {step.suffix && <p className="mt-0.5 text-[10.5px] text-[var(--ink-500)]">{step.suffix}</p>}
              </div>
              {i < reconFlow.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title="All invoices · firm-wide"
          subtitle={`${rows.length} of ${invoices.length} invoices · click a row to open`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-8 rounded-md border border-[var(--ink-200)] bg-background px-2 text-[12px]"
              >
                <option value="all">All projects</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-8 rounded-md border border-[var(--ink-200)] bg-background px-2 text-[12px]"
              >
                <option value="all">All statuses</option>
                <option value="outstanding">Outstanding</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
                <option value="disputed">Disputed</option>
              </select>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ref / supplier / project"
                className="h-8 w-[240px] text-[12px]"
              />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Ref</th>
                <th className="px-4 py-2.5 text-left font-semibold">Supplier / Client</th>
                <th className="px-4 py-2.5 text-left font-semibold">Direction</th>
                <th className="px-4 py-2.5 text-left font-semibold">Issued</th>
                <th className="px-4 py-2.5 text-left font-semibold">Due</th>
                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[12px] text-[var(--ink-500)]">No invoices match the filter.</td></tr>
              )}
              {rows.map((inv) => {
                const overdue = inv.status === "outstanding" && inv.due < today;
                const daysOverdue = overdue
                  ? Math.floor((Date.parse(today) - Date.parse(inv.due)) / 86400000)
                  : 0;
                const projName = projectNameById.get(inv.projectId) ?? inv.projectId;
                return (
                  <tr key={inv.id} className={cn("hover:bg-[var(--ink-50)]", overdue && "bg-[var(--red-500)]/5")}>
                    <td className="px-4 py-3">
                      <Link
                        to="/projects/$projectId/invoices"
                        params={{ projectId: inv.projectId }}
                        className="font-medium text-[var(--ink-900)] hover:underline"
                      >
                        {projName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-700)]">
                      {inv.direction === "payable" ? (
                        <Link to="/invoices/$ref" params={{ ref: inv.reference }} className="hover:underline">{inv.reference}</Link>
                      ) : (
                        inv.reference
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{inv.counterparty}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold",
                        inv.direction === "receivable"
                          ? "bg-[var(--green-600)]/10 text-[var(--green-600)]"
                          : "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
                      )}>
                        <CircleDollarSign className="h-3 w-3" />
                        {inv.direction === "receivable" ? "In" : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--ink-500)]">{inv.issued}</td>
                    <td className={cn("px-4 py-3 text-[12px]", overdue ? "font-semibold text-[var(--red-500)]" : "text-[var(--ink-500)]")}>{inv.due}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">£{inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {inv.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 rounded border border-[var(--red-500)]/30 bg-[var(--red-500)]/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--red-500)]">
                          <AlertTriangle className="h-3 w-3" /> Overdue {daysOverdue}d
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ink-500)]">Outstanding</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}