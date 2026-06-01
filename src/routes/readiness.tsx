import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { readinessRows } from "@/lib/mockData";
import { AlertCircle, Plus, CalendarRange } from "lucide-react";
import { ProjectBanner } from "@/components/ProjectBanner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/readiness")({ component: Readiness });

function Readiness() {
  const ready = readinessRows.filter((r) => r.status === "READY").length;
  const atRisk = readinessRows.filter((r) => r.status === "AT_RISK").length;
  return (
    <Section
      title="Material Readiness"
      subtitle={`2-3 week look-ahead · ${readinessRows.length} upcoming tasks · ${ready} green · ${atRisk} needs attention`}
    >
      <ProjectBanner scope="Material Readiness" />
      <div className="flex justify-center">
        <Card className="flex items-center gap-6 p-6">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-200)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green-600)" strokeWidth="2.5" strokeDasharray="94, 100" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-[24px] font-bold">94%</p>
              <p className="text-[10px] text-[var(--ink-500)]">Ready</p>
            </div>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--green-600)]" /> {ready} Ready</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--amber-500)]" /> {atRisk} At risk</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--red-500)]" /> 0 Blocked</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {readinessRows.map((r) => {
          const tone = r.status === "READY" ? "success" : r.status === "AT_RISK" ? "warning" : "danger";
          return (
            <Card key={r.id} className={`border-l-4 ${r.status === "READY" ? "border-l-[var(--green-600)]" : r.status === "AT_RISK" ? "border-l-[var(--amber-500)]" : "border-l-[var(--red-500)]"}`}>
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-semibold">{r.task}</h4>
                    <StatusBadge tone={tone} dot>{r.status === "READY" ? "Ready" : r.status === "AT_RISK" ? "At risk" : "Blocked"}</StatusBadge>
                  </div>
                  <p className="text-[12px] text-[var(--ink-500)]">Starts {r.start} · {r.crew}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.required.map((m, i) => (
                      <span key={i} className="rounded bg-[var(--ink-50)] px-2 py-1 text-[11.5px]">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1 text-[var(--ink-500)]">{m.qty}</span>
                      </span>
                    ))}
                  </div>
                  <p className={`mt-3 flex items-start gap-2 text-[12px] ${r.status === "AT_RISK" ? "text-[var(--amber-500)]" : "text-[var(--ink-500)]"}`}>
                    {r.status === "AT_RISK" && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>{r.note}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                  {r.action && (
                    <Button size="sm" asChild>
                      <Link to="/calloffs/new">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> {r.action}
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/planner" search={{ task: r.task } as never}>
                      <CalendarRange className="mr-1.5 h-3.5 w-3.5" /> View in planner
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
