import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Calculator, Layers, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { costedBoqRows, costedBoqKpi, fmtMoney } from "@/lib/mockData";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { BoqForecastBanner } from "@/components/financial/BoqForecastBanner";
import { useProjectData } from "@/lib/projectData";
import { useBoqAllocation } from "@/lib/boqAllocation";
import { useSupplierStats } from "@/lib/priceListRegistry";

export const Route = createFileRoute("/projects/$projectId/costed-boq")({ component: GuardedBoQPage });

function GuardedBoQPage() {
  const allowed = useCan("view.boq");
  if (!allowed) return <NoAccess cap="view.boq" title="Costed BoQ restricted" />;
  return <BoQPage />;
}

function BoQPage() {
  const { projectId } = Route.useParams();
  const data = useProjectData(projectId);
  const hasLive = data.boqLines.length > 0;
  if (hasLive) return <LiveBoQ projectId={projectId} />;
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-3 text-[12.5px]">
        <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
          <Layers className="h-4 w-4 text-[var(--amber-500)]" /> Demo data shown
        </p>
        <p className="mt-1 text-[var(--ink-700)]">
          No systems on this project's BoQ yet. Open the{" "}
          <Link to="/calculator" className="font-medium text-[var(--accent-500)] hover:underline">Calculator</Link>{" "}
          to add a system — its materials will appear here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Estimated BoQ" value={fmtMoney(costedBoqKpi.estimated, { compact: true })} />
        <Kpi label="Cheapest priced" value={fmtMoney(costedBoqKpi.cheapest, { compact: true })} delta={`–${fmtMoney(costedBoqKpi.totalSaving)} vs estimate`} tone="success" />
        <Kpi label="Coverage" value={`${costedBoqKpi.coverage}%`} delta={`${costedBoqKpi.notPriced} lines need pricing`} tone="warning" />
        <Kpi label="Suppliers compared" value="2" delta="CCF · Minster" />
      </div>

      <BoqForecastBanner projectId={projectId} />

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

function LiveBoQ({ projectId }: { projectId: string }) {
  const data = useProjectData(projectId);
  const alloc = useBoqAllocation(projectId);
  const supplierStats = useSupplierStats();
  const statFor = (supplier?: string) =>
    supplier ? supplierStats.find((s) => s.supplier.toLowerCase() === supplier.toLowerCase()) : undefined;
  const lineCount = data.boqLines.length;
  const pricedLines = data.boqLines.filter((l) => (l.ratePerUnit ?? 0) > 0).length;
  const coverage = lineCount === 0 ? 0 : Math.round((pricedLines / lineCount) * 100);
  const estimated = data.boqLines.reduce(
    (s, l) => s + (l.qty * (l.ratePerUnit ?? 0)),
    0,
  );
  const suppliers = new Set(
    data.boqLines
      .map((l) => l.selectedSupplier ?? data.supplierChoices[l.material])
      .filter(Boolean) as string[],
  );
  const supplierImpact = Array.from(suppliers)
    .map((sup) => ({ supplier: sup, stat: statFor(sup) }))
    .filter((x) => x.stat) as { supplier: string; stat: NonNullable<ReturnType<typeof statFor>> }[];
  const varianceValue = supplierImpact.reduce((sum, { supplier, stat }) => {
    const lineSum = data.boqLines
      .filter((l) => (l.selectedSupplier ?? data.supplierChoices[l.material]) === supplier)
      .reduce((s, l) => s + l.qty * (l.ratePerUnit ?? 0), 0);
    return sum + (lineSum * stat.variationPct) / 100;
  }, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="BoQ value" value={estimated > 0 ? fmtMoney(estimated, { compact: true }) : "—"} delta={`${lineCount} line${lineCount === 1 ? "" : "s"}`} />
        <Kpi label="Systems on BoQ" value={String(data.systems.length)} delta={alloc.totals.approved > 0 ? `${alloc.totals.ordered.toLocaleString()} ordered / ${alloc.totals.approved.toLocaleString()} approved` : "no orders yet"} />
        <Kpi label="Pricing coverage" value={`${coverage}%`} delta={`${pricedLines}/${lineCount} priced`} tone={coverage >= 80 ? "success" : "warning"} />
        <Kpi label="Suppliers chosen" value={String(suppliers.size)} delta={suppliers.size > 0 ? Array.from(suppliers).slice(0, 2).join(" · ") : "none yet"} />
      </div>

      <BoqForecastBanner projectId={projectId} />

      {supplierImpact.length > 0 && (
        <Card>
          <CardHead
            title="Price variation since last upload"
            subtitle={`Forecast impact: ${varianceValue >= 0 ? "+" : "−"}${fmtMoney(Math.abs(varianceValue))} based on indexed supplier price lists`}
            right={<Button size="sm" variant="outline" asChild><Link to="/price-lists/upload"><FileText className="mr-1.5 h-3.5 w-3.5" /> Manage price lists</Link></Button>}
          />
          <div className="flex flex-wrap gap-2 p-4">
            {supplierImpact.map(({ supplier, stat }) => {
              const up = stat.variationPct > 0;
              const flat = stat.variationPct === 0;
              return (
                <span key={supplier} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-semibold ${flat ? "border-[var(--ink-200)] text-[var(--ink-700)]" : up ? "border-[var(--red-500)]/30 bg-[var(--red-500)]/5 text-[var(--red-500)]" : "border-[var(--green-600)]/30 bg-[var(--green-600)]/5 text-[var(--green-600)]"}`}>
                  {supplier}
                  {!flat && (up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                  {up ? "+" : ""}{stat.variationPct.toFixed(1)}%
                  <span className="font-normal text-[var(--ink-500)]">· {stat.items} items · {stat.lastUpload}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {alloc.systems.map((sys) => (
        <Card key={sys.system.id}>
          <CardHead
            title={sys.system.systemName}
            subtitle={`${sys.system.systemCode} · ${sys.system.lengthM}×${sys.system.heightM}m · ${sys.system.areaM2.toFixed(1)}m² · ${sys.pctOrdered}% ordered`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Material</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Approved</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Ordered</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Remaining</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Rate £</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Line £</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Impact £</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-200)]">
                {sys.lines.map((la) => {
                  const supplier = la.line.selectedSupplier ?? data.supplierChoices[la.line.material] ?? "—";
                  const rate = la.line.ratePerUnit ?? 0;
                  const lineTotal = rate * la.approved;
                  const stat = statFor(supplier);
                  const pct = stat?.variationPct ?? 0;
                  const impact = (lineTotal * pct) / 100;
                  // tone: green = saving / flat, amber = mild uplift, red = significant uplift
                  const tone =
                    !stat || lineTotal === 0
                      ? "muted"
                      : pct <= 0
                        ? "good"
                        : pct <= 2 || Math.abs(impact) < 200
                          ? "warn"
                          : "bad";
                  const toneText =
                    tone === "good"
                      ? "text-[var(--green-600)]"
                      : tone === "warn"
                        ? "text-[var(--amber-500)]"
                        : tone === "bad"
                          ? "text-[var(--red-500)]"
                          : "text-[var(--ink-500)]";
                  const toneBg =
                    tone === "good"
                      ? "bg-[var(--green-600)]/10"
                      : tone === "warn"
                        ? "bg-[var(--amber-500)]/15"
                        : tone === "bad"
                          ? "bg-[var(--red-500)]/10"
                          : "";
                  return (
                    <tr key={la.line.id} className="hover:bg-[var(--ink-50)]">
                      <td className="px-4 py-3 font-semibold">{la.line.material}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{la.approved.toLocaleString()} {la.line.unit}</td>
                      <td className="px-4 py-3 text-right font-mono-num text-[var(--ink-700)]">{la.ordered.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-mono-num font-semibold ${la.remaining === 0 ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>{la.remaining.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{rate > 0 ? `£${rate.toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">
                        <span>{supplier}</span>
                        {stat && pct !== 0 && (
                          <span className={`ml-1.5 inline-flex items-center gap-0.5 rounded px-1 text-[10.5px] font-semibold ${toneBg} ${toneText}`} title={`Since ${stat.lastUpload}`}>
                            {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold">{lineTotal > 0 ? `£${lineTotal.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold">
                        {stat && lineTotal > 0 && pct !== 0 ? (
                          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 ${toneBg} ${toneText}`} title={`${pct > 0 ? "+" : ""}${pct.toFixed(1)}% since ${stat.lastUpload}`}>
                            {impact > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {impact > 0 ? "+" : "−"}£{Math.abs(impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-500)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        <Button size="sm" asChild><Link to="/calculator"><Calculator className="mr-1.5 h-3.5 w-3.5" /> Add system <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
      </div>
    </div>
  );
}
