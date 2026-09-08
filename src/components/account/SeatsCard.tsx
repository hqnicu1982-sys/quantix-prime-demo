import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, type WorkspacePlan } from "@/components/account/PlanCard";
import { cn } from "@/lib/utils";

export type SeatKey = "admin" | "proControl" | "operative" | "projects";

export type SeatLine = {
  key: SeatKey;
  label: string;
  used: number;
  included: number;
  addOn: number;
};

export type WorkspaceSeats = { lines: SeatLine[] };

export type SeatInvoiceRow = {
  date: string;
  desc: string;
  amount: string;
  status: "Paid" | "Due";
};

export const SEATS_PRESET: WorkspaceSeats = {
  lines: [
    { key: "admin", label: "Admin", used: 1, included: 1, addOn: 0 },
    { key: "proControl", label: "Pro Control", used: 1, included: 2, addOn: 0 },
    { key: "operative", label: "Operative", used: 3, included: 5, addOn: 0 },
    { key: "projects", label: "Active projects", used: 2, included: 3, addOn: 0 },
  ],
};

export const SEATS_PRESET_WITH_ADDONS: WorkspaceSeats = {
  lines: SEATS_PRESET.lines.map((l) =>
    l.key === "operative" ? { ...l, addOn: 25 } : l.key === "proControl" ? { ...l, addOn: 1 } : { ...l },
  ),
};

export function cloneSeats(seats: WorkspaceSeats): WorkspaceSeats {
  return { lines: seats.lines.map((l) => ({ ...l })) };
}

// ---------------------------------------------------------------- add-on pricing

const ADDONS: { key: SeatKey; label: string; unit: string; price: number; step: number }[] = [
  { key: "admin", label: "Admin seat", unit: "per seat", price: 49, step: 1 },
  { key: "proControl", label: "Pro Control seat", unit: "per seat", price: 29, step: 1 },
  { key: "operative", label: "Operative seats", unit: "pack of 25", price: 99, step: 25 },
  { key: "projects", label: "Additional project", unit: "per project", price: 25, step: 1 },
];

