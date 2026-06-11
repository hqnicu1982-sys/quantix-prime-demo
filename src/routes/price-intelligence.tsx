import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { priceIntelKpi, priceTrend, topMovers, priceAlerts, fmtMoney } from "@/lib/mockData";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Bell, Upload, ArrowUpRight, ArrowDownRight, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData, selectSupplier } from "@/lib/projectData";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useSupplierStats, usePriceListUploads } from "@/lib/priceListRegistry";

export const Route = createFileRoute("/price-intelligence")({ component: GuardedPriceIntel });

function GuardedPriceIntel() {
  const allowed = useCan("view.priceIntel");
  if (!allowed) return <NoAccess cap="view.priceIntel" title="Price Intelligence restricted" />;
  return <PriceIntel />;
}

function PriceIntel() {
  const navigate = useNavigate();
  const { current } = useProject();
  const data = useProjectData(current.id);
  const canCreateCalloffs = useCan("create.calloffs");
  const supplierStats = useSupplierStats();
  const uploads = usePriceListUploads();
  const liveItemsTracked = supplierStats.reduce((s, x) => s + x.items, 0);
  const liveSuppliers = supplierStats.length;
  const itemsTracked = liveItemsTracked > 0 ? liveItemsTracked : priceIntelKpi.itemsTracked;
  const marketCoverage = liveSuppliers > 0 ? Math.max(liveSuppliers, priceIntelKpi.marketCoverage) : priceIntelKpi.marketCoverage;
  const coveragePerSupplier = supplierStats
    .slice(0, 2)
    .map((s) => `${s.supplier} ${s.items}`)
    .join(" · ") || `${priceIntelKpi.ccfItems} CCF · ${priceIntelKpi.minsterItems} Minster`;
  return (
    <Section
      title="Price Intelligence"
      subtitle={`Watching ${itemsTracked} items across ${Math.max(liveSuppliers, 2)} suppliers. We'll flag uplifts, surface trends, and remember your wins.`}
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast("3 active alerts", { description: "WallBoard +4.2%, Insulation +2.1%, Plasterboard −1.8%" })}><Bell className="mr-1.5 h-3.5 w-3.5" /> Alerts (3)</Button>
          <Button size="sm" onClick={() => navigate({ to: "/price-lists/upload" })}><Upload className="mr-1.5 h-3.5 w-3.5" /> Upload new price list</Button>
        </>
      }
    >
      <ProjectBanner scope="Price Intelligence" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Items tracked" value={`${itemsTracked}`} delta={coveragePerSupplier} />
        <Kpi label="Avg uplift 90d" value={`+${priceIntelKpi.avgUplift}%`} delta={`vs +${priceIntelKpi.marketAvg}% market`} tone="warning" />
        <Kpi label="Best saving 30d" value={fmtMoney(priceIntelKpi.bestSaving)} delta="WallBoard switch" tone="success" />
        <Kpi label="Market coverage" value={`${marketCoverage}/${priceIntelKpi.marketTotal}`} delta={`${uploads.length} price list${uploads.length === 1 ? "" : "s"} indexed`} />
      </div>

      {supplierStats.length > 0 && (
        <Card>
          <CardHead
            title="Supplier price comparison"
            subtitle="Derived from your indexed price lists — variation since last upload"
            right={<Button size="sm" variant="outline" onClick={() => navigate({ to: "/price-lists/upload" })}><FileText className="mr-1.5 h-3.5 w-3.5" /> Manage uploads</Button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Uploads</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Items</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Matched</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Review</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Last upload</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Variation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-200)]">
                {supplierStats.map((s) => {
                  const up = s.variationPct > 0;
                  const flat = s.variationPct === 0;
                  return (
                    <tr key={s.supplier} className="hover:bg-[var(--ink-50)]">
                      <td className="px-4 py-3 font-semibold">{s.supplier}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{s.uploads}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{s.items}</td>
                      <td className="px-4 py-3 text-right font-mono-num text-[var(--green-600)]">{s.matched}</td>
                      <td className={`px-4 py-3 text-right font-mono-num ${s.review > 0 ? "text-[var(--amber-500)] font-semibold" : "text-[var(--ink-500)]"}`}>{s.review}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">{s.lastUpload}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold">
                        <span className={`inline-flex items-center gap-0.5 ${flat ? "text-[var(--ink-500)]" : up ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>
                          {!flat && (up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                          {up ? "+" : ""}{s.variationPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Price trend — WallBoard 15mm" subtitle="CCF vs Minster · last 8 weeks" />
          <div className="h-[280px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrend}>
                <CartesianGrid stroke="var(--ink-200)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="var(--ink-500)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ink-500)" fontSize={11} tickLine={false} axisLine={false} domain={[3.8, 4.3]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ccf" stroke="var(--green-600)" strokeWidth={2.5} dot={{ r: 3 }} name="CCF" />
                <Line type="monotone" dataKey="minster" stroke="var(--accent-500)" strokeWidth={2.5} dot={{ r: 3 }} name="Minster" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Top movers" />
          <div className="divide-y divide-[var(--ink-200)]">
            {topMovers.map((m) => (
              <div key={m.item} className="px-5 py-3">
                <p className="text-[12.5px] font-semibold">{m.item}</p>
                <p className="text-[11px] text-[var(--ink-500)]">{m.supplier} · was £{m.was.toFixed(2)}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`font-mono-num text-[15px] font-semibold ${m.dir === "up" ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>£{m.now.toFixed(2)}</span>
                  <span className={`flex items-center gap-0.5 text-[11.5px] font-semibold ${m.dir === "up" ? "text-[var(--red-500)]" : "text-[var(--green-600)]"}`}>
                    {m.dir === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {m.dir === "up" ? "+" : "–"}{m.pct}%
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {data.supplierChoices[m.item] === m.supplier ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]">
                      <Check className="h-3 w-3" /> Selected for {current.name}
                    </span>
                  ) : <span />}
                  {canCreateCalloffs && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => {
                        selectSupplier(current.id, m.item, m.supplier);
                        toast.success(`${m.supplier} selected`, { description: `${m.item} → ${current.name}` });
                      }}
                    >
                      Select for project
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Active alerts" />
        <div className="divide-y divide-[var(--ink-200)]">
          {priceAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-4 p-5">
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.tone === "warning" ? "bg-[var(--amber-500)]" : "bg-[var(--accent-500)]"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{a.title}</p>
                <p className="mt-1 text-[12.5px] text-[var(--ink-700)]">{a.body}</p>
              </div>
              <Button size="sm" variant={a.tone === "warning" ? "outline" : "default"} onClick={() => toast.success(a.action, { description: a.title })}>{a.action}</Button>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}
