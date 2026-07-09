import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useTeamAudit, KIND_LABEL, type TeamAuditKind } from "@/lib/teamAudit";
import { projects } from "@/lib/mockData";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/team/audit")({ component: Guarded });

function Guarded() {
  const allowed = useCan("view.team");
  if (!allowed) return <NoAccess cap="view.team" title="Team audit restricted" />;
  return <TeamAudit />;
}

const KIND_TONE: Record<TeamAuditKind, "success" | "info" | "warning" | "danger" | "neutral" | "accent"> = {
  "invite.sent": "info",
  "invite.revoked": "warning",
  "invite.accepted": "success",
  "assignment.added": "success",
  "assignment.removed": "warning",
  "rate.changed": "accent",
  "role.upserted": "info",
  "role.deleted": "danger",
  "tier.changed": "warning",
};

function fmt(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function projectName(id?: string) {
  if (!id) return "";
  return projects.find((p) => p.id === id)?.name ?? id;
}

function TeamAudit() {
  const entries = useTeamAudit();
  const [kind, setKind] = useState<"all" | TeamAuditKind>("all");
  const [actor, setActor] = useState<string>("all");
  const [q, setQ] = useState("");

  const actors = useMemo(
    () => Array.from(new Set(entries.map((e) => e.actor))).sort(),
    [entries],
  );

  const filtered = useMemo(() => entries.filter((e) => {
    if (kind !== "all" && e.kind !== kind) return false;
    if (actor !== "all" && e.actor !== actor) return false;
    if (q) {
      const hay = `${e.subject ?? ""} ${e.detail ?? ""} ${e.actor}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [entries, kind, actor, q]);

  const last24h = entries.filter((e) => Date.now() - e.ts < 24 * 3600 * 1000).length;
  const invitesOpen = entries.filter((e) => e.kind === "invite.sent").length -
                      entries.filter((e) => e.kind === "invite.accepted").length -
                      entries.filter((e) => e.kind === "invite.revoked").length;

  function exportCsv() {
    const rows = [
      ["When", "Kind", "Actor", "Subject", "Project", "Before", "After", "Detail"],
      ...filtered.map((e) => [
        fmt(e.ts), KIND_LABEL[e.kind], e.actor, e.subject ?? "",
        projectName(e.projectId), e.before ?? "", e.after ?? "", e.detail ?? "",
      ]),
    ];
    const csv = rows.map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Audit log exported", { description: `${filtered.length} events → CSV` });
  }

  return (
    <Section
      title="Team audit log"
      subtitle="Every membership, rate, role and assignment change — traceable to actor and timestamp"
      right={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/team"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Team</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total events" value={`${entries.length}`} />
        <Kpi label="Last 24h" value={`${last24h}`} tone={last24h > 0 ? "info" : "neutral"} />
        <Kpi label="Actors" value={`${actors.length}`} />
        <Kpi label="Open invites (net)" value={`${Math.max(0, invitesOpen)}`} tone={invitesOpen > 0 ? "warning" : "neutral"} />
      </div>

      <Card>
        <div className="flex items-start gap-3 border-b border-[var(--ink-200)] bg-[var(--green-600)]/5 px-5 py-3 text-[12.5px]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-600)]" />
          <p>
            <strong>Governance:</strong> role and rate changes are recorded automatically the moment
            they happen — from the Invite Member dialog, Assign to Project dialog, Labour rates page,
            and Permission Matrix. Actor is derived from the currently signed-in user.
          </p>
        </div>

        <CardHead title="Timeline" subtitle={`${filtered.length} of ${entries.length} events`} />

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink-200)] bg-[var(--ink-50)]/50 px-5 py-3">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]"
          >
            <option value="all">All actions</option>
            {(Object.keys(KIND_LABEL) as TeamAuditKind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]"
          >
            <option value="all">All actors</option>
            {actors.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject or detail…"
            className="h-8 flex-1 min-w-48 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]"
          />
          {(kind !== "all" || actor !== "all" || q) && (
            <Button variant="ghost" size="sm" onClick={() => { setKind("all"); setActor("all"); setQ(""); }}>Clear</Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">When</th>
                <th className="px-4 py-2.5 text-left font-semibold">Action</th>
                <th className="px-4 py-2.5 text-left font-semibold">Actor</th>
                <th className="px-4 py-2.5 text-left font-semibold">Subject</th>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-500)]">No events match your filters.</td></tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-2.5 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)] whitespace-nowrap">{fmt(e.ts)}</td>
                  <td className="px-4 py-2.5"><StatusBadge tone={KIND_TONE[e.kind]} dot>{KIND_LABEL[e.kind]}</StatusBadge></td>
                  <td className="px-4 py-2.5 font-medium">{e.actor}</td>
                  <td className="px-4 py-2.5">{e.subject ?? <span className="text-[var(--ink-300)]">—</span>}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-700)]">{projectName(e.projectId) || <span className="text-[var(--ink-300)]">—</span>}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-700)]">
                    {e.detail}
                    {(e.before || e.after) && (
                      <span className="ml-2 font-mono-num text-[11px] text-[var(--ink-500)]">
                        {e.before && <span>{e.before}</span>}
                        {e.before && e.after && <span> → </span>}
                        {e.after && <span className="font-semibold text-[var(--ink-900)]">{e.after}</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}