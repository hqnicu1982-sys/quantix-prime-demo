import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { GitCompare, X, ArrowRight } from "lucide-react";
import { readSlots, setSlot, clearTray, subscribe, type CompareSlots } from "@/lib/compareTray";

export function CompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const [slots, setSlots] = useState<CompareSlots>({ A: null, B: null });

  useEffect(() => {
    setSlots(readSlots());
    return subscribe(() => setSlots(readSlots()));
  }, []);

  const count = (slots.A ? 1 : 0) + (slots.B ? 1 : 0);
  if (count === 0) return null;

  // Hide on the calculator route — the Compare view itself is the destination.
  if (location.pathname === "/calculator") return null;

  const ready = slots.A && slots.B;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 lg:bottom-6">
      <div className="glass-card glass-card-strong flex items-center gap-3 rounded-2xl border border-[var(--accent-500)]/30 px-4 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
          <GitCompare className="h-3.5 w-3.5 text-[var(--accent-500)]" />
          Compare tray
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Slot side="A" code={slots.A} onClear={() => setSlot("A", null)} />
          <span className="text-[11px] font-semibold text-[var(--ink-500)]">vs</span>
          <Slot side="B" code={slots.B} onClear={() => setSlot("B", null)} />
        </div>

        <button
          onClick={() => clearTray()}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--ink-500)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)]"
        >
          Clear
        </button>
        <button
          disabled={!ready}
          onClick={() => navigate({ to: "/calculator", search: { mode: "compare" } as never })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-500)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Slot({ side, code, onClear }: { side: "A" | "B"; code: string | null; onClear: () => void }) {
  const accent = side === "A" ? "var(--accent-500)" : "var(--teal-500)";
  if (!code) {
    return (
      <div
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-[var(--ink-200)] px-2.5 py-1.5 text-[11.5px] text-[var(--ink-500)]"
      >
        <span
          className="font-mono-num inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ background: accent }}
        >{side}</span>
        Pick a system
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[var(--ink-50)] px-2.5 py-1.5">
      <span
        className="font-mono-num inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ background: accent }}
      >{side}</span>
      <span className="font-mono-num truncate text-[11.5px] font-semibold text-[var(--ink-900)]">{code}</span>
      <button
        onClick={onClear}
        className="ml-auto rounded p-0.5 text-[var(--ink-500)] hover:bg-[var(--card)] hover:text-[var(--ink-900)]"
        aria-label={`Remove ${side}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}