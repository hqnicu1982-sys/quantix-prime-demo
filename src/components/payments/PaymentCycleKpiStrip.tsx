import { Link } from "@tanstack/react-router";
import { Card } from "@/components/Primitives";
import { fmtMoney } from "@/lib/mockData";
import { usePaymentTotals } from "@/lib/paymentCycle";
import { ArrowRight, FileSignature } from "lucide-react";

/**
 * Compact KPI strip that surfaces the interim payment cycle status on the
 * project overview. Links into the dedicated Payments tab.
 */
export function PaymentCycleKpiStrip({ projectId }: { projectId: string }) {
  const totals = usePaymentTotals(projectId);

  const dueLabel =
    totals.daysToNextDue == null
      ? "—"
      : totals.daysToNextDue < 0
        ? `${Math.abs(totals.daysToNextDue)}d overdue`
        : totals.daysToNextDue === 0
          ? "today"
          : `in ${totals.daysToNextDue}d`;

  const dueTone =
    totals.daysToNextDue == null
      ? "text-[var(--ink-500)]"
      : totals.daysToNextDue < 0
        ? "text-[var(--red-500)]"
        : totals.daysToNextDue <= 2
          ? "text-[var(--amber-500)]"
          : "text-[var(--green-600)]";

  return (
    <Card>
      <Link
        to="/projects/$projectId/payments"
        params={{ projectId }}
        className="flex items-center justify-between gap-4 border-b border-[var(--ink-200)] px-5 py-2.5 hover:bg-[var(--ink-50)]"
      >
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-[var(--accent-500)]" />
          <p className="text-[12.5px] font-semibold text-[var(--ink-900)]">Interim payment cycle</p>
          <span className="text-[11px] text-[var(--ink-500)]">JCT/NEC · Application → Notice → Certificate → Paid</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-500)]">
          Open Payments <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
      <div className="grid grid-cols-2 divide-x divide-[var(--ink-200)] md:grid-cols-4">
        <Cell label="Applied YTD" value={fmtMoney(totals.appliedYTD, { compact: true })} />
        <Cell label="Certified YTD" value={fmtMoney(totals.certifiedYTD, { compact: true })} />
        <Cell
          label="Outstanding"
          value={fmtMoney(totals.outstanding, { compact: true })}
          tone={totals.outstanding > 0 ? "warn" : "ok"}
        />
        <Cell
          label="Next Notice due"
          value={totals.nextDueDate ?? "—"}
          hint={totals.nextDueDate ? dueLabel : `${totals.pendingApplicationsCount} pending`}
          toneClass={dueTone}
        />
      </div>
    </Card>
  );
}

function Cell({
  label, value, hint, tone, toneClass,
}: {
  label: string; value: string; hint?: string; tone?: "ok" | "warn" | "danger"; toneClass?: string;
}) {
  const cls =
    toneClass ??
    (tone === "danger"
      ? "text-[var(--red-500)]"
      : tone === "warn"
        ? "text-[var(--amber-500)]"
        : tone === "ok"
          ? "text-[var(--green-600)]"
          : "text-[var(--ink-900)]");
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className={`mt-0.5 font-mono-num text-[15px] font-bold ${cls}`}>{value}</div>
      {hint && <div className={`text-[10.5px] ${toneClass ?? "text-[var(--ink-500)]"}`}>{hint}</div>}
    </div>
  );
}