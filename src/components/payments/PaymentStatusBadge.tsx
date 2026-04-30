import { StatusBadge } from "@/components/StatusBadge";
import type { PaymentApplicationStatus } from "@/lib/paymentCycle";

const TONE: Record<PaymentApplicationStatus, "neutral" | "info" | "warning" | "success" | "danger" | "accent"> = {
  draft: "neutral",
  submitted: "warning",
  noticed: "info",
  certified: "accent",
  paid: "success",
  disputed: "danger",
};

const LABEL: Record<PaymentApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting Notice",
  noticed: "Notice Issued",
  certified: "Certified",
  paid: "Paid",
  disputed: "Disputed",
};

export function PaymentStatusBadge({ status }: { status: PaymentApplicationStatus }) {
  return <StatusBadge tone={TONE[status]} dot>{LABEL[status]}</StatusBadge>;
}