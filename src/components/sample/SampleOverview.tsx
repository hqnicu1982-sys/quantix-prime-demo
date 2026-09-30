import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { fmtMoney } from "@/lib/mockData";
import { SAMPLE_PROJECT } from "@/lib/sampleProject";
import { SAMPLE_SYSTEMS } from "@/lib/sampleProjectData";

export function SampleOverview() {
  const spent = 35960;
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Contract" value={fmtMoney(SAMPLE_PROJECT.contractValue)} delta="Retention 3%" />
      <Kpi label="Spent" value={fmtMoney(spent)} delta="34% of contract" />
      <Kpi label="Forecast margin" value="18.4%" delta="Healthy forecast" tone="success" />
      <Kpi label="Progress" value="42%" delta="Levels 2–3" tone="success" />
    </div>
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Card><CardHead title="Systems on this project" subtitle="Walls only · 1,750 m² total" /><div className="divide-y divide-[var(--ink-200)]">{SAMPLE_SYSTEMS.map((s) => <div key={s.id} className="flex items-center gap-3 px-5 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-500)]/10 text-[11px] font-bold text-[var(--accent-500)]">{s.systemName.slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{s.systemName}</p><p className="text-[11px] text-[var(--ink-500)]">{s.systemCode} · {s.areaM2} m² · {s.heightM.toFixed(1)} m high</p></div><CheckCircle2 className="h-4 w-4 text-[var(--green-600)]" /></div>)}</div></Card>
      <div className="space-y-5"><Card><CardHead title="Project health" /><div className="space-y-3 p-5"><Health label="Overall" value="Healthy" good /><Health label="Programme" value="W3 behind" warning /><Health label="Commercial" value="18.4% margin" good /><Health label="Quality" value="No open defects" good /></div></Card><Card className="border-[var(--amber-500)]/30"><CardHead title="One issue needs attention" /><div className="flex gap-3 p-5 text-[12.5px]"><AlertTriangle className="h-4 w-4 shrink-0 text-[var(--amber-500)]"/><div><p className="font-semibold">Meridian invoice dispute open</p><p className="mt-1 text-[var(--ink-500)]">CO-0002: billed 240 FireLine sheets, 180 delivered; £14.90 billed vs £14.10 quoted.</p></div></div></Card></div>
    </div>
  </div>;
}
function Health({ label, value, good, warning }: { label: string; value: string; good?: boolean; warning?: boolean }) { return <div className="flex items-center justify-between text-[12.5px]"><span className="text-[var(--ink-500)]">{label}</span><span className={`font-semibold ${good ? "text-[var(--green-600)]" : warning ? "text-[var(--amber-500)]" : ""}`}>{value}</span></div> }
