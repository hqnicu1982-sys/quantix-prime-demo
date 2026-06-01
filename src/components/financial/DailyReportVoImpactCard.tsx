import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { useProjectVariations, type ProjectVariation, type VariationChange } from "@/lib/variations";
import { fmtMoney } from "@/lib/mockData";
import { ArrowUpRight, FileWarning, HardHat, Package } from "lucide-react";

const LABOUR_UNITS = new Set(["h", "hr", "hrs", "hour", "hours", "day", "days", "shift", "shifts"]);

function isLabour(c: VariationChange): boolean {
  const u = (c.unit ?? "").toLowerCase().trim();
  if (LABOUR_UNITS.has(u)) return true;
  const d = c.description.toLowerCase();
  return d.includes("dayworks") || d.includes("labour") || d.includes("overtime");
}

function isFromDailyReport(v: ProjectVariation): boolean {
  // Primary: explicit source field. Fallback (for older rows): regex on reason.
  if (v.source === "daily-report") return true;
  if (v.source && v.source !== "daily-report") return false;
  return /raised from daily (site )?report/i.test(v.reason);
}

export function DailyReportVoImpactCard({ projectId }: { projectId: string }) {
  const all = useProjectVariations(projectId);
  const fromDr = useMemo(
    () => all.filter(isFromDailyReport).sort((a, b) => b.createdAt - a.createdAt),
    [all],
  );

  if (fromDr.length === 0) return null;

  // Cost bucketed by VO status (mirrors variations.summarize()): approved is
  // confirmed cost; draft+submitted is pending risk; rejected is informational.
  let approvedCost = 0;
  let pendingCost = 0;
  let rejectedCost = 0;
  let labourCost = 0;
  let materialsCost = 0;
  let totalDays = 0;
  let pendingDays = 0;
  for (const v of fromDr) {
    totalDays += v.timeImpactDays;
    if (v.status === "approved") approvedCost += v.approvedValue ?? v.costImpact;
    else if (v.status === "rejected") rejectedCost += v.costImpact;
    else {
      pendingCost += v.costImpact;
      pendingDays += v.timeImpactDays;
    }
    for (const c of v.changes) {
      if (isLabour(c)) labourCost += c.lineTotal;
      else materialsCost += c.lineTotal;
    }
  }
  const breakdownTotal = labourCost + materialsCost;
  const labourPct = breakdownTotal !== 0 ? Math.round((labourCost / breakdownTotal) * 100) : 0;
  const materialsPct = breakdownTotal !== 0 ? 100 - labourPct : 0;

  const draftCount = fromDr.filter((v) => v.status === "draft").length;
  const submittedCount = fromDr.filter((v) => v.status === "submitted").length;
  const approvedCount = fromDr.filter((v) => v.status === "approved").length;

  return (
    <Card>
      <CardHead
        title="Variations from Daily Reports"
        subtitle={`${fromDr.length} VO${fromDr.length === 1 ? "" : "s"} raised on site · auto-fed from Issues/Dayworks`}
        right={
          <Link
            to="/variations"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--accent-500)] hover:underline"
          >
            Open Variations <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      {/* Status-bucketed KPIs */}
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <BucketKpi
          label="Approved (confirmed)"
          value={approvedCost}
          count={approvedCount}
          tone="success"
        />
        <BucketKpi
          label="Pending (at risk)"
          value={pendingCost}
          count={draftCount + submittedCount}
          tone="warning"
          hint={`${draftCount} draft · ${submittedCount} submitted${pendingDays !== 0 ? ` · ${pendingDays >= 0 ? "+" : ""}${pendingDays}d` : ""}`}
        />
        <BucketKpi
          label="Rejected"
          value={rejectedCost}
          count={fromDr.length - approvedCount - draftCount - submittedCount}
          tone="neutral"
        />
      </div>

      {/* Breakdown */}
      <div className="border-t border-[var(--ink-200)] px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Cost breakdown · {fmtMoney(breakdownTotal)} total
          </p>
          <p className="mb-2.5 text-[11px] text-[var(--ink-500)]">
            {totalDays >= 0 ? "+" : ""}{totalDays}d total time impact
          </p>
        </div>
          <div className="space-y-3">
            <BreakdownRow
              icon={<HardHat className="h-3.5 w-3.5" />}
              label="Labour / Dayworks"
              value={labourCost}
              pct={labourPct}
              barColor="var(--accent-500)"
            />
            <BreakdownRow
              icon={<Package className="h-3.5 w-3.5" />}
              label="Materials / Other"
              value={materialsCost}
              pct={materialsPct}
              barColor="var(--amber-500)"
            />
          </div>
      </div>

      {/* Recent list */}
      <div className="border-t border-[var(--ink-200)]">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-4 py-2">VO</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Raised</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-200)]">
            {fromDr.slice(0, 6).map((v) => {
              const labour = v.changes.filter(isLabour).reduce((s, c) => s + c.lineTotal, 0);
              return (
                <tr key={v.id}>
                  <td className="px-4 py-2 font-mono font-semibold">{v.id}</td>
                  <td className="px-3 py-2 text-[var(--ink-700)]">
                    {v.title}
                    {labour !== 0 && (
                      <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
                        Labour
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--ink-500)]">{v.raisedDate}</td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      tone={
                        v.status === "approved"
                          ? "success"
                          : v.status === "submitted"
                            ? "warning"
                            : v.status === "rejected"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {v.status}
                    </StatusBadge>
                  </td>
                  <td className={`px-3 py-2 text-right font-mono tabular-nums ${v.costImpact >= 0 ? "" : "text-[var(--green-600)]"}`}>
                    {fmtMoney(v.costImpact)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--ink-500)]">
                    {v.timeImpactDays >= 0 ? "+" : ""}{v.timeImpactDays}d
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BreakdownRow({
  icon,
  label,
  value,
  pct,
  barColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
  barColor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="inline-flex items-center gap-1.5 text-[var(--ink-700)]">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums">
          <span className="font-semibold">{fmtMoney(value)}</span>
          <span className="ml-2 text-[var(--ink-500)]">{pct}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ink-50)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, Math.abs(pct)))}%`, background: barColor }} />
      </div>
    </div>
  );
}

function BucketKpi({
  label,
  value,
  count,
  tone,
  hint,
}: {
  label: string;
  value: number;
  count: number;
  tone: "success" | "warning" | "neutral";
  hint?: string;
}) {
  const color =
    tone === "success" ? "var(--green-600)" : tone === "warning" ? "var(--amber-500)" : "var(--ink-500)";
  const bg =
    tone === "success"
      ? "bg-[var(--green-600)]/[0.06] border-[var(--green-600)]/30"
      : tone === "warning"
        ? "bg-[var(--amber-500)]/[0.06] border-[var(--amber-500)]/30"
        : "bg-[var(--ink-50)] border-[var(--ink-200)]";
  return (
    <div className={`rounded-lg border p-3.5 ${bg}`}>
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style={{ color }}>
        <FileWarning className="h-3 w-3" /> {label}
      </p>
      <p className="mt-1.5 font-mono text-[20px] font-bold tabular-nums text-[var(--ink-900)]">
        {fmtMoney(value)}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">
        {count} VO{count === 1 ? "" : "s"}{hint ? ` · ${hint}` : ""}
      </p>
    </div>
  );
}