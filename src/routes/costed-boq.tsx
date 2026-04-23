import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section, Card, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { costedBoqRows, costedBoqKpi, fmtMoney, type BoqRow } from "@/lib/mockData";
import { History, FileDown, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/costed-boq")({
  head: () => ({ meta: [{ title: "Costed BoQ — Quantix Prime" }] }),
  component: CostedBoq,
});

const TABS = [
  { id: "all", label: "All items", count: 82 },
  { id: "review", label: "Needs review", count: 6 },
  { id: "missing", label: "Not priced", count: 4 },
  { id: "savings", label: "Best savings", count: 12 },
] as const;

function CostedBoq() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("all");

  return (
    <Section
      title="Costed BoQ"
      subtitle="82 items · 2 active price lists (CCF + Minster) · 14 mappings confirmed · 6 need review"
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast("Revisions", { description: "BoQ rev 3.2 · 4 prior revisions available" })}><History className="mr-1.5 h-3.5 w-3.5" />Revisions</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Export ready", { description: "costed-boq-fitzrovia.csv downloaded" })}><FileDown className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
          <Button size="sm" onClick={() => toast.success("Optimised split calculated", { description: `Saving £${costedBoqKpi.totalSaving.toLocaleString()} by splitting CCF/Minster` })}><Sparkles className="mr-1.5 h-3.5 w-3.5" />Optimise split</Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="BoQ estimated" value={fmtMoney(costedBoqKpi.estimated, { compact: true })} />
        <Kpi label="Priced if cheapest" value={fmtMoney(costedBoqKpi.cheapest, { compact: true })} delta={`–${fmtMoney(costedBoqKpi.totalSaving)} vs estimate`} tone="success" trend="down" />
        <Kpi label="Single supplier (CCF)" value={fmtMoney(costedBoqKpi.singleSupplier, { compact: true })} delta="+£28.2k" tone="warning" />
        <Kpi label="Items not priced" value={`${costedBoqKpi.notPriced}`} delta={`${costedBoqKpi.coverage}% coverage`} tone="warning" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-md bg-[var(--ink-50)] p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded px-3 py-1.5 text-[12px] font-medium transition-colors",
                tab === t.id ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--ink-900)]",
              )}
            >
              {t.label} <span className="ml-1 text-[var(--ink-500)]">({t.count})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[var(--ink-500)]">Suppliers:</span>
          <StatusBadge tone="success" dot>CCF</StatusBadge>
          <StatusBadge tone="info" dot>Minster</StatusBadge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-3">BoQ item</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">BoQ rate</th>
                <th className="px-3 py-3 text-right bg-[var(--green-600)]/5">CCF</th>
                <th className="px-3 py-3 text-right bg-[var(--accent-500)]/5">Minster</th>
                <th className="px-3 py-3 text-center">Best</th>
                <th className="px-3 py-3 text-right">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {costedBoqRows.map((r) => <BoqRowCell key={r.code} row={r} />)}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--ink-50)]">
                <td colSpan={5} className="px-4 py-3 text-[12px] text-[var(--ink-500)]">
                  Showing 7 of 82 items · Total if cheapest split:{" "}
                  <strong className="font-mono text-[14px] text-[var(--green-600)]">–{fmtMoney(costedBoqKpi.totalSaving)} saved</strong>
                </td>
                <td colSpan={2} className="px-4 py-3 text-right">
                  <Button size="sm" onClick={() => toast.success("Call-offs generated", { description: "7 draft call-offs created · awaiting QS review" })}>Generate call-offs</Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </Section>
  );
}

function BoqRowCell({ row }: { row: BoqRow }) {
  const isReview = row.best === "review";
  const ccfBest = row.best === "ccf";
  const minBest = row.best === "minster";

  return (
    <tr className={cn("hover:bg-[var(--ink-50)]/60", isReview && "bg-[var(--amber-500)]/5")}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          {isReview && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--amber-500)]" />}
          <div>
            <p className="font-medium text-[var(--ink-900)]">{row.name}</p>
            <p className={cn("text-[11px]", isReview ? "text-[var(--amber-500)] font-medium" : "text-[var(--ink-500)]")}>{row.subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-[var(--ink-700)]">
        {row.qty.toLocaleString()} {row.unit}
      </td>
      <td className="px-3 py-3 text-right font-mono text-[12.5px] tabular-nums">£{row.rate.toFixed(2)}</td>
      <td className={cn(
        "px-3 py-3 text-right font-mono text-[12.5px] tabular-nums",
        ccfBest && "border-l-2 border-[var(--green-600)] bg-gradient-to-r from-[var(--green-600)]/10 to-transparent font-semibold text-[var(--green-600)]",
        row.ccf && row.minster && row.ccf > row.minster && !ccfBest && "bg-[var(--red-500)]/5 text-[var(--ink-500)]",
      )}>
        {row.ccf !== null ? `£${row.ccf.toFixed(2)}` : "—"}
      </td>
      <td className={cn(
        "px-3 py-3 text-right font-mono text-[12.5px] tabular-nums",
        minBest && "border-l-2 border-[var(--green-600)] bg-gradient-to-r from-[var(--green-600)]/10 to-transparent font-semibold text-[var(--green-600)]",
        row.ccf && row.minster && row.minster > row.ccf && !minBest && "bg-[var(--red-500)]/5 text-[var(--ink-500)]",
      )}>
        {row.minster !== null ? `£${row.minster.toFixed(2)}` : "—"}
      </td>
      <td className="px-3 py-3 text-center">
        {isReview
          ? <StatusBadge tone="warning">Review</StatusBadge>
          : <StatusBadge tone={ccfBest ? "success" : "info"}>{ccfBest ? "CCF" : "Minster"}</StatusBadge>}
      </td>
      <td className="px-3 py-3 text-right font-mono text-[12.5px] font-semibold tabular-nums text-[var(--green-600)]">
        {row.saving > 0 ? `–£${row.saving.toLocaleString()}` : "—"}
      </td>
    </tr>
  );
}