function daysToRenewal(renewalDate: string | null) {
  if (!renewalDate) return 365;
  const target = new Date(renewalDate);
  if (Number.isNaN(target.getTime())) return 365;
  const diff = Math.round((target.getTime() - Date.now()) / 86_400_000);
  return Math.max(0, Math.min(365, diff));
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------- card

export function SeatsCard({
  workspacePlan,
  seats,
  onSeatsAdded,
}: {
  workspacePlan: WorkspacePlan;
  seats: WorkspaceSeats;
  onSeatsAdded?: (seats: WorkspaceSeats, invoices: SeatInvoiceRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const p = workspacePlan;
  const stripeAdmin = p.billingSource === "STRIPE" && p.isAdmin;

  return (
    <Card>
      <CardHead title="Seats" subtitle="What your workspace includes today" />
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          {seats.lines.map((l) => (
            <SeatRow key={l.key} line={l} />
          ))}
        </div>

        {stripeAdmin ? (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              Add seats
            </Button>
          </div>
        ) : p.billingSource === "STRIPE" ? (
          <div className="flex justify-end">
            <p className="text-[11.5px] text-[var(--ink-500)]">Ask an admin to add seats.</p>
          </div>
        ) : p.plan === "FREE" ? (
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link to="/pricing">Upgrade to add seats</Link>
            </Button>
          </div>
        ) : (
          <p className="text-[11.5px] text-[var(--ink-500)]">
            Plan changes are handled by the FixMargin team and invoiced manually.{" "}
            <a
              className="text-[var(--accent-500)] hover:underline"
              href="mailto:support@fixmargin.com?subject=Seat%20change"
            >
              Contact support
            </a>
          </p>
        )}
      </div>

      {stripeAdmin && (
        <AddSeatsDialog
          open={open}
          onOpenChange={setOpen}
          workspacePlan={p}
          seats={seats}
          onConfirm={onSeatsAdded}
        />
      )}
    </Card>
  );
}

function SeatRow({ line }: { line: SeatLine }) {
  const total = line.included + line.addOn;
  const pct = total > 0 ? Math.min(100, Math.round((line.used / total) * 100)) : 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--ink-700)]">{line.label}</span>
        <span className="font-medium text-[var(--ink-900)]">
          {line.used} of {total}
          {line.addOn > 0 && (
            <span className="ml-1.5 text-[11.5px] font-normal text-[var(--ink-500)]">
              +{line.addOn} add-on
            </span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--ink-100)]">
        <div
          className={cn("h-full rounded-full", pct >= 100 ? "bg-[var(--amber-500)]" : "bg-[var(--accent-500)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- dialog

function AddSeatsDialog({
  open,
  onOpenChange,
  workspacePlan,
  seats,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspacePlan: WorkspacePlan;
  seats: WorkspaceSeats;
  onConfirm?: (seats: WorkspaceSeats, invoices: SeatInvoiceRow[]) => void;
}) {
  const [qty, setQty] = useState<Record<SeatKey, number>>({
    admin: 0,
    proControl: 0,
    operative: 0,
    projects: 0,
  });

  const total = useMemo(
    () => ADDONS.reduce((sum, a) => sum + a.price * qty[a.key], 0),
    [qty],
  );

  const annual = workspacePlan.commitment !== "MONTHLY";
  const days = daysToRenewal(workspacePlan.renewalDate);

  const bump = (key: SeatKey, delta: number) =>
    setQty((q) => ({ ...q, [key]: Math.max(0, Math.min(20, q[key] + delta)) }));

  const reset = () =>
    setQty({ admin: 0, proControl: 0, operative: 0, projects: 0 });

  const confirm = () => {
    const rows: SeatInvoiceRow[] = [];
    const next = cloneSeats(seats);
    for (const a of ADDONS) {
      const n = qty[a.key];
      if (n <= 0) continue;
      const monthly = a.price * n;
      const amount = annual ? Math.round(monthly * 12 * (days / 365) * 100) / 100 : monthly;
      rows.push({
        date: todayLabel(),
        desc: `Additional ${a.label} (pro-rata)`,
        amount: `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: "Due",
      });
      const line = next.lines.find((l) => l.key === a.key);
      if (line) line.addOn += n * a.step;
    }

    onOpenChange(false);
    toast("Redirecting to Stripe Checkout…");
    window.setTimeout(() => {
      onConfirm?.(next, rows);
      reset();
      toast.success("Seats added — your invoice is in Invoices below.");
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add seats</DialogTitle>
          <DialogDescription>
            Extra capacity for your workspace. Prices exclude VAT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {ADDONS.map((a) => (
            <div
              key={a.key}
              className="flex items-center justify-between gap-3 rounded-md border border-[var(--ink-200)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--ink-900)]">{a.label}</p>
                <p className="text-[11.5px] text-[var(--ink-500)]">
                  {a.unit} · £{formatPrice(a.price)}/mo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Stepper value={qty[a.key]} onChange={(d) => bump(a.key, d)} />
                <span className="w-16 text-right text-[12.5px] font-medium text-[var(--ink-900)]">
                  £{formatPrice(a.price * qty[a.key])}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 rounded-md bg-[var(--ink-50)] p-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[var(--ink-900)]">Monthly add-on total</span>
            <span className="font-semibold text-[var(--ink-900)]">£{formatPrice(total)}/mo</span>
          </div>
          <p className="text-[12px] text-[var(--ink-700)]">
            {annual
              ? `Charged today pro-rata to ${workspacePlan.renewalDate ?? "your renewal date"}, then renews with your plan at £${formatPrice(total)}/mo × 12.`
              : "Added to your monthly bill from today."}
          </p>
          <p className="text-[11.5px] text-[var(--ink-500)]">
            Add-ons are billed at your plan's standard monthly rate and are not discounted by your
            commitment or Founding Customer status.
          </p>
        </div>

        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={total === 0} onClick={confirm}>
            Continue to Stripe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-md border border-[var(--ink-200)]">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(-1)}
        disabled={value <= 0}
        className="px-2 py-1 text-[var(--ink-500)] disabled:opacity-40 hover:text-[var(--ink-900)]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-7 text-center text-[12.5px] font-medium text-[var(--ink-900)]">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(1)}
        disabled={value >= 20}
        className="px-2 py-1 text-[var(--ink-500)] disabled:opacity-40 hover:text-[var(--ink-900)]"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
