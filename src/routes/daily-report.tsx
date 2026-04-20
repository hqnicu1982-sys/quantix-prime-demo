import { createFileRoute } from "@tanstack/react-router";
import { Section, Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { dailyReport } from "@/lib/mockData";
import { Download, Send, Cloud, Clock } from "lucide-react";

export const Route = createFileRoute("/daily-report")({
  head: () => ({ meta: [{ title: "Daily Site Report — Quantix Prime" }] }),
  component: DailyReport,
});

function DailyReport() {
  return (
    <Section
      title={`Daily Site Report — ${dailyReport.date}`}
      subtitle="Unified view of site activity · submitted to main contractor at end of day"
      right={
        <>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Preview PDF</Button>
          <Button size="sm"><Send className="mr-1.5 h-3.5 w-3.5" />Submit to Kier</Button>
        </>
      }
    >
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
        <CardHead title="Labour" subtitle={`${dailyReport.labour.length} crews on site`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5">Crew</th>
                <th className="px-3 py-2.5">In</th>
                <th className="px-3 py-2.5">Out</th>
                <th className="px-3 py-2.5 text-right">Hours</th>
                <th className="px-3 py-2.5">Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {dailyReport.labour.map((l, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 font-medium">{l.crew}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums">
                    {l.inTime} {l.late && <StatusBadge tone="warning" className="ml-1">Late</StatusBadge>}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums">{l.outTime}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">{l.hours}h</td>
                  <td className="px-3 py-2.5 text-[var(--ink-700)]">{l.work}</td>
                </tr>
              ))}
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
        <ListCard title="Issues / RAMS / Dayworks" items={dailyReport.issues} tone="warning" />
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
