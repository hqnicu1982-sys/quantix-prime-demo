import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { financialBoq, monthlyPnl, marginAlerts, marginTrend, supplierConcentration } from "@/lib/mockData";
import { ArrowRight, AlertTriangle, ArrowDownRight, ArrowUpRight, FileDown, Mail, CalendarClock } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financial")({
  head: () => ({ meta: [{ title: "Financial Dashboard — Quantix Prime" }] }),
  component: FinancialWrapper,
});

const PIE_COLORS = ["var(--color-accent)", "var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-muted-foreground)"];

function KpiTile({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "flat" }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground";
  return (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && (
        <p className={cn("mt-0.5 inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
          {TrendIcon && <TrendIcon className="h-3 w-3" />}
          {sub}
        </p>
      )}
    </Card>
  );
}

function FinancialWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="financial dashboard" />;
  return <Financial />;
}

function Financial() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">Estimator → Buyer → Actual cost intelligence</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success("PDF exporting...", { description: "Will email when ready" })}>
            <FileDown className="mr-1 h-3.5 w-3.5" />Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Email sent to team")}>
            <Mail className="mr-1 h-3.5 w-3.5" />Email team
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toast.info("Weekly digest scheduled")}>
            <CalendarClock className="mr-1 h-3.5 w-3.5" />Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile label="Project margin" value="14.2%" sub="3.8 pts vs tender" trend="down" />
        <KpiTile label="Revenue this month" value="£184k" sub="+8.2% vs last" trend="up" />
        <KpiTile label="Cost this month" value="£158k" sub="+11.4% vs last" trend="down" />
        <KpiTile label="Variance to forecast" value="−£4.6k" sub="under forecast" trend="up" />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="font-semibold">Margin trend — 8 weeks</h2>
            <p className="text-xs text-muted-foreground">Actual margin vs 18% target</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marginTrend} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} domain={[12, 20]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => `${v}%`} />
              <ReferenceLine y={18} stroke="var(--color-warning)" strokeDasharray="5 5" label={{ value: "Target 18%", position: "right", fontSize: 10, fill: "var(--color-warning-foreground)" }} />
              <Line type="monotone" dataKey="margin" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} name="Actual margin" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">3-way cost comparison per BoQ line</h2>
          <p className="text-xs text-muted-foreground">Top 10 lines by value</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">BoQ line</th>
                <th className="px-3 py-2.5 text-right">Estimator</th>
                <th className="px-3 py-2.5 text-right">Buyer (PO)</th>
                <th className="px-3 py-2.5 text-right">Actual (invoiced)</th>
                <th className="px-3 py-2.5 text-right">Var £</th>
                <th className="px-3 py-2.5 text-right">Var %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {financialBoq.map((r) => {
                const varAbs = r.actual - r.est;
                const over = varAbs > 0;
                return (
                  <tr key={r.line} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{r.line}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">£{r.est.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">£{r.buyer.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">£{r.actual.toLocaleString()}</td>
                    <td className={cn("px-3 py-3 text-right tabular-nums font-semibold", over ? "text-danger" : "text-success")}>
                      {over ? "+" : "−"}£{Math.abs(varAbs).toLocaleString()}
                    </td>
                    <td className={cn("px-3 py-3 text-right tabular-nums font-semibold", over ? "text-danger" : "text-success")}>
                      {over ? "+" : ""}{r.varPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Monthly P&L</h2>
          <p className="text-xs text-muted-foreground">Revenue · Cost · Margin</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPnl} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="var(--color-accent)" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="var(--color-primary)" name="Cost" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margin" fill="var(--color-success)" name="Margin" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Supplier spend</h2>
          <p className="text-xs text-muted-foreground">Project-to-date breakdown</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={supplierConcentration} dataKey="amount" nameKey="supplier" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {supplierConcentration.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5 text-xs">
              {supplierConcentration.map((s, i) => (
                <li key={s.supplier} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 font-medium">{s.supplier}</span>
                  <span className="tabular-nums text-muted-foreground">£{(s.amount/1000).toFixed(0)}k</span>
                  <span className="w-10 text-right tabular-nums">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" aria-hidden />
          <h2 className="font-semibold">Margin drift alerts</h2>
        </div>
        <ul className="space-y-2.5">
          {marginAlerts.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-l-4 border-l-warning bg-card p-3">
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <button onClick={() => toast.info("Drill-down opened")} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline">
                Investigate <ArrowRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
