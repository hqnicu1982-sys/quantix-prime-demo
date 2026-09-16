import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Section, Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useSuppliers, renameSupplier, setSupplierActive, type Supplier } from "@/lib/suppliers";
import { AddSupplierDialog } from "@/components/suppliers/SupplierSelect";

export const Route = createFileRoute("/settings/suppliers")({ component: GuardedSettingsSuppliers });

function GuardedSettingsSuppliers() {
  const allowed = useCan("manage.suppliers");
  if (!allowed) return <NoAccess cap="manage.suppliers" title="Supplier settings restricted" />;
  return <SettingsSuppliers />;
}

function SettingsSuppliers() {
  const suppliers = useSuppliers();
  const [addOpen, setAddOpen] = useState(false);
  const active = suppliers.filter((s) => s.isActive);
  const inactive = suppliers.filter((s) => !s.isActive);

  return (
    <Section
      title="Suppliers"
      subtitle="Your supplier list — used in call-offs and price lists"
      right={
        <Button variant="outline" size="sm" asChild>
          <Link to="/team"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Team</Link>
        </Button>
      }
    >
      <Card>
        <CardHead
          title="Supplier list"
          subtitle={`${active.length} active · ${inactive.length} inactive`}
          right={
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add supplier
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold">Source</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 w-44 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {[...active, ...inactive].map((s) => (
                <SupplierRow key={s.id} supplier={s} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <AddSupplierDialog open={addOpen} onOpenChange={setAddOpen} />
    </Section>
  );
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(supplier.name);

  const save = () => {
    try {
      renameSupplier(supplier.id, name);
      toast.success("Supplier renamed");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    }
  };

  return (
    <tr className={supplier.isActive ? "hover:bg-[var(--ink-50)]" : "bg-[var(--ink-50)]/60 opacity-60"}>
      <td className="px-4 py-2 font-medium">
        {editing ? (
          <Input
            autoFocus
            value={name}
            className="h-8"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setName(supplier.name); setEditing(false); }
            }}
          />
        ) : (
          supplier.name
        )}
      </td>
      <td className="px-4 py-2 text-[var(--ink-500)]">{supplier.isSeed ? "Platform" : "Added by you"}</td>
      <td className="px-4 py-2">
        <StatusBadge tone={supplier.isActive ? "success" : "neutral"} dot>
          {supplier.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      </td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">
          {editing ? (
            <>
              <Button size="sm" variant="outline" onClick={save}><Save className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setName(supplier.name); setEditing(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Rename</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSupplierActive(supplier.id, !supplier.isActive);
                  toast(supplier.isActive ? `${supplier.name} deactivated` : `${supplier.name} activated`);
                }}
              >
                {supplier.isActive ? "Deactivate" : "Activate"}
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
