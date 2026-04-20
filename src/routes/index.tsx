import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Users, Truck, ListChecks, TrendingUp, AlertTriangle, ArrowDownRight, ArrowRight, ChevronDown, HardHat, LineChart as LineIcon } from "lucide-react";
import { useState } from "react";
import {
  todayKpis, roadblocks, marginTrend, commercialActions, labourVsBoq,
  supplierConcentration, monthlyMini,
} from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Quantix Prime" },
      { name: "description", content: "Live site and commercial overview for the active UK construction project." },
    ],
  }),
  component: Dashboard,
});

function KpiCard({ icon: Icon, label, value, sub, tone = "default" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <div className={cn("mt-1.5 text-xl font-bold", toneClass)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{sub}</div>}
    </Card>
  );
}

function ProgressBar() {
  const segs = [
    { label: "Programme", pct: 44, color: "bg-accent" },
    { label: "Spend", pct: 41, color: "bg-warning" },
    { label: "Margin", pct: 14.2, target: 18, color: "bg-danger" },
  ];
  return (
    <Card className="p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {segs.map((s) => (
          <div key={s.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <span className="text-sm font-bold tabular-nums">{s.pct}%{s.target && <span className="ml-1 text-xs font-normal text-muted-foreground">/ {s.target}%</span>}</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-secondary">
              <div className={cn("h-2 rounded-full", s.color)} style={{ width: `${Math.min(s.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Dashboard() {
  const { current } = useProject();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  if (!current.hasFullData) return <EmptyProjectState screen="dashboard" />;

  return (
    <div className="space-y-5">
      {/* Project header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{current.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {current.contractValue} contract · {current.mainContractor} · Week {current.weekCurrent} of {current.weekTotal}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>Phase: {current.phase}</Chip>
          <Chip>Start: {current.startDate}</Chip>
          <Chip>Programmed completion: {current.endDate}</Chip>
        </div>
      </div>

      <ProgressBar />

      {/* Two columns */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* SITE MANAGER */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-accent" aria-hidden />
              <h2 className="text-lg font-semibold">Site Manager view</h2>
            </div>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Field
            </span>
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-semibold">Today on site</h3>
              <p className="text-xs text-muted-foreground">{today}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiCard icon={Users} label="Operatives" value={`${todayKpis.operatives}`} sub={`Day cost £${todayKpis.dayCost.toLocaleString()}`} />
              <KpiCard icon={Truck} label="Deliveries" value={`${todayKpis.deliveries.length}`} sub="SIG 10:00 · CCF 14:00 · Knauf 16:00" />
              <KpiCard icon={ListChecks} label="Tasks ready" value={`${todayKpis.tasksReady}/${todayKpis.tasksTotal}`} sub="3 at risk" />
              <KpiCard icon={TrendingUp} label="PPC" value={`${todayKpis.ppc}%`} sub="Percent Plan Complete" tone="success" />
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-l-4 border-warning bg-warning/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" aria-hidden />
              <h3 className="font-semibold">Active roadblocks</h3>
            </div>
            <ul className="divide-y">
              {roadblocks.map((r) => <RoadblockItem key={r.id} r={r} />)}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b p-4">
              <h3 className="font-semibold">This week's labour</h3>
              <p className="text-xs text-muted-foreground">Hours logged vs BoQ allowance</p>
            </div>
            <div className="divide-y text-sm">
              <div className="hidden grid-cols-4 gap-3 bg-secondary/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Task</span><span className="text-right">Hours</span><span className="text-right">Allowance</span><span className="text-right">Variance</span>
              </div>
              {labourVsBoq.slice(0, 3).map((r) => (
                <div key={r.task} className="grid grid-cols-4 items-center gap-3 px-4 py-2.5">
                  <span className="font-medium">{r.task}</span>
                  <span className="text-right tabular-nums">{r.hours}h</span>
                  <span className="text-right tabular-nums text-muted-foreground">{r.allowance}h</span>
                  <span className={cn("text-right font-semibold tabular-nums", r.variance < 0 ? "text-success" : "text-danger")}>
                    {r.variance < 0 ? "−" : "+"}£{Math.abs(r.variance)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-3 bg-secondary/40 px-4 py-2.5 text-xs font-semibold">
                <span>Week total</span>
                <span className="text-right tabular-nums">96h</span>
                <span className="text-right tabular-nums text-muted-foreground">96h</span>
                <span className="text-right tabular-nums text-success">+£24 net</span>
              </div>
            </div>
          </Card>
        </section>

        {/* COMMERCIAL */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineIcon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-semibold">Commercial Manager view</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Office
            </span>
          </div>

          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Project margin</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">14.2%</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                    <ArrowDownRight className="h-3.5 w-3.5" /> 3.8 pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Down from 18.0% tender</p>
              </div>
              <Button size="sm" variant="outline">Investigate <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </div>
            <div className="mt-3 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrend} margin={{ top: 6, right: 4, bottom: 0, left: -28 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="var(--color-muted-foreground)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 10 }} domain={[12, 20]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 11 }} formatter={(v: number) => `${v}%`} />
                  <Line type="monotone" dataKey="target" stroke="var(--color-warning)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="margin" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Action required</h3>
            <ul className="space-y-2">
              {commercialActions.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-l-4 border-l-accent bg-card p-3">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0">{a.action}</Button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-sm font-semibold">This month</h3>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-semibold tabular-nums">£184k</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-semibold tabular-nums">£158k</span></div>
                <div className="flex justify-between border-t pt-1.5"><span className="font-semibold">Margin</span><span className="font-bold text-success tabular-nums">£26k (14.1%)</span></div>
              </div>
              <div className="mt-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyMini} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.15} strokeWidth={1.5} />
                    <Area type="monotone" dataKey="cost" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold">Supplier spend</h3>
              <p className="text-[11px] text-muted-foreground">£204k total · concentration</p>
              <div className="mt-2.5 space-y-1.5">
                {supplierConcentration.map((s) => (
                  <div key={s.supplier}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{s.supplier}</span>
                      <span className="tabular-nums text-muted-foreground">{s.pct}%</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full rounded-full bg-secondary">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">£86k SIG exposure — consider CCF diversification</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">{children}</span>;
}

function RoadblockItem({ r }: { r: typeof roadblocks[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/30">
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.severity === "BLOCKED" ? "bg-danger" : "bg-warning")} />
          <div>
            <p className="text-sm font-medium leading-snug">{r.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{r.when} · owner {r.owner}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={r.severity} />
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="bg-secondary/20 px-4 pb-3 pt-1 text-xs text-muted-foreground">
          <p><strong className="text-foreground">Reason for variance:</strong> {r.reason}</p>
          <p className="mt-1"><strong className="text-foreground">Affected tasks:</strong> {r.affected.join(", ")}</p>
        </div>
      )}
    </li>
  );
}
