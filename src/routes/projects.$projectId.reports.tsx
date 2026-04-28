import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { FileText, Download, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/projects/$projectId/reports")({ component: ReportsPage });

const reports = [
  { id: "DR-118", title: "Daily site report — 20 Apr", who: "Nick Andrei", when: "today 17:42", type: "Daily", crew: 22, hrs: 176 },
  { id: "DR-117", title: "Daily site report — 19 Apr", who: "Paweł Wilkowski", when: "yesterday 17:35", type: "Daily", crew: 18, hrs: 144 },
  { id: "WR-22", title: "Weekly progress — Week 16", who: "Nick Andrei", when: "Sun 18 Apr", type: "Weekly", crew: 24, hrs: 920 },
  { id: "QA-09", title: "Quality audit — L4 partitions", who: "Sarah Mitchell", when: "Fri 16 Apr", type: "QA", crew: 0, hrs: 0 },
  { id: "VR-04", title: "Variation request — L5 acoustic upgrade", who: "Rachel Okonkwo", when: "Wed 14 Apr", type: "Variation", crew: 0, hrs: 0 },
];

const tone = {
  Daily: "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  Weekly: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  QA: "bg-purple-500/10 text-purple-600",
  Variation: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

function ReportsPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Reports MTD" value="22" delta="18 daily · 4 weekly" />
        <Kpi label="On-time submission" value="96%" delta="1 late this month" tone="success" />
        <Kpi label="Open variations" value="2" delta="£18.6k value" tone="warning" />
        <Kpi label="QA snag rate" value="1.8%" delta="below 3% target" tone="success" />
      </div>

      <Card>
        <CardHead
          title="Project reports"
          subtitle="Daily, weekly, QA & variations"
          right={<Button size="sm"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> New report</Button>}
        />
        <div className="divide-y divide-[var(--ink-200)]">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--ink-50)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ink-50)]">
                <FileText className="h-4 w-4 text-[var(--ink-500)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{r.title}</p>
                <p className="text-[11px] text-[var(--ink-500)]">{r.who} · {r.when} · {r.id}</p>
              </div>
              <div className="hidden text-right md:block">
                {r.crew > 0 && <p className="text-[11px] text-[var(--ink-500)]">{r.crew} ops · {r.hrs}h</p>}
              </div>
              <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${tone[r.type as keyof typeof tone]}`}>{r.type}</span>
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
