import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WallInput } from "@/lib/boardSizing";
import {
  BRANDS,
  getBrand,
  readActiveBrand,
  subscribeBrand,
  type BrandId,
} from "@/lib/systemBrands";

export function WallEditor({
  walls,
  onChange,
}: {
  walls: WallInput[];
  onChange: (next: WallInput[]) => void;
}) {
  const [projectBrand, setProjectBrand] = useState<BrandId>("british-gypsum");
  useEffect(() => {
    setProjectBrand(readActiveBrand());
    return subscribeBrand(setProjectBrand);
  }, []);

  const update = (id: string, patch: Partial<WallInput>) =>
    onChange(walls.map(w => (w.id === id ? { ...w, ...patch } : w)));

  const remove = (id: string) => {
    if (walls.length <= 1) return;
    onChange(walls.filter(w => w.id !== id));
  };

  const add = () => {
    const n = walls.length + 1;
    onChange([
      ...walls,
      {
        id: `w-${Date.now()}`,
        name: `Wall ${n}`,
        heightMm: walls[walls.length - 1]?.heightMm ?? 3000,
        lengthMm: 5000,
        openingsM2: 0,
      },
    ]);
  };

  return (
    <div className="space-y-2">
      <div className="overflow-visible rounded-xl border border-[var(--ink-200)]">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[var(--ink-100)]/50 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-right font-semibold">Length (m)</th>
              <th className="px-3 py-2 text-right font-semibold">Height (m)</th>
              <th className="px-3 py-2 text-right font-semibold">Openings (m²)</th>
              <th className="px-3 py-2 text-right font-semibold">Net area</th>
              <th className="px-3 py-2 text-left font-semibold">System</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {walls.map(w => {
              const net = Math.max(0, (w.heightMm * w.lengthMm) / 1_000_000 - (w.openingsM2 ?? 0));
              return (
                <tr key={w.id} className="border-t border-[var(--ink-200)]">
                  <td className="px-2 py-1.5">
                    <input
                      value={w.name}
                      onChange={e => update(w.id, { name: e.target.value })}
                      className="glass-input w-full rounded-md px-2 py-1 text-[12.5px] font-medium"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={(w.lengthMm / 1000).toString()}
                      onChange={e => update(w.id, { lengthMm: Math.round((+e.target.value || 0) * 1000) })}
                      className="glass-input font-mono-num w-full rounded-md px-2 py-1 text-right text-[12.5px]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={(w.heightMm / 1000).toString()}
                      onChange={e => update(w.id, { heightMm: Math.round((+e.target.value || 0) * 1000) })}
                      className="glass-input font-mono-num w-full rounded-md px-2 py-1 text-right text-[12.5px]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={w.openingsM2 ?? 0}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const v = e.target.value;
                        update(w.id, { openingsM2: v === "" ? 0 : Math.max(0, +v) });
                      }}
                      className="glass-input font-mono-num w-full rounded-md px-2 py-1 text-right text-[12.5px]"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono-num text-[12px] tabular-nums text-[var(--ink-700)]">
                    {net.toFixed(1)} m²
                  </td>
                  <td className="px-2 py-1.5">
                    <BrandOverrideChip
                      projectBrand={projectBrand}
                      override={w.brandOverride as BrandId | undefined}
                      onChange={(next) =>
                        update(w.id, { brandOverride: next ?? undefined })
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => remove(w.id)}
                      disabled={walls.length <= 1}
                      className="rounded-md p-1 text-[var(--ink-500)] hover:bg-[var(--tier-critical)]/10 hover:text-[var(--tier-critical)] disabled:cursor-not-allowed disabled:opacity-30"
                      title="Remove wall"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Add wall
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrandOverrideChip — small pill per wall row.
//   - "Project" (neutral) when no override.
//   - Initial + brand name (with brand accent) when overridden.
//   - Click opens a popover to switch or clear.
// Visual only — does not yet affect cost calculations.
// ---------------------------------------------------------------------------
function BrandOverrideChip({
  projectBrand,
  override,
  onChange,
}: {
  projectBrand: BrandId;
  override: BrandId | undefined;
  onChange: (next: BrandId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const effectiveBrand = override ? getBrand(override) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-[var(--card)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--ink-700)] transition-colors hover:border-[var(--accent-500)]/40 hover:text-[var(--ink-900)]"
        title={override ? `Overridden: ${effectiveBrand?.name}` : "Using project default"}
      >
        {effectiveBrand ? (
          <>
            <span
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
              style={{ background: effectiveBrand.accent, color: effectiveBrand.accentInk }}
            >
              {effectiveBrand.initial}
            </span>
            <span style={{ color: effectiveBrand.accent }} className="font-semibold">
              {effectiveBrand.name}
            </span>
          </>
        ) : (
          <>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink-300)]" />
            <span>Project default</span>
          </>
        )}
      </button>

      {open && (
        <div className="glass-card glass-card-strong absolute right-0 top-[calc(100%+6px)] z-50 w-[260px] rounded-xl p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
          <div className="px-2.5 py-1.5">
            <p className="font-mono-num text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              Per-wall system
            </p>
          </div>

          {/* Reset to project default */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors ${
              !override ? "bg-[var(--ink-50)]" : "hover:bg-[var(--ink-50)]"
            }`}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--ink-300)] text-[var(--ink-500)]">
              <X className="h-3 w-3" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-semibold text-[var(--ink-900)]">Project default</span>
              <span className="text-[10.5px] text-[var(--ink-500)]">
                Currently {getBrand(projectBrand).name}
              </span>
            </span>
            {!override && <Check className="h-3.5 w-3.5 text-[var(--accent-500)]" />}
          </button>

          <div className="my-1 h-px bg-[var(--ink-100)]" />

          {BRANDS.map(brand => {
            const isActive = override === brand.id;
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => {
                  onChange(brand.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors ${
                  isActive ? "bg-[var(--ink-50)]" : "hover:bg-[var(--ink-50)]"
                }`}
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: brand.accent, color: brand.accentInk }}
                >
                  {brand.initial}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--ink-900)]">
                    {brand.name}
                    {!brand.hasCatalog && (
                      <span className="rounded-full bg-[var(--ink-100)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
                        Soon
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[10.5px] text-[var(--ink-500)]">{brand.tagline}</span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5 text-[var(--accent-500)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
