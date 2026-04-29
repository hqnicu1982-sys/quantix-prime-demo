import { Card, CardHead } from "@/components/Primitives";
import { useLabourLogs, computeEntryCost } from "@/lib/laborLog";
import { usePriceWorkRates } from "@/lib/labour";

/**
 * Live labour cost card — derives cost from real logs (PW + Hourly),
 * not from static mock data. Drops into Financial dashboard or Project overview.
 */
export function LiveLabourCostCard({ projectId }: { projectId: string }) {
  const logs = useLabourLogs(projectId);
  const pwRates = usePriceWorkRates(projectId);
  const approved = logs.filter((l) => (l.status ?? "submitted") === "approved");

  const totalCost = approved.reduce((s, l) => s + computeEntryCost(l), 0);
  const hourly = approved.filter((l) => l.payMode !== "pw");
  const pw = approved.filter((l) => l.payMode === "pw");
  const hourlyCost = hourly.reduce((s, l) => s + computeEntryCost(l), 0);
  const pwCost = pw.reduce((s, l) => s + computeEntryCost(l), 0);
  const totalHours = approved.reduce((s, l) => s + l.hours, 0);
  const effRate = totalHours > 0 ? totalCost / totalHours : 0;

  // Pending submitted (not yet approved) — show as "exposure"
  const pending = logs.filter((l) => (l.status ?? "submitted") === "submitted");
  const pendingCost = pending.reduce((s, l) => s + computeEntryCost(l), 0);

  const pwShare = totalCost > 0 ? Math.round((pwCost / totalCost) * 100) : 0;

  return (
    <Card>
      <CardHead
        title="Live labour cost"
        subtitle={`From approved daily reports · ${approved.length} entries · ${pwRates.length} PW rate${pwRates.length === 1 ? "" : "s"} configured`}
      />
      <div className="grid divide-x divide-[var(--ink-200)] sm:grid-cols-4">
        <Stat label="Total approved" value={`£${totalCost.toFixed(0)}`} hint={`${totalHours.toFixed(1)}h logged`} />
        <Stat label="Hourly" value={`£${hourlyCost.toFixed(0)}`} hint={`${hourly.length} entr${hourly.length === 1 ? "y" : "ies"}`} />
        <Stat label="Price Work" value={`£${pwCost.toFixed(0)}`} hint={`${pw.length} claim${pw.length === 1 ? "" : "s"} · ${pwShare}% of total`} accent />
        <Stat label="Effective £/h" value={effRate > 0 ? `£${effRate.toFixed(2)}` : "—"} hint={pendingCost > 0 ? `+£${pendingCost.toFixed(0)} pending` : "blended rate"} />
      </div>
      {pwCost > 0 && (
        <div className="border-t border-[var(--ink-200)] px-5 py-2.5">
          <div className="flex items-center gap-2 text-[11px] text-[var(--ink-500)]">
            <span className="font-semibold uppercase tracking-wider">Pay mix</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--ink-100)]">
              <div className="absolute inset-y-0 left-0 bg-[var(--accent-500)]" style={{ width: `${pwShare}%` }} />
            </div>
            <span className="font-mono-num font-semibold text-[var(--ink-700)]">{pwShare}% PW · {100 - pwShare}% hourly</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className={`mt-1 font-mono-num text-[18px] font-semibold tabular-nums ${accent ? "text-[var(--accent-500)]" : "text-[var(--ink-900)]"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}