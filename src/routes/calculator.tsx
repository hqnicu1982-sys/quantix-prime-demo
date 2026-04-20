import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { calculatorPreset, calculatorResults, fmtMoney } from "@/lib/mockData";
import { Save, Plus, Info } from "lucide-react";

export const Route = createFileRoute("/calculator")({ component: Calculator });

const dotColor: Record<string, string> = {
  blue: "bg-[var(--accent-500)]",
  purple: "bg-purple-500",
  green: "bg-[var(--green-600)]",
  amber: "bg-[var(--amber-500)]",
  navy: "bg-[var(--navy-900)]",
};

function Calculator() {
  return (
    <Section
      title="Calculator"
      subtitle="Quantify materials and labour for a BG system with live results. Pulls price intelligence from your active price lists."
      right={
        <>
          <Button variant="outline" size="sm"><Save className="mr-1.5 h-3.5 w-3.5" /> Save as estimate</Button>
          <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add to BoQ</Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex border-b border-[var(--ink-200)]">
            <button className="flex-1 border-b-2 border-[var(--accent-500)] py-3 text-[12.5px] font-semibold text-[var(--ink-900)]">By System Code</button>
            <button className="flex-1 py-3 text-[12.5px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]">Recommend by Requirements</button>
          </div>
          <div className="space-y-4 p-5 text-[13px]">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">System</p>
              <div className="rounded-md border-2 border-[var(--accent-500)] bg-[var(--accent-500)]/5 p-3">
                <p className="font-semibold">{calculatorPreset.system.name} <span className="font-mono-num text-[11px] text-[var(--ink-500)]">{calculatorPreset.system.code}</span></p>
                <p className="text-[11.5px] text-[var(--ink-500)]">{calculatorPreset.system.subtitle}</p>
              </div>
            </div>
            <Field label="Area (m²)" value={calculatorPreset.area.toString()} />
            <Field label="Height (m)" value={calculatorPreset.height.toString()} />
            <Field label="Board type" value={calculatorPreset.board} />
            <Field label="Insulation" value={calculatorPreset.insulation} />
            <Field label="Sides" value={calculatorPreset.sides} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Labour rate (£/h)" value={calculatorPreset.labourRate.toString()} />
              <Field label="Wastage %" value={calculatorPreset.wastage.toString()} />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="hero-glow text-white">
            <div className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Live result</p>
              <div className="mt-4 grid grid-cols-2 gap-4 border-b border-white/20 pb-4">
                <div>
                  <p className="text-[11px] text-white/60">Material</p>
                  <p className="font-display mt-1 text-[28px] font-semibold">{fmtMoney(calculatorResults.material, { compact: true })}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/60">Labour</p>
                  <p className="font-display mt-1 text-[28px] font-semibold">{fmtMoney(calculatorResults.labour, { compact: true })}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-white/60">System total</p>
                  <p className="font-display mt-1 text-[38px] font-bold leading-none">{fmtMoney(calculatorResults.total)}</p>
                </div>
                <p className="text-[11.5px] text-white/70">Per m² <span className="font-mono-num font-semibold text-white">£{calculatorResults.perM2.toFixed(2)}</span></p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Material breakdown" />
            <div className="divide-y divide-[var(--ink-200)] text-[13px]">
              {calculatorResults.breakdown.map((b) => (
                <div key={b.name} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor[b.color]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-[11px] text-[var(--ink-500)]">{b.detail}</p>
                  </div>
                  <span className="font-mono-num font-semibold">{fmtMoney(b.cost)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-4 text-[12.5px] text-[var(--ink-900)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" />
            <p>
              <strong>Cheapest suppliers identified</strong> — Minster has the lowest price on boards (£3.92/m², –6.2%) and CCF is cheapest on studs (£11.80/m, –4.5%). Total saving if split: <strong>{fmtMoney(calculatorResults.saving)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input className="w-full rounded-md border border-[var(--ink-200)] bg-white px-3 py-2 text-[13px] font-medium focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20" defaultValue={value} />
    </div>
  );
}
