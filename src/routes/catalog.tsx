import { createFileRoute } from "@tanstack/react-router";
import { Card, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { catalogSystems, catalogCategories } from "@/lib/mockData";
import { Sparkles, Calculator } from "lucide-react";

export const Route = createFileRoute("/catalog")({ component: Catalog });

const iconBg: Record<string, string> = {
  blue: "bg-[var(--accent-500)]",
  purple: "bg-purple-500",
  green: "bg-[var(--green-600)]",
  amber: "bg-[var(--amber-500)]",
  red: "bg-[var(--red-500)]",
  navy: "bg-[var(--navy-900)]",
};

function Catalog() {
  return (
    <Section
      title="System Catalog"
      subtitle="2,847 BG systems indexed · 98% acoustic-graded · 100% fire-rated coverage"
      right={
        <>
          <Button variant="outline" size="sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommend</Button>
          <Button size="sm"><Calculator className="mr-1.5 h-3.5 w-3.5" /> Open Calculator</Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {catalogCategories.map((c, i) => (
          <button key={c.id} className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${i === 0 ? "bg-[var(--navy-900)] text-white" : "bg-white border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--ink-50)]"}`}>
            {c.label} <span className="ml-1 opacity-60">({c.count})</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalogSystems.map((s) => (
          <Card key={s.code} className="p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold text-white ${iconBg[s.iconColor]}`}>
                {s.name.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <StatusBadge tone={s.badgeTone}>{s.badge}</StatusBadge>
            </div>
            <h3 className="font-display mt-4 text-[18px] font-semibold">{s.name}</h3>
            <p className="font-mono-num mt-0.5 text-[11px] text-[var(--ink-500)]">{s.code}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-[var(--ink-50)] p-3 text-center">
              <div><p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Fire</p><p className="mt-0.5 text-[12.5px] font-semibold">{s.fire}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">Acoustic</p><p className="mt-0.5 text-[12.5px] font-semibold">{s.acoustic}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{s.spec_label}</p><p className="mt-0.5 text-[12.5px] font-semibold">{s.spec}</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--ink-200)] pt-3">
              <p className="text-[12px] text-[var(--ink-500)]">From <span className="font-mono-num text-[14px] font-semibold text-[var(--ink-900)]">£{s.price.toFixed(2)}</span>/m²</p>
              <button className="text-[12px] font-medium text-[var(--accent-500)] hover:underline">Quote →</button>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
