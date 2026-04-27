import { useEffect, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import {
  BRANDS,
  getBrand,
  readActiveBrand,
  writeActiveBrand,
  subscribeBrand,
  type BrandId,
} from "@/lib/systemBrands";

/**
 * Pill that shows the currently-active manufacturer brand and opens a
 * popover to switch between Knauf / Siniat / British Gypsum / Fermacell.
 *
 * Visual only — actual catalogue swap is wired up in a follow-up step.
 */
export function BrandSelector() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<BrandId>("british-gypsum");

  useEffect(() => {
    setActiveId(readActiveBrand());
    return subscribeBrand(setActiveId);
  }, []);

  const active = getBrand(activeId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="glass-card group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 text-[12px] font-semibold text-[var(--ink-900)] transition-all hover:shadow-md"
      >
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: active.accent, color: active.accentInk }}
        >
          {active.initial}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-[var(--ink-500)]">
            System brand
          </span>
          <span>{active.name}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--ink-500)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="glass-card glass-card-strong absolute left-0 top-[calc(100%+8px)] z-40 w-[320px] rounded-2xl p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
            <div className="px-3 py-2">
              <p className="font-mono-num text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                Switch manufacturer
              </p>
            </div>
            <div className="space-y-0.5">
              {BRANDS.map(brand => {
                const isActive = brand.id === activeId;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      writeActiveBrand(brand.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive ? "bg-[var(--ink-50)]" : "hover:bg-[var(--ink-50)]"
                    }`}
                  >
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold shadow-sm"
                      style={{ background: brand.accent, color: brand.accentInk }}
                    >
                      {brand.initial}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-900)]">
                        {brand.name}
                        {!brand.hasCatalog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ink-100)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
                            <Sparkles className="h-2.5 w-2.5" />
                            Soon
                          </span>
                        )}
                      </span>
                      <span className="truncate text-[11px] text-[var(--ink-500)]">
                        {brand.tagline}
                      </span>
                    </span>
                    {isActive && <Check className="h-4 w-4 text-[var(--accent-500)]" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 border-t border-[var(--ink-100)] px-3 py-2">
              <p className="text-[10.5px] leading-relaxed text-[var(--ink-500)]">
                Project-level default. Override per wall in the boards table once enabled.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
