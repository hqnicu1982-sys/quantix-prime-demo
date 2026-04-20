import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogSystems, catalogCategories } from "@/lib/mockData";
import { Sparkles, Calculator, Search, ArrowUpRight, Flame, Volume2, Ruler } from "lucide-react";

export const Route = createFileRoute("/catalog")({ component: Catalog });

const accentBar: Record<string, string> = {
  blue: "bg-[var(--accent-500)]",
  purple: "bg-purple-500",
  green: "bg-[var(--green-600)]",
  amber: "bg-[var(--amber-500)]",
  red: "bg-[var(--red-500)]",
  navy: "bg-[var(--navy-900)]",
};

const toneText: Record<string, string> = {
  success: "text-[var(--green-600)]",
  info: "text-[var(--accent-500)]",
  neutral: "text-[var(--ink-500)]",
  warning: "text-[var(--amber-500)]",
  danger: "text-[var(--red-500)]",
};

function Catalog() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = catalogSystems.filter((s) => {
    const matchesCat = active === "all" || s.category === active;
    const matchesQ = !query || `${s.name} ${s.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-10">
      {/* Editorial header */}
      <header className="relative overflow-hidden rounded-[14px] border border-[var(--ink-200)] bg-card">
        <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1.4fr_1fr] lg:p-12">
          <div>
            <p className="font-mono-num text-[11px] uppercase tracking-[0.18em] text-[var(--ink-500)]">
              Index № 01 · Drylining systems library
            </p>
            <h1 className="font-display mt-4 text-[44px] font-semibold leading-[1.02] tracking-tight text-[var(--ink-900)] md:text-[60px]">
              Every BG system,<br />
              <span className="italic text-[var(--accent-500)]">specified</span> &amp; priced.
            </h1>
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[var(--ink-700)]">
              A live catalogue of 2,847 indexed wall, ceiling, floor and steel-protection
              build-ups — each one acoustic-graded, fire-rated and ready to drop into a quote.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button size="sm"><Calculator className="mr-1.5 h-3.5 w-3.5" /> Open Calculator</Button>
              <Button variant="outline" size="sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommend a system</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-[var(--ink-200)] bg-[var(--ink-200)] lg:self-end">
            <Stat k="2,847" l="Systems indexed" />
            <Stat k="98%" l="Acoustic-graded" />
            <Stat k="100%" l="Fire-rated" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent-100)] opacity-60 blur-3xl" />
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code (e.g. C-48/70) or name…"
            className="h-10 rounded-full border-[var(--ink-200)] bg-card pl-9 text-[13px]"
          />
        </div>
        <p className="font-mono-num text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
          Showing <span className="text-[var(--ink-900)]">{filtered.length}</span> of {catalogSystems.length} demo systems
        </p>
      </div>

      {/* Body: sidebar + list */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filter rail */}
        <aside className="space-y-1 lg:sticky lg:top-6 lg:self-start">
          <p className="px-2 pb-3 font-mono-num text-[10px] uppercase tracking-[0.15em] text-[var(--ink-500)]">
            Categories
          </p>
          {catalogCategories.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                  isActive
                    ? "bg-[var(--navy-900)] text-white"
                    : "text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
                }`}
              >
                <span className={isActive ? "font-medium" : ""}>{c.label}</span>
                <span className={`font-mono-num text-[11px] ${isActive ? "text-white/60" : "text-[var(--ink-500)]"}`}>
                  {c.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Editorial list */}
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <article
              key={s.code}
              className="group relative grid grid-cols-1 gap-6 overflow-hidden rounded-[10px] border border-[var(--ink-200)] bg-card p-6 transition-all hover:border-[var(--accent-500)] hover:shadow-[0_4px_24px_rgba(15,40,71,0.08)] md:grid-cols-[80px_1fr_auto] md:items-center md:p-7"
            >
              {/* Index + accent bar */}
              <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-4">
                <span className="font-mono-num text-[11px] tracking-wider text-[var(--ink-500)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={`h-0.5 w-12 ${accentBar[s.iconColor]} md:h-12 md:w-0.5`} />
              </div>

              {/* Main */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-[var(--ink-900)]">
                    {s.name}
                  </h3>
                  <span className="font-mono-num text-[12px] text-[var(--ink-500)]">{s.code}</span>
                  <span className={`text-[11px] font-medium uppercase tracking-wider ${toneText[s.badgeTone]}`}>
                    · {s.badge}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
                  <Spec icon={<Flame className="h-3.5 w-3.5" />} label="Fire" value={s.fire} />
                  <Spec icon={<Volume2 className="h-3.5 w-3.5" />} label="Acoustic" value={s.acoustic} />
                  <Spec icon={<Ruler className="h-3.5 w-3.5" />} label={s.spec_label} value={s.spec} />
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-6 border-t border-dashed border-[var(--ink-200)] pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">From</p>
                  <p className="font-mono-num text-[22px] font-semibold leading-none tracking-tight text-[var(--ink-900)]">
                    £{s.price.toFixed(2)}
                    <span className="ml-1 text-[11px] font-normal text-[var(--ink-500)]">/m²</span>
                  </p>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] transition-all group-hover:border-[var(--accent-500)] group-hover:bg-[var(--accent-500)] group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-[10px] border border-dashed border-[var(--ink-200)] p-12 text-center">
              <p className="font-display text-[18px] text-[var(--ink-700)]">No systems match your search.</p>
              <p className="mt-1 text-[12.5px] text-[var(--ink-500)]">Try a different category or clear the filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ k, l }: { k: string; l: string }) {
  return (
    <div className="bg-card p-5">
      <p className="font-display text-[26px] font-semibold leading-none tracking-tight text-[var(--ink-900)]">{k}</p>
      <p className="mt-2 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">{l}</p>
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--ink-700)]">
      <span className="text-[var(--ink-500)]">{icon}</span>
      <span className="text-[var(--ink-500)]">{label}</span>
      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{value}</span>
    </span>
  );
}
