import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WallInput } from "@/lib/boardSizing";

export function WallEditor({
  walls,
  onChange,
}: {
  walls: WallInput[];
  onChange: (next: WallInput[]) => void;
}) {
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
      <div className="overflow-hidden rounded-xl border border-[var(--ink-200)]">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[var(--ink-100)]/50 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-right font-semibold">Length (m)</th>
              <th className="px-3 py-2 text-right font-semibold">Height (m)</th>
              <th className="px-3 py-2 text-right font-semibold">Openings (m²)</th>
              <th className="px-3 py-2 text-right font-semibold">Net area</th>
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
                      value={(w.openingsM2 ?? 0).toString()}
                      onChange={e => update(w.id, { openingsM2: Math.max(0, +e.target.value || 0) })}
                      className="glass-input font-mono-num w-full rounded-md px-2 py-1 text-right text-[12.5px]"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono-num text-[12px] tabular-nums text-[var(--ink-700)]">
                    {net.toFixed(1)} m²
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
