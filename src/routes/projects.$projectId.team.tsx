import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { team } from "@/lib/mockData";
import { useProjectCrews, removeAssignment, useInvites } from "@/lib/labour";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { AssignToProjectDialog } from "@/components/team/AssignToProjectDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId/team")({ component: TeamPage });

const tierTone = {
  Admin: "bg-purple-500/10 text-purple-600",
  "Pro Control": "bg-[var(--accent-500)]/10 text-[var(--accent-500)]",
  Pro: "bg-[var(--green-600)]/10 text-[var(--green-600)]",
  "Site User": "bg-[var(--ink-50)] text-[var(--ink-500)]",
  Operative: "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
} as const;

function TeamPage() {
  const { projectId } = Route.useParams();
  const crews = useProjectCrews(projectId);
  const invites = useInvites().filter((i) => i.projectId === projectId && i.status === "pending");
  const onProject = crews.map((c) => c.member).filter(Boolean) as typeof team;
  const opCount = crews.filter((c) => c.member?.tier === "Operative").length;
  const lead = crews.find((c) => c.member?.tier === "Pro" || c.member?.tier === "Pro Control");
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="On project" value={`${onProject.length}`} delta={`${crews.filter((c) => c.crewName).length} crews`} />
        <Kpi label="Operatives" value={`${opCount}`} delta="active assignments" />
        <Kpi label="Pending invites" value={`${invites.length}`} delta={invites[0]?.email ?? "—"} tone={invites.length ? "warning" : "neutral"} />
        <Kpi label="Lead PM" value={lead?.member?.name.split(" ").map((p) => p[0] + ".").slice(0, 2).join(" ") ?? "—"} delta={lead?.projectRole ?? "—"} />
      </div>

      <Card>
        <CardHead
          title="Project team"
          subtitle="Members assigned to this project"
          right={
            <div className="flex gap-2">
              <AssignToProjectDialog projectId={projectId} />
              <InviteMemberDialog defaultProjectId={projectId} />
              <Button size="sm" variant="outline" asChild><Link to="/team">Full directory <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
            </div>
          }
        />
        <div className="divide-y divide-[var(--ink-200)]">
          {crews.map((c) => {
            const m = c.member;
            if (!m) return null;
            return (
            <div key={c.assignment.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--ink-50)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-[12px] font-bold text-white">
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{m.name}</p>
                <p className="text-[11.5px] text-[var(--ink-500)]">{c.projectRole}{c.assignment.crewName ? ` · ${c.assignment.crewName}` : ""} · last active {m.lastActive}</p>
              </div>
              <span className="rounded bg-[var(--ink-50)] px-2 py-0.5 font-mono-num text-[11px] font-semibold text-[var(--ink-700)]">£{c.rate.toFixed(2)}/h</span>
              <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${tierTone[m.tier]}`}>{m.tier}</span>
              <Button variant="ghost" size="sm" onClick={() => { removeAssignment(c.assignment.id); toast("Removed from project"); }}>
                <Trash2 className="h-3.5 w-3.5 text-[var(--ink-500)]" />
              </Button>
            </div>
            );
          })}
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
