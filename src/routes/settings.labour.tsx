import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Section, Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useRoles, upsertRole, deleteRole, useMemberRates, setMemberRate, getRoles } from "@/lib/labour";
import { team } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/labour")({ component: SettingsLabour });

function SettingsLabour() {
  const roles = useRoles();
  const memberRates = useMemberRates();
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState<number>(20);

  const avg = roles.length ? roles.reduce((s, r) => s + r.defaultRate, 0) / roles.length : 0;

  return (
    <Section
      title="Labour rates"
      subtitle="Global role rates · per-person overrides · used by Planner cost calculations"
      right={
        <Button variant="outline" size="sm" asChild>
          <Link to="/team"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Team</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Roles defined" value={`${roles.length}`} />
        <Kpi label="Average role rate" value={`£${avg.toFixed(2)}`} delta="weighted not blended" />
        <Kpi label="People with custom rate" value={`${memberRates.filter((m) => m.rate > 0).length}`} delta={`of ${team.length} members`} />
      </div>

      <Card>
        <CardHead title="Global role rates" subtitle="These default rates apply when inviting new members or when no per-person rate is set." />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                <th className="px-4 py-2.5 text-right font-semibold">Default rate £/h</th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {roles.map((r) => (
                <RoleRow key={r.id} id={r.id} name={r.name} rate={r.defaultRate} />
              ))}
              <tr className="bg-[var(--ink-50)]/40">
                <td className="px-4 py-2"><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New role name" className="h-8" /></td>
                <td className="px-4 py-2 text-right"><Input type="number" step="0.5" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} className="h-8 text-right" /></td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    if (!newName.trim()) return;
                    upsertRole({ name: newName.trim(), defaultRate: newRate });
                    toast.success("Role added");
                    setNewName(""); setNewRate(20);
                  }}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Per-person rates" subtitle="Overrides the global role rate. Used as default when assigning to a project." />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Member</th>
                <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rate £/h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {team.filter((m) => m.status !== "pending").map((m) => {
                const mr = memberRates.find((x) => x.memberId === m.id);
                return <PersonRateRow key={m.id} memberId={m.id} name={m.name} memberRole={m.role} rate={mr?.rate ?? 0} roleId={mr?.roleId} />;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}

function RoleRow({ id, name, rate }: { id: string; name: string; rate: number }) {
  const [n, setN] = useState(name);
  const [r, setR] = useState(rate);
  const dirty = n !== name || r !== rate;
  return (
    <tr>
      <td className="px-4 py-2"><Input value={n} onChange={(e) => setN(e.target.value)} className="h-8" /></td>
      <td className="px-4 py-2 text-right"><Input type="number" step="0.5" value={r} onChange={(e) => setR(Number(e.target.value))} className="h-8 text-right" /></td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">
          {dirty && (
            <Button size="sm" variant="outline" onClick={() => { upsertRole({ id, name: n, defaultRate: r }); toast.success("Saved"); }}>
              <Save className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { deleteRole(id); toast("Role deleted"); }}>
            <Trash2 className="h-3.5 w-3.5 text-[var(--red-500)]" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function PersonRateRow({ memberId, name, memberRole, rate, roleId }: { memberId: string; name: string; memberRole: string; rate: number; roleId?: string }) {
  const [r, setR] = useState(rate);
  const dirty = r !== rate;
  return (
    <tr className="hover:bg-[var(--ink-50)]">
      <td className="px-4 py-2 font-medium">{name}</td>
      <td className="px-4 py-2 text-[var(--ink-500)]">{memberRole}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Input type="number" step="0.5" value={r} onChange={(e) => setR(Number(e.target.value))} className="h-8 w-28 text-right" />
          {dirty && (
            <Button size="sm" variant="outline" onClick={() => {
              setMemberRate({ memberId, rate: r, roleId: roleId ?? getRoles()[0]?.id });
              toast.success("Rate saved");
            }}>
              <Save className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
