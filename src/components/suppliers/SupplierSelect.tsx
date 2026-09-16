import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCan } from "@/lib/permissions";
import {
  addSupplier, findSupplierByName, setSupplierActive, useSuppliers,
} from "@/lib/suppliers";
import { cn } from "@/lib/utils";

const ADD_VALUE = "__add_supplier__";

export function AddSupplierDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded?: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const existing = findSupplierByName(name);
    if (existing && existing.isActive) {
      toast("Already in your list — selected");
      onAdded?.(existing.name);
    } else if (existing && !existing.isActive) {
      setSupplierActive(existing.id, true);
      toast.success(`Reactivated ${existing.name}`);
      onAdded?.(existing.name);
    } else {
      const row = addSupplier(name);
      toast.success(`${row.name} added`);
      onAdded?.(row.name);
    }
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setName(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add supplier</DialogTitle>
          <DialogDescription>Adds to your supplier list — used in call-offs and price lists.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Supplier name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="e.g. Macai Supplies"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid} onClick={submit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SupplierSelect({
  value,
  onChange,
  placeholder = "Select supplier",
  disabled,
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const suppliers = useSuppliers();
  const canManage = useCan("manage.suppliers");
  const [dialogOpen, setDialogOpen] = useState(false);

  const active = suppliers.filter((s) => s.isActive);
  const inActiveList = active.some((s) => s.name === value);
  const orphan = !!value && !inActiveList;

  return (
    <>
      <select
        className={cn(
          "h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]",
          className,
        )}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === ADD_VALUE) { setDialogOpen(true); return; }
          onChange(v);
        }}
      >
        {!value && <option value="">{placeholder}</option>}
        {orphan && <option value={value}>{value} (inactive)</option>}
        {active.map((s) => (
          <option key={s.id} value={s.name}>{s.name}</option>
        ))}
        {canManage && (
          <>
            <option disabled>──────────</option>
            <option value={ADD_VALUE}>+ Add supplier…</option>
          </>
        )}
      </select>
      <AddSupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdded={onChange} />
    </>
  );
}
