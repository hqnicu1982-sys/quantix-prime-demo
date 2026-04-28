import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { fitzroviaSystems, fmtMoney } from "@/lib/mockData";

export const Route = createFileRoute("/projects/fitzrovia/specification")({ component: SpecificationPage });

const docs = [
  { name: "Architectural drawings — Rev 4.1.pdf", size: "12.4 MB", date: "18 Apr 2026", tag: "Architect", tone: "info" as const },
  { name: "NBS Specification — Drylining.docx", size: "842 KB", date: "12 Apr 2026", tag: "Spec", tone: "info" as const },
  { name: "Acoustic performance schedule.xlsx", size: "186 KB", date: "08 Apr 2026", tag: "Performance", tone: "neutral" as const },
  { name: "Fire strategy report v3.pdf", size: "3.1 MB", date: "02 Apr 2026", tag: "Fire", tone: "danger" as const },
  { name: "Sample BG system extracts.pdf", size: "5.8 MB", date: "28 Mar 2026", tag: "Reference", tone: "neutral" as const },
];

const requirements = [
  { area: "Bedrooms (L4–L6, 248 rooms)", spec: "GypWall CLASSIC C-48/70 · 60 min fire · 43 Rw dB", status: "approved" as const },
  { area: "Corridors (L4–L6)", spec: "GypWall ROBUST · impact SD2 · 60 min fire", status: "approved" as const },
  { area: "Lift & service shafts", spec: "Knauf ShaftWall S-CW · 120 min fire · 52 Rw dB", status: "review" as const },
  { area: "Ceilings (all guest areas)", spec: "CasoLine MF · 30 min · 37 Rw dB", status: "approved" as const },
  { area: "Plant room partitions", spec: "GypWall QUIET 92/146 · 63 Rw dB", status: "approved" as const },
];

function SpecificationPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Spec documents" value="14" delta="5 added this month" tone="info" />
        <Kpi label="Systems specified" value={`${fitzroviaSystems.length}`} delta="2 awaiting BG approval" tone="warning" />
        <Kpi label="Spec coverage" value="92%" delta="8% pending shaft details" tone="success" />
        <Kpi label="Open RFIs" value="3" delta="1 with architect 4d" tone="warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHead
              title="Specification documents"
              subtitle="Drawings, NBS specs, performance schedules"
              right={<Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Export pack</Button>}
            />
            <div className="divide-y divide-[var(--ink-200)]">
              {docs.map((d) => (
                <div key={d.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--ink-50)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ink-50)]">
                    <FileText className="h-4 w-4 text-[var(--ink-500)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{d.name}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{d.size} · uploaded {d.date}</p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                    d.tone === "danger" ? "bg-[var(--red-500)]/10 text-[var(--red-500)]"
                      : d.tone === "info" ? "bg-[var(--accent-500)]/10 text-[var(--accent-500)]"
                      : "bg-[var(--ink-50)] text-[var(--ink-500)]"
                  }`}>{d.tag}</span>
                  <button className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Download">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Specified systems by area" subtitle="Mapped from architect drawings & NBS spec" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Area</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Specified system</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-200)]">
                  {requirements.map((r) => (
                    <tr key={r.area} className="hover:bg-[var(--ink-50)]">
                      <td className="px-4 py-3 font-semibold text-[var(--ink-900)]">{r.area}</td>
                      <td className="px-4 py-3 text-[var(--ink-700)]">{r.spec}</td>
                      <td className="px-4 py-3">
                        {r.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--amber-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">
                            <AlertTriangle className="h-3 w-3" /> In review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead title="Performance summary" />
            <div className="space-y-3 p-5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Max fire rating</span>
                <span className="font-semibold text-[var(--red-500)]">120 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Max acoustic</span>
                <span className="font-semibold">63 Rw dB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Tallest partition</span>
                <span className="font-semibold">8.1 m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Total wall area</span>
                <span className="font-semibold">3,590 m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Total ceiling area</span>
                <span className="font-semibold">4,120 m²</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHead title="Specified systems" />
            <div className="space-y-3 p-5">
              {fitzroviaSystems.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <Layers className="mt-0.5 h-4 w-4 text-[var(--accent-500)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{s.name}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{s.area} · {fmtMoney(s.value, { compact: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
