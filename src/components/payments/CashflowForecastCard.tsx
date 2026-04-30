import { Card, CardHead } from "@/components/Primitives";
import { fmtMoney } from "@/lib/mockData";
import { BUCKETS, useCashflowForecast, type ForecastBucketKey } from "@/lib/cashflowForecast";
import { ArrowDownLeft, ArrowUpRight, FileSignature, FileCheck2, Receipt } from "lucide-react";

const SOURCE_ICON = {
  certificate: FileCheck2,
  application: FileSignature,
  invoice_in: Receipt,
  invoice_out: Receipt,
};

const SOURCE_LABEL = {
  certificate: "Certificate",
  application: "Application",
  invoice_in: "Invoice in",
  invoice_out: "Invoice out",
};

export function CashflowForecastCard({
  projectId,
  counterparty,
  ourRole,
  compact,
}: {
  projectId: string;
  counterparty: string;
  ourRole: "subcontractor" | "main_contractor";
  compact?: boolean;
}) {
  const { entries, totals } = useCashflowForecast(projectId, { counterparty, ourRole });
  const visible = compact ? entries.slice(0, 6) : entries;

  const maxBucket = Math.max(
    1,
    ...BUCKETS.map((b) => Math.max(totals.byBucket[b.key].in, totals.byBucket[b.key].out)),
  );

  return (
    <Card>
      <CardHead
        title="Cashflow forecast"
        subtitle="Projected cash · payment cycle + outstanding invoices · confidence-weighted"
      />

      <div className="grid grid-cols-3 divide-x divide-[var(--ink-200)] border-b border-[var(--ink-200)] text-center">
        <Stat label="Expected in" value={fmtMoney(totals.expectedIn, { compact: true })} hint={`Weighted ${fmtMoney(totals.weightedIn, { compact: true })}`} tone="ok" />
        <Stat label="Expected out" value={fmtMoney(totals.expectedOut, { compact: true })} hint={`Weighted ${fmtMoney(totals.weightedOut, { compact: true })}`} tone="warn" />
        <Stat
          label="Net"
          value={fmtMoney(totals.net, { compact: true })}
          hint={`Weighted ${fmtMoney(totals.weightedNet, { compact: true })}`}
          tone={totals.net >= 0 ? "ok" : "danger"}
        />
      </div>

      {/* Buckets bar */}
      <div className="space-y-1.5 px-4 py-3">
        {BUCKETS.map((b) => {
          const row = totals.byBucket[b.key];
          if (row.in === 0 && row.out === 0) return null;
          return (
            <div key={b.key}>
              <div className="mb-0.5 flex items-center justify-between text-[11px]">
                <span className={`font-medium ${b.key === "overdue" ? "text-[var(--red-500)]" : "text-[var(--ink-700)]"}`}>{b.label}</span>
                <span className="font-mono-num text-[var(--ink-500)]">
                  in {fmtMoney(row.in, { compact: true })} · out {fmtMoney(row.out, { compact: true })} · net{" "}
                  <strong className={row.net >= 0 ? "text-[var(--green-600)]" : "text-[var(--red-500)]"}>
                    {fmtMoney(row.net, { compact: true })}
                  </strong>
                </span>
              </div>
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
                <div className="h-full bg-[var(--green-600)]" style={{ width: `${(row.in / maxBucket) * 50}%` }} />
                <div className="h-full bg-[var(--amber-500)]" style={{ width: `${(row.out / maxBucket) * 50}%` }} />
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="py-4 text-center text-[12px] text-[var(--ink-500)]">No outstanding cashflow items.</p>
        )}
      </div>

      {/* Entry list */}
      {visible.length > 0 && (
        <ul className="divide-y divide-[var(--ink-200)] border-t border-[var(--ink-200)]">
          {visible.map((e) => {
            const Icon = SOURCE_ICON[e.source];
            const overdue = e.daysFromToday < 0;
            const dayLabel = overdue
              ? `${Math.abs(e.daysFromToday)}d overdue`
              : e.daysFromToday === 0
                ? "today"
                : `in ${e.daysFromToday}d`;
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2 text-[12px]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-500)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono-num font-semibold text-[var(--ink-900)]">{e.reference}</span>
                    <span className="truncate text-[var(--ink-500)]">· {e.counterparty}</span>
                  </div>
                  <div className="text-[10.5px] text-[var(--ink-500)]">
                    {SOURCE_LABEL[e.source]} · {e.expectedDate} · <span className={overdue ? "text-[var(--red-500)]" : ""}>{dayLabel}</span> · {(e.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-right">
                  {e.direction === "in" ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-[var(--green-600)]" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[var(--amber-500)]" />
                  )}
                  <div>
                    <div className={`font-mono-num font-semibold ${e.direction === "in" ? "text-[var(--green-600)]" : "text-[var(--amber-500)]"}`}>
                      {e.direction === "in" ? "+" : "−"}{fmtMoney(e.amount, { compact: true })}
                    </div>
                    <div className="text-[10px] text-[var(--ink-500)]">w. {fmtMoney(e.weighted, { compact: true })}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {compact && entries.length > visible.length && (
        <div className="border-t border-[var(--ink-200)] px-4 py-2 text-[11px] text-[var(--ink-500)]">
          +{entries.length - visible.length} more upcoming items
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" | "danger" }) {
  const cls =
    tone === "danger" ? "text-[var(--red-500)]"
    : tone === "warn" ? "text-[var(--amber-500)]"
    : tone === "ok" ? "text-[var(--green-600)]"
    : "text-[var(--ink-900)]";
  return (
    <div className="px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className={`mt-1 font-mono-num text-[16px] font-bold ${cls}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-[var(--ink-500)]">{hint}</div>}
    </div>
  );
}