import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { team } from "@/lib/mockData";
import { FileText, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { PermissionMatrix } from "@/components/team/PermissionMatrix";
import { useInvites, useMemberRates, getMemberRate, removeInvite } from "@/lib/labour";

export const Route = createFileRoute("/team")({ component: Team });

const tierTone = {
  Admin: "warning" as const,
  "Pro Control": "info" as const,
  Pro: "success" as const,
  "Site User": "neutral" as const,
  Operative: "neutral" as const,
};

function Team() {
  const invites = useInvites();
  const memberRates = useMemberRates();
  void memberRates; // subscribe to refresh
  return (
    <Section
      title="Team & Roles"
      subtitle="Role-based permissions · per-project membership · full audit trail of who did what"
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast("Audit log", { description: "Opening last 30 days · 247 events" })}><FileText className="mr-1.5 h-3.5 w-3.5" /> Audit log</Button>
          <Button variant="outline" size="sm" asChild><Link to="/settings/labour"><Settings2 className="mr-1.5 h-3.5 w-3.5" /> Labour rates</Link></Button>
          <InviteMemberDialog />
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total members" value={`${team.length}`} />
        <Kpi label="Active projects" value="11" />
        <Kpi label="Open invites" value={`${invites.filter((i) => i.status === "pending").length}`} tone={invites.some((i) => i.status === "pending") ? "warning" : "neutral"} />
        <Kpi label="Permission roles" value="5" />
      </div>

      <Card>
        <CardHead title="Members" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Member</th>
                <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rate £/h</th>
                <th className="px-4 py-2.5 text-right font-semibold">Projects</th>
                <th className="px-4 py-2.5 text-left font-semibold">Capability</th>
                <th className="px-4 py-2.5 text-left font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.tier === "Admin" ? "bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-300" : "bg-gradient-to-br from-[var(--navy-800)] to-[var(--accent-500)]"}`}>
                        {m.initials}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-[10.5px] text-[var(--ink-500)]">joined {m.joined}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p>{m.role}</p>
                    <StatusBadge tone={tierTone[m.tier]}>{m.tier}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num">
                    {(() => {
                      const r = getMemberRate(m.id)?.rate;
                      return r && r > 0 ? `£${r.toFixed(2)}` : <span className="text-[var(--ink-300)]">—</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">{m.projects}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[var(--ink-700)]">{m.capability}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[var(--ink-500)]">{m.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHead title="Pending invites" subtitle="Awaiting acceptance" />
          <div className="divide-y divide-[var(--ink-200)]">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--amber-500)]/15 text-[11px] font-bold text-[var(--amber-500)]">
                  {(inv.name ?? inv.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{inv.name ?? inv.email}</p>
                  <p className="text-[11px] text-[var(--ink-500)]">{inv.email} · £{inv.rate.toFixed(2)}/h · {inv.tier}</p>
                </div>
                <StatusBadge tone="warning">Pending</StatusBadge>
                <Button variant="ghost" size="sm" onClick={() => { removeInvite(inv.id); toast("Invite revoked"); }}>Revoke</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <PermissionMatrix />
    </Section>
  );
}
