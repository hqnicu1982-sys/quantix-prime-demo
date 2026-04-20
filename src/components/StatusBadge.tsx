import type { Status } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const styles: Record<Status, string> = {
  READY: "bg-success/10 text-success border-success/20",
  AT_RISK: "bg-warning/15 text-warning-foreground border-warning/30",
  BLOCKED: "bg-danger/10 text-danger border-danger/20",
  OVERDUE: "bg-danger/10 text-danger border-danger/20",
};

const labels: Record<Status, string> = {
  READY: "Ready",
  AT_RISK: "At risk",
  BLOCKED: "Blocked",
  OVERDUE: "Overdue",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
