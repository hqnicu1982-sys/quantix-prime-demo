import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Trash2, Plus } from "lucide-react";
import { team } from "@/lib/mockData";
import {
  useProjectCrews, removeAssignment, useInvites,
  usePriceWorkRates, addPriceWorkRate, removePriceWorkRate,
  type PriceWorkUnit,
} from "@/lib/labour";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { AssignToProjectDialog } from "@/components/team/AssignToProjectDialog";
import { PermissionMatrix } from "@/components/team/PermissionMatrix";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/projects/$projectId/team")({ component: GuardedTeamPage });

function GuardedTeamPage() {
  const allowed = useCan("view.team");
  if (!allowed) return <NoAccess cap="view.team" title="Team restricted" />;
  return <TeamPage />;
}

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
  const canEditTeam = useCan("edit.team");
  const canEditPw = useCan("edit.pwRates");
  const onProject = crews.map((c) => c.member).filter(Boolean) as typeof team;
  const opCount = crews.filter((c) => c.member?.tier === "Operative").length;
  const lead = crews.find((c) => c.member?.tier === "Pro" || c.member?.tier === "Pro Control");
  const counts = onProject.reduce((acc, m) => {
    acc[m.tier] = (acc[m.tier] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<typeof team[number]["tier"], number>>);
  invites.forEach((i) => { counts[i.tier] = (counts[i.tier] ?? 0) + 1; });
  const tiersOnProject = Object.keys(counts) as Array<typeof team[number]["tier"]>;
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
              {canEditTeam && <AssignToProjectDialog projectId={projectId} />}
              {canEditTeam && <InviteMemberDialog defaultProjectId={projectId} />}
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
              {canEditTeam && (
                <Button variant="ghost" size="sm" onClick={() => { removeAssignment(c.assignment.id); toast("Removed from project"); }}>
                  <Trash2 className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                </Button>
              )}
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

      <PriceWorkRatesCard projectId={projectId} />

      <PermissionMatrix
        subtitle="Cine ce poate face pe acest proiect — rândurile evidențiate sunt prezente în echipă"
        highlightTiers={tiersOnProject}
        counts={counts}
      />
    </div>
  );
}

function PriceWorkRatesCard({ projectId }: { projectId: string }) {
  const rates = usePriceWorkRates(projectId);
  const canEditPw = useCan("edit.pwRates");
  const [code, setCode] = useState("");
  const [scope, setScope] = useState("");
  const [unit, setUnit] = useState<PriceWorkUnit>("m2");
  const [rate, setRate] = useState<number>(0);
  const [boqLineId, setBoqLineId] = useState("");

  const linked = rates.filter((r) => r.boqLineId).length;

  const onAdd = () => {
    if (!code.trim() || !scope.trim() || rate <= 0) {
      toast.error("Fill code, scope and rate");
      return;
    }
    addPriceWorkRate({
      projectId,
      code: code.trim().toUpperCase(),
      scope: scope.trim(),
      unit,
      rate,
      boqLineId: boqLineId.trim() || undefined,
    });
    toast.success("PW rate added");
    setCode(""); setScope(""); setRate(0); setBoqLineId(""); setUnit("m2");
  };

  return (
    <Card>
      <CardHead
        title="Price Work rates"
        subtitle={`${rates.length} defined · ${linked} linked to BoQ${canEditPw ? "" : " · read-only for your role"}`}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Code</th>
              <th className="px-4 py-2.5 text-left font-semibold">Scope</th>
              <th className="px-4 py-2.5 text-left font-semibold">Unit</th>
              <th className="px-4 py-2.5 text-right font-semibold">Rate £</th>
              <th className="px-4 py-2.5 text-left font-semibold">BoQ link</th>
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-200)]">
            {rates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">
                  No PW rates yet. Add one below to enable Price Work logging.
                </td>
              </tr>
            )}
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--ink-50)]">
                <td className="px-4 py-2.5 font-mono-num text-[12px] font-semibold">{r.code}</td>
                <td className="px-4 py-2.5">{r.scope}</td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--ink-500)]">{r.unit}</td>
                <td className="px-4 py-2.5 text-right font-mono-num font-semibold">
                  £{r.rate.toFixed(2)}{r.unit === "lump" ? "" : `/${r.unit}`}
                </td>
                <td className="px-4 py-2.5 text-[12px] font-mono-num text-[var(--ink-500)]">
                  {r.boqLineId ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canEditPw && (
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { removePriceWorkRate(projectId, r.id); toast("PW rate removed"); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {canEditPw && <tr className="bg-[var(--ink-50)]/40">
              <td className="px-4 py-2"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PW-CODE" className="h-8 font-mono-num" /></td>
              <td className="px-4 py-2"><Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Scope description" className="h-8" /></td>
              <td className="px-4 py-2">
                <Select value={unit} onValueChange={(v) => setUnit(v as PriceWorkUnit)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m2">m²</SelectItem>
                    <SelectItem value="lm">lm</SelectItem>
                    <SelectItem value="nr">nr</SelectItem>
                    <SelectItem value="lump">lump</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-2 text-right"><Input type="number" step="0.25" min={0} value={rate || ""} onChange={(e) => setRate(Number(e.target.value))} placeholder="0.00" className="h-8 text-right font-mono-num" /></td>
              <td className="px-4 py-2"><Input value={boqLineId} onChange={(e) => setBoqLineId(e.target.value)} placeholder="BOQ-… (optional)" className="h-8 font-mono-num text-[12px]" /></td>
              <td className="px-4 py-2 text-right">
                <Button size="sm" variant="outline" onClick={onAdd}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
