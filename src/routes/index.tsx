import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  briefing, dashboardKpis, focusToday, marginTrend, weather,
  onSiteToday, deliveriesToday,
} from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Cloud, Download, FilePlus, ArrowRight, Clock, CheckCircle2, Truck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/currentUser";
import { useCan } from "@/lib/permissions";
import { MyScopeCard } from "@/components/dashboard/MyScopeCard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Quantix Prime" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [range, setRange] = useState<"30d" | "8w" | "life">("8w");
  const me = useCurrentUser();
  const canSeeFinancials = useCan("view.financials") || useCan("view.financials.lite");
  const isOperative = me.tier === "Operative" || me.tier === "Site User";

  // Operative / Site User get a focused dashboard: their scope + nothing else.
  if (isOperative) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
            Hello {me.name.split(" ")[0]}
          </p>
          <h1 className="font-display mt-2 text-[32px] font-semibold leading-tight tracking-tight text-[var(--ink-900)]">
            Here's what's on your plate today.
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--ink-700)]">
            Your active tasks, available Price Work rates, and today's logged hours — all in one place.
          </p>
        </div>
        <MyScopeCard projectId="fitzrovia" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
            Morning briefing · {briefing.date}
          </p>
          <h1 className="font-display mt-2 text-[32px] font-semibold leading-tight tracking-tight text-[var(--ink-900)]">
            {briefing.greeting}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--ink-700)]">
            Hotel Fitzrovia is <strong className="text-[var(--green-600)]">3 days ahead</strong> on the upper floors but{" "}
            <strong className="text-[var(--red-500)]">£14.2k over</strong> on labour. Three things need your eyes today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Brief exported", { description: "Morning briefing PDF saved to /downloads" })}><Download className="mr-1.5 h-3.5 w-3.5" />Export brief</Button>
          <Button size="sm" onClick={() => toast.success("Site update logged", { description: "Posted to Hotel Fitzrovia activity feed" })}><FilePlus className="mr-1.5 h-3.5 w-3.5" />Log site update</Button>
        </div>
      </div>

      {canSeeFinancials && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {dashboardKpis.map((k) => (
            <Kpi key={k.label} label={k.label} value={k.value} delta={k.delta} tone={k.tone} trend={k.trend} />
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHead
              title="Focus today"
              subtitle="3 actions prioritised by margin impact"
              right={<Link to="/" className="text-[12px] font-medium text-[var(--accent-500)] hover:underline">View all 11 →</Link>}
            />
            <div className="divide-y divide-[var(--ink-200)]">
              {focusToday.map((a) => <FocusRow key={a.id} action={a} />)}
            </div>
          </Card>

          {useCan("view.financials") && (
          <Card>
            <CardHead
              title="Margin trend"
              subtitle="Actual vs budgeted (8 weeks)"
              right={
                <div className="flex gap-1 rounded-md bg-[var(--ink-50)] p-0.5">
                  {(["30d", "8w", "life"] as const).map((r) => (
                    <button key={r} onClick={() => setRange(r)} className={cn(
                      "rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                      range === r ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)]",
                    )}>{r}</button>
                  ))}
                </div>
              }
            />
            <div className="h-[280px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-200)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--ink-500)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-500)" }} domain={[18, 30]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="budgeted" stroke="var(--ink-500)" strokeDasharray="4 4" strokeWidth={1.5} name="Budgeted" dot={false} />
                  <Line type="monotone" dataKey="actual" stroke="var(--accent-500)" strokeWidth={2.5} name="Actual" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD]">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0C4A6E]">{weather.location}</p>
                  <p className="font-display mt-2 text-[36px] font-semibold leading-none text-[#0C4A6E]">{weather.temperature}</p>
                  <p className="mt-1 text-[12px] text-[#075985]">{weather.conditions}</p>
                </div>
                <Cloud className="h-10 w-10 text-[#0369A1]" />
              </div>
              <div className="mt-4 rounded-md border border-[var(--amber-500)]/30 bg-white/60 p-2.5 text-[12px]">
                <StatusBadge tone="warning" dot>Rain risk</StatusBadge>
                <p className="mt-1.5 text-[#0C4A6E]">{weather.alert}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="On site today" subtitle="3 crews · checked in" />
            <div className="divide-y divide-[var(--ink-200)]">
              {onSiteToday.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{c.name}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{c.count} {c.role} · {c.level} · in {c.time}</p>
                  </div>
                  <StatusBadge tone={c.status === "late" ? "warning" : "success"}>{c.status === "late" ? "Late" : "On time"}</StatusBadge>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--ink-200)] bg-[var(--ink-50)] px-5 py-2.5 text-[11px] text-[var(--ink-500)]">
              Total hours today: <strong className="text-[var(--ink-900)]">96h planned · 48h logged</strong>
            </div>
          </Card>

          <Card>
            <CardHead title="Deliveries today" subtitle="2 inbound" />
            <div className="divide-y divide-[var(--ink-200)]">
              {deliveriesToday.map((d) => (
                <div key={d.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-md",
                    d.status === "done" ? "bg-[var(--green-600)]/10 text-[var(--green-600)]" : "bg-[var(--accent-500)]/10 text-[var(--accent-500)]")}>
                    {d.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{d.supplier} · {d.item}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-500)]"><Clock className="mr-1 inline h-3 w-3" />{d.eta} · {d.level}</p>
                  </div>
                  <StatusBadge tone={d.status === "done" ? "success" : "info"} dot>{d.status === "done" ? "Done" : "Inbound"}</StatusBadge>
                </div>
              ))}
            </div>
            <Link to="/" className="block border-t border-[var(--ink-200)] px-5 py-2.5 text-[12px] font-medium text-[var(--accent-500)] hover:underline">
              Next 7 days (12 deliveries) →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FocusRow({ action }: { action: typeof focusToday[number] }) {
  const borderColor = action.tone === "danger" ? "border-l-[var(--red-500)]"
    : action.tone === "warning" ? "border-l-[var(--amber-500)]"
    : "border-l-[var(--accent-500)]";
  return (
    <div className={cn("border-l-4 px-5 py-4", borderColor)}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={action.tone}>{action.badge}</StatusBadge>
        <span className="text-[11px] font-medium text-[var(--ink-500)]">{action.impact}</span>
      </div>
      <h4 className="mt-2 text-[14px] font-semibold text-[var(--ink-900)]">{action.title}</h4>
      <p className="mt-1 text-[13px] text-[var(--ink-700)]">{action.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={action.primary.to}
          params={"projectId" in action.primary ? { projectId: (action.primary as { projectId: string }).projectId } : undefined}
        >
          <Button size="sm">{action.primary.label}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
        </Link>
        {action.secondary && <Button size="sm" variant="outline" onClick={() => toast(action.secondary!.label, { description: "Action queued" })}>{action.secondary.label}</Button>}
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--navy-800)] to-[var(--accent-500)] text-[11px] font-bold text-white">
      {initials}
    </div>
  );
}
