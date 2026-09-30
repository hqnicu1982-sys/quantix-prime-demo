import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { SAMPLE_QUOTES, SAMPLE_QUOTE_TOTALS } from "@/lib/sampleProjectData";
import { fmtMoney } from "@/lib/mockData";
import { toast } from "sonner";

export function SampleCostedBoq() {
  const t = SAMPLE_QUOTE_TOTALS;
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Best mix" value={fmtMoney(t.bestMix)} delta={`Save ${fmtMoney(t.saving)} (${t.savingPct}%)`} tone="success" />
      <Kpi label="Cheapest complete quote" value={fmtMoney(t.meridian)} delta="Meridian Building Materials" />
      <Kpi label="Suppliers compared" value="3" delta="14 material lines" />
      <Kpi label="Not priced" value="1" delta="Northway · 4200 stud" tone="warning" />
    </div>
    <Card>
      <CardHead title="Supplier comparison" subtitle="Best mix compared with the cheapest complete quote" />
      <div className="grid gap-3 border-b border-[var(--ink-200)] p-4 md:grid-cols-4">
        <Total label="Castlegate Drylining Supplies" value={t.castlegate} detail={`Best-mix share ${fmtMoney(t.split.castlegate)}`} />
        <Total label="Meridian Building Materials" value={t.meridian} detail={`Best-mix share ${fmtMoney(t.split.meridian)}`} />
        <Total label="Northway Interiors Supply" value={t.northway} detail={`Incomplete · best-mix share ${fmtMoney(t.split.northway)}`} warning />
        <Total label="Best mix" value={t.bestMix} detail={`${fmtMoney(t.saving)} saving · ${t.savingPct}%`} best />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]"><tr><th className="px-4 py-2.5 text-left">Material</th><th className="px-3 py-2.5 text-right">Qty</th><th className="px-3 py-2.5 text-right">Castlegate</th><th className="px-3 py-2.5 text-right">Meridian</th><th className="px-3 py-2.5 text-right">Northway</th><th className="px-3 py-2.5 text-left">Choice</th></tr></thead>
          <tbody className="divide-y divide-[var(--ink-200)]">{SAMPLE_QUOTES.map((r) => <tr key={r.material} className="align-top hover:bg-[var(--ink-50)]"><td className="px-4 py-3"><p className="font-semibold">{r.material}</p>{r.note && <p className="mt-1 flex items-start gap-1 text-[11px] text-[var(--amber-500)]"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{r.note}</p>}</td><td className="px-3 py-3 text-right font-mono-num">{r.qty.toLocaleString()}</td><td className="px-3 py-3 text-right font-mono-num">{r.castlegate}</td><td className="px-3 py-3 text-right font-mono-num">{r.meridian}</td><td className={`px-3 py-3 text-right font-mono-num ${r.northway === "Not priced" ? "font-semibold text-[var(--amber-500)]" : ""}`}>{r.northway}{r.northway === "Not priced" && <Button size="sm" variant="outline" className="ml-2 h-7 text-[11px]" onClick={() => toast("Fix data", { description: "Add Northway’s 4200 stud price or keep the line excluded." })}><Wrench className="mr-1 h-3 w-3" />Fix data</Button>}</td><td className="px-3 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${r.choice === "MANUAL" ? "bg-[var(--amber-500)]/10 text-[var(--amber-500)]" : "bg-[var(--green-600)]/10 text-[var(--green-600)]"}`}>{r.choice}</span></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}
function Total({ label, value, detail, warning, best }: { label: string; value: number; detail: string; warning?: boolean; best?: boolean }) { return <div className={`rounded-md border p-3 ${best ? "border-[var(--green-600)]/30 bg-[var(--green-600)]/5" : warning ? "border-[var(--amber-500)]/30" : "border-[var(--ink-200)]"}`}><p className="text-[11px] font-medium text-[var(--ink-500)]">{label}</p><p className="mt-1 font-mono-num text-[18px] font-semibold">{fmtMoney(value)}</p><p className="mt-1 flex items-center gap-1 text-[10.5px] text-[var(--ink-500)]">{best && <CheckCircle2 className="h-3 w-3 text-[var(--green-600)]" />}{detail}</p></div> }
