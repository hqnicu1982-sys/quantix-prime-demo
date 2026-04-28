import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, UserPlus } from "lucide-react";
import { team } from "@/lib/mockData";

export const Route = createFileRoute("/projects/fitzrovia/team")({ component: TeamPage });

const onProject = team.filter((t) => t.status !== "pending").slice(0, 7);

const tierTone = {
  Admin: "bg-purple-500/10 text-purple-600",
  "Pro Control": "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  Pro: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  "Site User": "bg-[var(--ink-50)] text-[var(--ink-500)]",
  Operative: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

function TeamPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="On project" value={`${onProject.length}`} delta="3 office · 4 site" />
        <Kpi label="Operatives on site today" value="22" delta="across 4 crews" />
        <Kpi label="Pending invites" value="1" delta="ben@drywallcrew" tone="warning" />
        <Kpi label="Lead PM" value="Nick A." delta="Site Manager · Pro" />
      </div>

      <Card>
        <CardHead
          title="Project team"
          subtitle="Members assigned to Hotel Fitzrovia"
          right={
            <div className="flex gap-2">
              <Button size="sm"><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite</Button>
              <Button size="sm" variant="outline" asChild><Link to="/team">Full directory <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
            </div>
          }
        />
        <div className="divide-y divide-[var(--ink-200)]">
          {onProject.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--ink-50)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-[12px] font-bold text-white">
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{m.name}</p>
                <p className="text-[11.5px] text-[var(--ink-500)]">{m.role} · last active {m.lastActive}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${tierTone[m.tier]}`}>{m.tier}</span>
              <span className="hidden text-[11px] text-[var(--ink-500)] md:inline">joined {m.joined}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Capability overview" subtitle="Who can do what on this project" />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {onProject.map((m) => (
            <div key={`cap-${m.id}`} className="rounded-md border border-[var(--ink-200)] p-3">
              <p className="text-[12.5px] font-semibold">{m.name} <span className="text-[var(--ink-500)]">— {m.tier}</span></p>
              <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">{m.capability}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
