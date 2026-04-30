import { createFileRoute } from "@tanstack/react-router";
import { Section, Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  financialKpi, projectMargins, pnlSummary, cashflow30,
  topSuppliersSpend, retentionHeld, fmtMoney,
} from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { exportProjectPack } from "@/lib/exportProjectPack";
import { FileDown } from "lucide-react";
import { useInvoiceTotals } from "@/lib/invoiceRegistry";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { LiveLabourCostCard } from "@/components/financial/LiveLabourCostCard";
import { CashflowForecastCard } from "@/components/payments/CashflowForecastCard";

export const Route = createFileRoute("/financial")({
  head: () => ({ meta: [{ title: "Financial Dashboard — Quantix Prime" }] }),
  component: GuardedFinancial,
});

function GuardedFinancial() {
  const allowed = useCan("view.financials");
  if (!allowed) return <NoAccess cap="view.financials" title="Financial dashboard restricted" />;
  return <Financial />;
}

const HEALTH_COLOR: Record<string, string> = {
  healthy: "var(--green-600)",
  watch: "var(--amber-500)",
  risk: "var(--red-500)",
  starting: "var(--accent-500)",
};

function Financial() {
  const [period, setPeriod] = useState<"This month" | "Last month" | "QTD" | "YTD">("This month");
  const { current } = useProject();
  const projectData = useProjectData(current.id);
  const invoiceTotals = useInvoiceTotals(current.id);
  const ourRole = current.ourRole ?? "subcontractor";
  const counterparty = current.mainContractor;
  const cyclePeriod = () => {
    const opts = ["This month", "Last month", "QTD", "YTD"] as const;
    const next = opts[(opts.indexOf(period) + 1) % opts.length];
    setPeriod(next);
    toast(`Period: ${next}`);
  };
  const handleExportPack = () => {
    try {
      exportProjectPack(current, projectData);
      toast.success("Project pack exported", { description: `${current.name} · PDF downloaded` });
    } catch (e) {
      toast.error("Export failed", { description: String((e as Error).message ?? e) });
    }
  };
  return (
    <Section
      title="Financial Dashboard"
      subtitle="Real-time P&L · margin trending · variance analysis across all active projects"
      right={
        <>
          <Button variant="outline" size="sm" onClick={cyclePeriod}><Calendar className="mr-1.5 h-3.5 w-3.5" />{period}</Button>
          <Button variant="outline" size="sm" onClick={handleExportPack}><FileDown className="mr-1.5 h-3.5 w-3.5" />Export project pack</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Financials exported", { description: `${period} P&L · XLSX downloaded` })}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        </>
      }
    >
      <ProjectBanner scope="Financial" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue MTD" value={fmtMoney(financialKpi.revenueMtd)} delta={`vs target £${(financialKpi.revenueTarget / 1000).toFixed(0)}k (+${financialKpi.revenueDeltaPct}%)`} tone="success" trend="up" />
        <Kpi label="COGS MTD" value={fmtMoney(financialKpi.cogsMtd)} delta={`${financialKpi.cogsRevenuePct}% of revenue (vs ${financialKpi.cogsBudgetPct}% budget)`} tone="danger" />
        <Kpi label="Gross margin" value={`${financialKpi.marginPct}%`} delta={`${fmtMoney(financialKpi.margin)} (vs ${financialKpi.marginBudgetPct}% budget)`} tone="warning" />
        <Kpi label="Cash runway" value={`${financialKpi.cashRunway} mo`} delta={`${fmtMoney(financialKpi.cashCurrent)} current`} tone="success" />
      </div>

      <LiveLabourCostCard projectId={current.id} />

      <CashflowForecastCard projectId={current.id} counterparty={counterparty} ourRole={ourRole} compact />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHead title="Margin by project" subtitle="Sorted lowest to highest · coloured by health" />
            <div className="h-[320px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...projectMargins].sort((a, b) => a.margin - b.margin)} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-500)" }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-700)" }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                    {projectMargins.map((p, i) => (
                      <Cell key={i} fill={HEALTH_COLOR[p.health] ?? "var(--ink-500)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead title="P&L summary" subtitle="Month to date" />
            <div className="space-y-4 p-5 text-[13px]">
              <PnlGroup label="Revenue" rows={pnlSummary.revenue} total={pnlSummary.revenueTotal} />
              <PnlGroup label="Direct costs" rows={pnlSummary.costs} total={pnlSummary.costsTotal} />
              <div className="flex justify-between border-y border-[var(--ink-200)] py-2.5">
                <span className="font-semibold">Gross profit</span>
                <span className="font-mono font-semibold tabular-nums text-[var(--green-600)]">{fmtMoney(pnlSummary.grossProfit)} · {pnlSummary.grossPct}%</span>
              </div>
              <PnlGroup label="Overheads" rows={pnlSummary.overheads} total={pnlSummary.overheadsTotal} />
              <div className="flex justify-between rounded-md bg-[var(--navy-950)] px-3 py-2.5 text-white">
                <span className="font-semibold">Net profit</span>
                <span className="font-mono font-semibold tabular-nums">{fmtMoney(pnlSummary.netProfit)} · {pnlSummary.netPct}%</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead title="Cashflow (30d)" />
            <div className="h-[110px] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow30}>
                  <Area type="monotone" dataKey="cash" stroke="var(--accent-500)" fill="var(--accent-500)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[var(--ink-200)] border-t border-[var(--ink-200)] text-center">
              <div className="px-2 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Receivables</p>
                <p className="font-mono mt-1 text-[14px] font-semibold tabular-nums">£{(invoiceTotals.receivables / 1000).toFixed(0)}k</p>
                {invoiceTotals.overdueReceivable > 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--red-500)]">£{(invoiceTotals.overdueReceivable / 1000).toFixed(0)}k overdue</p>
                )}
              </div>
              <div className="px-2 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Payables</p>
                <p className="font-mono mt-1 text-[14px] font-semibold tabular-nums">£{(invoiceTotals.payables / 1000).toFixed(0)}k</p>
                {invoiceTotals.overduePayable > 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--red-500)]">£{(invoiceTotals.overduePayable / 1000).toFixed(0)}k overdue</p>
                )}
              </div>
              <div className="px-2 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Net</p>
                <p className={`font-mono mt-1 text-[14px] font-semibold tabular-nums ${invoiceTotals.net >= 0 ? "text-[var(--green-600)]" : "text-[var(--red-500)]"}`}>£{(invoiceTotals.net / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Top 5 suppliers by spend" />
            <div className="space-y-2.5 p-4">
              {topSuppliersSpend.map((s) => {
                const max = Math.max(...topSuppliersSpend.map((x) => x.value));
                return (
                  <div key={s.name}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span>{s.name}</span>
                      <span className="font-mono font-semibold tabular-nums">£{(s.value / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
                      <div className="h-full rounded-full bg-[var(--accent-500)]" style={{ width: `${(s.value / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHead title="Retention held" subtitle="Released next 90 days" />
            <div className="divide-y divide-[var(--ink-200)] text-[13px]">
              {retentionHeld.map((r) => (
                <div key={r.mc} className="flex justify-between px-4 py-2.5">
                  <span>{r.mc}</span>
                  <span className="font-mono font-semibold tabular-nums">£{(r.value / 1000).toFixed(0)}k</span>
                </div>
              ))}
              <div className="flex justify-between bg-[var(--ink-50)] px-4 py-2.5">
                <span className="font-semibold">Total</span>
                <span className="font-mono font-bold tabular-nums">£84k</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function PnlGroup({ label, rows, total }: { label: string; rows: { label: string; value: number }[]; total: number }) {
  return (
    <div>
      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-[12.5px]">
            <span className="text-[var(--ink-700)]">{r.label}</span>
            <span className="font-mono tabular-nums">{fmtMoney(r.value)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--ink-200)] pt-1.5 text-[13px] font-semibold">
          <span>Total {label.toLowerCase()}</span>
          <span className="font-mono tabular-nums">{fmtMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
