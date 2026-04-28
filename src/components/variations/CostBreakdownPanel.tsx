import { Card, CardHead } from "@/components/Primitives";
import type { ProjectVariation } from "@/lib/variations";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const opLabel: Record<string, string> = {
  add_system: "Add system",
  modify_system: "Modify system",
  add_line: "Add line",
  remove_line: "Remove line",
  adjust_qty: "Adjust qty",
};

const statusTint: Record<string, string> = {
  approved: "bg-[var(--green-50)] text-[var(--green-600)] border-[var(--green-200)]",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-[var(--ink-50)] text-[var(--ink-700)] border-[var(--ink-200)]",
  rejected: "bg-red-50 text-[var(--red-500)] border-red-200",
};

export function CostBreakdownPanel({
  variations,
  baseline,
}: {
  variations: ProjectVariation[];
  baseline: number;
}) {
  // Flatten every change line across all non-rejected variations
  const rows = variations
    .filter((v) => v.status !== "rejected")
    .flatMap((v) =>
      v.changes.map((c) => ({
        voId: v.id,
        voTitle: v.title,
        status: v.status,
        op: c.op,
        description: c.description,
        qty: c.qty,
        unit: c.unit,
        rate: c.ratePerUnit,
        lineTotal: c.lineTotal,
      })),
    );

  const additions = rows.filter((r) => r.lineTotal > 0).reduce((s, r) => s + r.lineTotal, 0);
  const credits = rows.filter((r) => r.lineTotal < 0).reduce((s, r) => s + r.lineTotal, 0);
  const approvedNet = variations
    .filter((v) => v.status === "approved")
    .reduce((s, v) => s + (v.approvedValue ?? v.costImpact), 0);
  const pendingNet = variations
    .filter((v) => v.status === "draft" || v.status === "submitted")
    .reduce((s, v) => s + v.costImpact, 0);
  const grossNet = additions + credits;
  const netContract = baseline + approvedNet;
  const upliftPct = baseline > 0 ? (approvedNet / baseline) * 100 : 0;
  const potentialPct = baseline > 0 ? ((approvedNet + pendingNet) / baseline) * 100 : 0;

  return (
    <Card>
      <CardHead
        title="Cost breakdown"
        subtitle={`${rows.length} change line${rows.length === 1 ? "" : "s"} · approved + pending vs £${baseline.toLocaleString("en-GB")} baseline`}
        right={
          <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
            <span className="flex items-center gap-1.5 text-[var(--ink-500)]">
              <span className="h-2 w-2 rounded-full bg-[var(--green-600)]" /> Additions
              <span className="font-semibold text-[var(--ink-900)] tabular-nums">{fmt(additions)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[var(--ink-500)]">
              <span className="h-2 w-2 rounded-full bg-[var(--red-500)]" /> Credits
              <span className="font-semibold text-[var(--ink-900)] tabular-nums">{fmt(credits)}</span>
            </span>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-[12px] text-[var(--ink-500)]">
          No change lines yet. Add lines on a variation to see the breakdown.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-[var(--ink-50)]/50 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="px-4 py-2.5 text-left">VO</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Op</th>
                  <th className="px-4 py-2.5 text-left">Description</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Rate</th>
                  <th className="px-4 py-2.5 text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-200)]">
                {rows.map((r, i) => (
                  <tr key={`${r.voId}-${i}`} className="hover:bg-[var(--ink-50)]/40">
                    <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-[var(--ink-700)]">{r.voId}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", statusTint[r.status])}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11.5px] text-[var(--ink-700)]">{opLabel[r.op] ?? r.op}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-900)]">{r.description}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--ink-700)]">
                      {r.qty != null ? `${r.qty.toLocaleString("en-GB")}${r.unit ? ` ${r.unit}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--ink-700)]">
                      {r.rate != null ? fmt(r.rate) : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right font-semibold tabular-nums",
                        r.lineTotal < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]",
                      )}
                    >
                      {fmt(r.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--ink-200)] bg-[var(--ink-50)]/40 text-[12px]">
                  <td colSpan={6} className="px-4 py-2.5 text-right font-medium text-[var(--ink-700)]">
                    Gross net (all lines)
                  </td>
                  <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", grossNet < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]")}>
                    {fmt(grossNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-[var(--ink-200)] bg-[var(--ink-50)]/30 px-5 py-4 md:grid-cols-4">
            <Stat label="Baseline contract" value={fmt(baseline)} muted />
            <Stat label="Approved net" value={fmt(approvedNet)} tone={approvedNet >= 0 ? "pos" : "neg"} />
            <Stat label="Pending net" value={fmt(pendingNet)} tone="warn" hint="Draft + submitted" />
            <Stat
              label="Net contract (after approved)"
              value={fmt(netContract)}
              tone={approvedNet >= 0 ? "pos" : "neg"}
              hint={`${upliftPct >= 0 ? "+" : ""}${upliftPct.toFixed(2)}% uplift · ${potentialPct >= 0 ? "+" : ""}${potentialPct.toFixed(2)}% if all approved`}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "pos" | "neg" | "warn";
  muted?: boolean;
}) {
  const color = muted
    ? "text-[var(--ink-700)]"
    : tone === "neg"
      ? "text-[var(--red-500)]"
      : tone === "warn"
        ? "text-amber-700"
        : "text-[var(--green-600)]";
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className={cn("mt-1 font-display text-[18px] font-semibold tabular-nums", color)}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}