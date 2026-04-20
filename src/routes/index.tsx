import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Users, Truck, ListChecks, PoundSterling, AlertTriangle, ArrowDownRight, ArrowRight } from "lucide-react";
import { todayKpis, roadblocks, marginTrend, commercialActions } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Quantix Prime" },
      { name: "description", content: "Live site and commercial overview for the active project." },
    ],
  }),
  component: Dashboard,
});

function KpiCard({ icon: Icon, label, value, sub, tone = "default" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function Dashboard() {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Overview</h1>
        <p className="text-sm text-muted-foreground">Hotel Fitzrovia — Main Contractor: Kier Construction</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Site Manager */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Today's Site Status</h2>
              <p className="text-xs text-muted-foreground">{today}</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Site manager
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard icon={Users} label="Labour on site" value="14" sub="Day cost £3,640" />
            <KpiCard icon={Truck} label="Deliveries today" value="3" sub="SIG 10:00 · CCF 14:00 · Knauf 16:00" />
            <KpiCard icon={ListChecks} label="Tasks this week" value={`${todayKpis.tasksReady}/${todayKpis.tasksTotal}`} sub="3 at risk" />
            <KpiCard icon={PoundSterling} label="Site P&L this week" value={`+£${todayKpis.weeklyMargin.toLocaleString()}`} tone="success" sub="Margin vs allowance" />
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <h3 className="font-semibold">Roadblocks</h3>
            </div>
            <ul className="space-y-2.5">
              {roadblocks.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                  <span className="text-sm">{r.title}</span>
                  <StatusBadge status={r.severity} />
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Commercial Manager */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Project Financial Health</h2>
              <p className="text-xs text-muted-foreground">Live margin vs tender</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Commercial manager
            </span>
          </div>

          <Card className="p-5">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold tracking-tight">14.2%</span>
              <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-danger">
                <ArrowDownRight className="h-4 w-4" />
                3.8 pts vs 18% tender
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Project margin — week ending 18/04/2025</p>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrend} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} domain={[12, 20]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="margin" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Action required</h3>
            <ul className="space-y-2.5">
              {commercialActions.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
