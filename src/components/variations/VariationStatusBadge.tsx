import { cn } from "@/lib/utils";
import type { VariationStatus } from "@/lib/variations";

const styles: Record<VariationStatus, string> = {
  draft: "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  submitted: "bg-[var(--amber-500)]/10 text-[var(--amber-500)] border-[var(--amber-500)]/30",
  approved: "bg-[var(--green-600)]/10 text-[var(--green-600)] border-[var(--green-600)]/30",
  rejected: "bg-[var(--red-500)]/10 text-[var(--red-500)] border-[var(--red-500)]/30",
};

const labels: Record<VariationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export function VariationStatusBadge({ status }: { status: VariationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}