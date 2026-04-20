import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { catalogSystems, catalogCategories } from "@/lib/mockData";
import { Search, Plus, Flame, Waves, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/catalog")({ component: Catalog });

const dotColor: Record<string, string> = {
  blue: "bg-[var(--accent-500)]",
  purple: "bg-purple-500",
  green: "bg-[var(--green-600)]",
  amber: "bg-[var(--amber-500)]",
  red: "bg-[var(--red-500)]",
  navy: "bg-white",
};

function Catalog() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>("C-48/70");

  const filtered = catalogSystems.filter((s) => {
    const matchesCat = active === "all" || s.category === active;
    const matchesQ = !query || `${s.name} ${s.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  const sel = catalogSystems.find((s) => s.code === selected) ?? filtered[0];

  return (
    <div className="-m-6 min-h-[calc(100vh-3.5rem)] bg-[var(--navy-950)] p-6 text-white md:-m-8 md:p-8">
      {/* Top meta strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono-num text-[10.5px] uppercase tracking-[0.18em] text-white/50">
        <div className="flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--green-600)]" />
          <span>SYS_CATALOG / v2.4 / live</span>
          <span className="hidden text-white/30 md:inline">·</span>
          <span className="hidden md:inline">Indexed 2,847 · Updated 04:12 UTC</span>
        </div>
        <span>BG ↔ Knauf ↔ Siniat</span>
      </div>

      {/* Massive title block */}
      <div className="grid grid-cols-1 gap-8 border-b border-white/10 py-10 md:grid-cols-[1fr_auto] md:items-end md:py-14">
        <div>
          <p className="font-mono-num text-[11px] uppercase tracking-[0.2em] text-[var(--accent-500)]">
            §01 — Systems index
          </p>
          <h1 className="font-display mt-3 text-[64px] font-semibold leading-[0.95] tracking-tight md:text-[96px]">
            The <span className="italic text-white/50">spec</span><br />
            library.
          </h1>
        </div>
        <div className="grid w-full grid-cols-3 gap-8 md:w-auto md:gap-12">
          <Metric k="2,847" l="Build-ups" />
          <Metric k="98%" l="Acoustic" />
          <Metric k="100%" l="Fire-rated" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-white/10 py-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 border border-white/15 bg-white/5 px-3 py-2.5">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep systems — code, name, rating…"
            className="font-mono-num w-full bg-transparent text-[12.5px] text-white placeholder:text-white/30 focus:outline-none"
          />
          <span className="font-mono-num text-[10.5px] text-white/30">⌘K</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          {catalogCategories.slice(0, 6).map((c) => {
            const isA = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`font-mono-num whitespace-nowrap border px-3 py-2 text-[10.5px] uppercase tracking-wider transition-colors ${
                  isA
                    ? "border-[var(--accent-500)] bg-[var(--accent-500)] text-white"
                    : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                }`}
              >
                {c.label} <span className="ml-1 opacity-50">{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split: list / detail */}
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.3fr_1fr]">
        {/* List */}
        <div className="divide-y divide-white/10 border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
          {/* List header */}
          <div className="font-mono-num grid grid-cols-[24px_1fr_auto_auto] items-center gap-4 px-1 py-3 text-[10px] uppercase tracking-[0.15em] text-white/40">
            <span>#</span>
            <span>System</span>
            <span className="text-right">Fire / dB</span>
            <span className="text-right">£/m²</span>
          </div>

          {filtered.map((s, i) => {
            const isSel = s.code === sel?.code;
            return (
              <button
                key={s.code}
                onClick={() => setSelected(s.code)}
                className={`group grid w-full grid-cols-[24px_1fr_auto_auto] items-center gap-4 px-1 py-5 text-left transition-colors ${
                  isSel ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                }`}
              >
                <span className="font-mono-num text-[10.5px] text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor[s.iconColor]}`} />
                    <h3 className="font-display truncate text-[20px] font-semibold leading-tight tracking-tight">
                      {s.name}
                    </h3>
                  </div>
                  <p className="font-mono-num mt-1 pl-[18px] text-[11px] uppercase tracking-wider text-white/40">
                    {s.code} · {s.badge}
                  </p>
                </div>
                <div className="font-mono-num text-right text-[11.5px] text-white/70">
                  <p>{s.fire}</p>
                  <p className="text-white/40">{s.acoustic}</p>
                </div>
                <div className="font-mono-num text-right text-[16px] font-semibold tabular-nums">
                  £{s.price.toFixed(2)}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center font-mono-num text-[11px] uppercase tracking-wider text-white/40">
              ∅ no_results — try another category
            </div>
          )}
        </div>

        {/* Detail panel */}
        {sel && (
          <aside className="lg:sticky lg:top-6 lg:self-start lg:p-8">
            <div className="border border-white/15 bg-black/30 p-6 md:p-8">
              <div className="flex items-center justify-between font-mono-num text-[10px] uppercase tracking-[0.18em] text-white/40">
                <span>Selected · {sel.category}</span>
                <span className={`flex items-center gap-1.5`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor[sel.iconColor]}`} />
                  {sel.badge}
                </span>
              </div>

              <h2 className="font-display mt-5 text-[40px] font-semibold leading-[1] tracking-tight">
                {sel.name}
              </h2>
              <p className="font-mono-num mt-2 text-[12px] tracking-wider text-white/50">
                {sel.code}
              </p>

              {/* Stat lines */}
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
                <Row icon={<Flame className="h-3.5 w-3.5" />} k="Fire integrity" v={sel.fire} />
                <Row icon={<Waves className="h-3.5 w-3.5" />} k="Acoustic Rw" v={sel.acoustic} />
                <Row icon={<Plus className="h-3.5 w-3.5" />} k={sel.spec_label} v={sel.spec} />
              </dl>

              {/* Price */}
              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="font-mono-num text-[10px] uppercase tracking-[0.18em] text-white/40">
                    From
                  </p>
                  <p className="font-display mt-1 text-[44px] font-semibold leading-none tracking-tight">
                    £{sel.price.toFixed(2)}
                    <span className="font-mono-num ml-1 text-[12px] font-normal text-white/40">/m²</span>
                  </p>
                </div>
                <p className="font-mono-num text-right text-[10.5px] uppercase tracking-wider text-white/40">
                  ex. VAT<br />
                  CCF list
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-col gap-2">
                <button className="group flex items-center justify-between border border-[var(--accent-500)] bg-[var(--accent-500)] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors hover:bg-[var(--accent-500)]/85">
                  Quote in calculator
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button className="border border-white/20 px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-white/80 transition-colors hover:border-white/40 hover:text-white">
                  View datasheet ↗
                </button>
              </div>
            </div>

            <p className="font-mono-num mt-4 px-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
              Cross-ref: BG_handbook §4.2 · last_sync 04:12 UTC
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function Metric({ k, l }: { k: string; l: string }) {
  return (
    <div>
      <p className="font-display text-[36px] font-semibold leading-none tracking-tight md:text-[44px]">{k}</p>
      <p className="font-mono-num mt-2 text-[10px] uppercase tracking-[0.15em] text-white/40">{l}</p>
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="flex items-center gap-2 text-[12px] text-white/60">
        <span className="text-white/40">{icon}</span>
        {k}
      </span>
      <span className="font-mono-num text-[14px] font-semibold tabular-nums">{v}</span>
    </div>
  );
}
