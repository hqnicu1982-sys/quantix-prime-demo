import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { catalogSystems, catalogCategories } from "@/lib/mockData";
import { Sparkles, Calculator, ArrowUpRight, Flame, Volume2, Ruler, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/catalog")({ component: Catalog });

const tint: Record<string, { bg: string; ink: string; chip: string }> = {
  blue:   { bg: "bg-[var(--accent-100)]",                ink: "text-[var(--accent-500)]", chip: "bg-[var(--accent-500)]" },
  purple: { bg: "bg-purple-100",                         ink: "text-purple-700",          chip: "bg-purple-500" },
  green:  { bg: "bg-emerald-50",                         ink: "text-emerald-700",         chip: "bg-[var(--green-600)]" },
  amber:  { bg: "bg-amber-50",                           ink: "text-amber-700",           chip: "bg-[var(--amber-500)]" },
  red:    { bg: "bg-rose-50",                            ink: "text-rose-700",            chip: "bg-[var(--red-500)]" },
  navy:   { bg: "bg-slate-100",                          ink: "text-[var(--navy-900)]",   chip: "bg-[var(--navy-900)]" },
};

// Bento sizing — feature first, then varied tiles
const tileClass = [
  "md:col-span-4 md:row-span-2", // hero / feature
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-4",
];

function Catalog() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = catalogSystems.filter((s) => {
    const matchesCat = active === "all" || s.category === active;
    const matchesQ = !query || `${s.name} ${s.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-10">
      {/* Magazine masthead */}
      <header className="grid grid-cols-1 items-end gap-6 border-b border-[var(--ink-200)] pb-8 md:grid-cols-[1fr_auto]">
        <div>
          <div className="font-mono-num flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--ink-500)]">
            <span className="h-px w-8 bg-[var(--ink-500)]" />
            Issue 04 · Spring 2026
          </div>
          <h1 className="font-display mt-4 text-[52px] font-semibold leading-[0.95] tracking-tight text-[var(--ink-900)] md:text-[72px]">
            Catalogue of<br />
            <span className="italic text-[var(--accent-500)]">build-ups</span> &amp; systems.
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-3 md:flex-col md:items-end">
          <p className="max-w-xs text-right text-[13px] leading-relaxed text-[var(--ink-700)]">
            A curated mosaic of <strong className="text-[var(--ink-900)]">2,847</strong> drylining systems —
            indexed, fire-rated, and priced for instant call-off.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("AI recommendations", { description: "Tell us your fire/acoustic targets — we'll surface 3 systems" })}><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommend</Button>
            <Button size="sm" onClick={() => navigate({ to: "/calculator" })}><Calculator className="mr-1.5 h-3.5 w-3.5" /> Calculator</Button>
          </div>
        </div>
      </header>

      {/* Sticky filter row */}
      <div className="sticky top-0 z-10 -mx-6 flex flex-col gap-3 border-b border-[var(--ink-200)] bg-[var(--background)]/85 px-6 py-3 backdrop-blur md:-mx-8 md:flex-row md:items-center md:px-8">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--ink-200)] bg-card px-4 py-2">
          <Search className="h-4 w-4 text-[var(--ink-500)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a system…"
            className="w-full bg-transparent text-[13px] placeholder:text-[var(--ink-500)] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {catalogCategories.slice(0, 7).map((c) => {
            const isA = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  isA
                    ? "bg-[var(--ink-900)] text-white"
                    : "border border-[var(--ink-200)] bg-card text-[var(--ink-700)] hover:border-[var(--ink-900)]"
                }`}
              >
                {c.label}
                <span className={`font-mono-num ml-1.5 text-[10.5px] ${isA ? "opacity-60" : "opacity-50"}`}>
                  {c.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento mosaic */}
      <div className="grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-6">
        {filtered.map((s, i) => {
          const t = tint[s.iconColor];
          const isFeature = i === 0;
          const cls = tileClass[i % tileClass.length];

          return (
            <article
              key={s.code}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--ink-200)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--ink-900)] hover:shadow-[0_10px_30px_-12px_rgba(15,40,71,0.18)] ${cls} ${
                isFeature ? t.bg : "bg-card"
              }`}
            >
              {/* Background giant numeral */}
              <span
                aria-hidden
                className={`font-display pointer-events-none absolute -right-2 -top-6 select-none text-[140px] font-semibold leading-none tracking-tighter ${
                  isFeature ? t.ink + " opacity-20" : "text-[var(--ink-50)]"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Header chip */}
              <div className="relative flex items-start justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider ${
                  isFeature ? "bg-white/70 text-[var(--ink-900)]" : "bg-[var(--ink-50)] text-[var(--ink-700)]"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${t.chip}`} />
                  {s.badge}
                </span>
                <button className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isFeature
                    ? "bg-white text-[var(--ink-900)] hover:bg-[var(--ink-900)] hover:text-white"
                    : "border border-[var(--ink-200)] text-[var(--ink-500)] group-hover:border-[var(--ink-900)] group-hover:bg-[var(--ink-900)] group-hover:text-white"
                }`} onClick={() => toast(`${s.name}`, { description: `${s.code} · opening system spec sheet` })}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="relative">
                <h3 className={`font-display font-semibold leading-[1.05] tracking-tight ${
                  isFeature ? "text-[42px] md:text-[52px]" : "text-[24px]"
                } text-[var(--ink-900)]`}>
                  {s.name}
                </h3>
                <p className="font-mono-num mt-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
                  {s.code}
                </p>

                {/* Spec strip */}
                <div className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] ${
                  isFeature ? "text-[var(--ink-700)]" : "text-[var(--ink-700)]"
                }`}>
                  <Spec icon={<Flame className="h-3 w-3" />} v={s.fire} />
                  <Spec icon={<Volume2 className="h-3 w-3" />} v={s.acoustic} />
                  <Spec icon={<Ruler className="h-3 w-3" />} v={s.spec} label={s.spec_label} />
                </div>

                {/* Footer */}
                <div className={`mt-4 flex items-end justify-between border-t pt-3 ${
                  isFeature ? "border-[var(--ink-900)]/15" : "border-[var(--ink-200)]"
                }`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">From</p>
                    <p className={`font-mono-num font-semibold leading-none tracking-tight text-[var(--ink-900)] ${
                      isFeature ? "text-[28px]" : "text-[18px]"
                    }`}>
                      £{s.price.toFixed(2)}
                      <span className="ml-1 text-[11px] font-normal text-[var(--ink-500)]">/m²</span>
                    </p>
                  </div>
                  <span className={`font-mono-num text-[10.5px] uppercase tracking-wider ${t.ink}`}>
                    {s.category}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="md:col-span-6 rounded-[18px] border border-dashed border-[var(--ink-200)] p-16 text-center">
            <p className="font-display text-[22px] text-[var(--ink-700)]">Nothing matches.</p>
            <p className="mt-1 text-[12.5px] text-[var(--ink-500)]">Try clearing the filter or searching another code.</p>
          </div>
        )}
      </div>

      {/* Footer ribbon */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed border-[var(--ink-200)] bg-card px-6 py-5">
        <p className="font-mono-num text-[11px] uppercase tracking-[0.18em] text-[var(--ink-500)]">
          End of issue · {filtered.length} of {catalogSystems.length} demo systems shown
        </p>
        <Button variant="outline" size="sm" onClick={() => toast("Full catalogue", { description: "2,847 systems · loading paged view" })}>Browse all 2,847 →</Button>
      </footer>
    </div>
  );
}

function Spec({ icon, v, label }: { icon: React.ReactNode; v: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[var(--ink-500)]">{icon}</span>
      {label && <span className="text-[var(--ink-500)]">{label}</span>}
      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{v}</span>
    </span>
  );
}
