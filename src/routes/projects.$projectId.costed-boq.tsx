import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { costedBoqRows, costedBoqKpi, fmtMoney } from "@/lib/mockData";

export const Route = createFileRoute("/projects/$projectId/costed-boq")({ component: BoQPage });

function BoQPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Estimated BoQ" value={fmtMoney(costedBoqKpi.estimated, { compact: true })} />
        <Kpi label="Cheapest priced" value={fmtMoney(costedBoqKpi.cheapest, { compact: true })} delta={`–${fmtMoney(costedBoqKpi.totalSaving)} vs estimate`} tone="success" />
        <Kpi label="Coverage" value={`${costedBoqKpi.coverage}%`} delta={`${costedBoqKpi.notPriced} lines need pricing`} tone="warning" />
        <Kpi label="Suppliers compared" value="2" delta="CCF · Minster" />
      </div>

      <Card>
        <CardHead
          title="Priced bill of quantities"
          subtitle="Best-price selection across enabled suppliers"
          right={
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
              <Button size="sm" asChild><Link to="/costed-boq">Full editor <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Code</th>
                <th className="px-4 py-2.5 text-left font-semibold">Description</th>
                <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">CCF £</th>
                <th className="px-4 py-2.5 text-right font-semibold">Minster £</th>
                <th className="px-4 py-2.5 text-left font-semibold">Best</th>
                <th className="px-4 py-2.5 text-right font-semibold">Saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {costedBoqRows.map((r) => (
                <tr key={r.code} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-3 font-mono-num text-[12px] text-[var(--ink-500)]">{r.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--ink-900)]">{r.name}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{r.subtitle}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num">{r.qty.toLocaleString()} {r.unit}</td>
                  <td className={`px-4 py-3 text-right font-mono-num ${r.best === "ccf" ? "font-bold text-[var(--green-600)]" : "text-[var(--ink-700)]"}`}>{r.ccf?.toFixed(2) ?? "—"}</td>
                  <td className={`px-4 py-3 text-right font-mono-num ${r.best === "minster" ? "font-bold text-[var(--green-600)]" : "text-[var(--ink-700)]"}`}>{r.minster?.toFixed(2) ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.best === "review" ? (
                      <span className="rounded bg-[var(--amber-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">Review</span>
                    ) : (
                      <span className="rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase text-[var(--green-600)]">{r.best}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-semibold text-[var(--green-600)]">{r.saving > 0 ? `£${r.saving.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
