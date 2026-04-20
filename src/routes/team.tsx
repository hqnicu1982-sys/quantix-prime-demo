import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { team } from "@/lib/mockData";
import { Plus, FileText } from "lucide-react";

export const Route = createFileRoute("/team")({ component: Team });

const tierTone = {
  Admin: "warning" as const,
  "Pro Control": "info" as const,
  Pro: "success" as const,
  "Site User": "neutral" as const,
  Operative: "neutral" as const,
};

function Team() {
  return (
    <Section
      title="Team & Roles"
      subtitle="Role-based permissions · per-project membership · full audit trail of who did what"
      right={
        <>
          <Button variant="outline" size="sm"><FileText className="mr-1.5 h-3.5 w-3.5" /> Audit log</Button>
          <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> Invite member</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total members" value={`${team.length}`} />
        <Kpi label="Active projects" value="11" />
        <Kpi label="Open invites" value="2" tone="warning" />
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
                  <td className="px-4 py-3 text-right font-mono-num font-semibold">{m.projects}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[var(--ink-700)]">{m.capability}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[var(--ink-500)]">{m.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Permission matrix" subtitle="Role × capability" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                {["View projects", "Edit BoQ", "Upload prices", "Approve call-offs", "Sign invoices", "Manage users", "Billing"].map((c) => (
                  <th key={c} className="px-3 py-2.5 text-center font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {[
                ["Admin", true, true, true, true, true, true, true],
                ["Pro Control", true, true, true, true, true, false, false],
                ["Pro", true, true, true, false, false, false, false],
                ["Site User", true, false, false, false, false, false, false],
                ["Operative", true, false, false, false, false, false, false],
              ].map((row) => (
                <tr key={row[0] as string}>
                  <td className="px-4 py-2.5 font-semibold">{row[0]}</td>
                  {row.slice(1).map((v, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">
                      {v ? <span className="text-[var(--green-600)]">✓</span> : <span className="text-[var(--ink-200)]">✗</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}
