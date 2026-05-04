import * as React from "react";
import { useMemo, useState } from "react";
import {
  ChevronDown, Search, Sparkles, GitCompare, Check, Layers,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BrandSelector } from "@/components/calculator/BrandSelector";
import {
  SYSTEM_CATEGORIES,
  type SystemCategory,
  type SystemDef,
} from "@/lib/systemLibrary";
import { BOARD_LIBRARY, getAvailableBoards } from "@/lib/boardSizing";

/**
 * Sticky chip-style command bar for the calculator workbench.
 * Replaces the old mode toggle, CategoryTabs, system-code <select> and
 * board-size <select> with a single airy row of dropdowns + actions.
 */
export function CalcCommandBar({
  category, onCategoryChange,
  systems, activeCode, onSystemChange,
  availableBoards, boardSize, onBoardChange, recommendedBoard,
  compareOn, onToggleCompare,
  onOpenRecommend,
}: {
  category: SystemCategory;
  onCategoryChange: (c: SystemCategory) => void;
  systems: SystemDef[];
  activeCode: string;
  onSystemChange: (code: string) => void;
  availableBoards: ReturnType<typeof getAvailableBoards>;
  boardSize: string;
  onBoardChange: (label: string) => void;
  recommendedBoard: string;
  compareOn: boolean;
  onToggleCompare: () => void;
  onOpenRecommend: () => void;
}) {
  const activeSys = systems.find(s => s.code === activeCode) ?? systems[0];
  const activeCat = SYSTEM_CATEGORIES.find(c => c.id === category);

  return (
    <div className="sticky top-3 z-30">
      <div className="glass-card glass-card-strong flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {/* Brand */}
        <BrandSelector />

        <Divider />

        {/* Category */}
        <CategoryChip active={category} onChange={onCategoryChange} systems={systems} />

        <Divider />

        {/* System */}
        <SystemChip
          systems={systems}
          activeCode={activeCode}
          onChange={onSystemChange}
          activeSys={activeSys}
          activeCatLabel={activeCat?.label ?? ""}
        />

        <Divider />

        {/* Board */}
        <BoardChip
          boards={availableBoards}
          value={boardSize}
          onChange={onBoardChange}
          recommended={recommendedBoard}
        />

        {/* Spacer + actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenRecommend}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--ink-700)] transition-all hover:border-[var(--accent-500)]/50 hover:text-[var(--ink-900)]"
            title="Match a system to your performance requirements"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-500)]" /> Recommend
          </button>
          <button
            type="button"
            onClick={onToggleCompare}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all " +
              (compareOn
                ? "bg-[var(--ink-900)] text-white shadow-sm"
                : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:border-[var(--accent-500)]/50 hover:text-[var(--ink-900)]")
            }
            title={compareOn ? "Exit compare mode" : "Compare two systems side by side"}
          >
            <GitCompare className="h-3.5 w-3.5" /> {compareOn ? "Exit compare" : "Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── chips ─────────────────────────────

function Divider() {
  return <span aria-hidden className="hidden h-5 w-px bg-[var(--ink-200)]/70 md:inline-block" />;
}

function ChipShell({
  open, setOpen, label, value, sublabel,
}: {
  open: boolean; setOpen: (b: boolean) => void;
  label: string; value: React.ReactNode; sublabel?: string;
}) {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-left transition-all hover:bg-[var(--ink-50)]/60 data-[state=open]:bg-[var(--ink-50)]/80"
        aria-expanded={open}
      >
        <span className="flex flex-col leading-tight">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">
            {label}
          </span>
          <span className="font-mono-num text-[12.5px] font-semibold text-[var(--ink-900)]">
            {value}
            {sublabel && (
              <span className="ml-1.5 text-[10.5px] font-normal text-[var(--ink-500)]">
                {sublabel}
              </span>
            )}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--ink-500)] transition-transform group-data-[state=open]:rotate-180" />
      </button>
    </PopoverTrigger>
  );
}

function CategoryChip({
  active, onChange, systems,
}: {
  active: SystemCategory;
  onChange: (c: SystemCategory) => void;
  systems: SystemDef[];
}) {
  const [open, setOpen] = useState(false);
  const counts = useMemo(() => {
    // Counts come from the *full* library (passed via systems is already
    // filtered) — but for the chip badge we want totals across all categories.
    // So consumer passes the unfiltered list as `systems` here? Cleaner: count
    // by category using SYSTEM_CATEGORIES known IDs from the library passed in.
    const map = new Map<SystemCategory, number>();
    for (const s of systems) map.set(s.category, (map.get(s.category) ?? 0) + 1);
    return map;
  }, [systems]);
  const activeCat = SYSTEM_CATEGORIES.find(c => c.id === active);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ChipShell open={open} setOpen={setOpen} label="Category" value={activeCat?.label ?? "—"} />
      <PopoverContent align="start" className="w-72 p-2">
        <div className="grid gap-0.5">
          {SYSTEM_CATEGORIES.map(c => {
            const isActive = c.id === active;
            const n = counts.get(c.id) ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); }}
                className={
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors " +
                  (isActive ? "bg-[var(--ink-900)] text-white" : "hover:bg-[var(--ink-50)]")
                }
              >
                <span className="flex flex-col leading-tight">
                  <span className="text-[12.5px] font-semibold">{c.label}</span>
                  <span className={"text-[10.5px] " + (isActive ? "text-white/70" : "text-[var(--ink-500)]")}>
                    {c.blurb}
                  </span>
                </span>
                <span className={
                  "font-mono-num shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                  (isActive ? "bg-white/15 text-white" : "bg-[var(--ink-100)] text-[var(--ink-500)]")
                }>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SystemChip({
  systems, activeCode, onChange, activeSys, activeCatLabel,
}: {
  systems: SystemDef[];
  activeCode: string;
  onChange: (code: string) => void;
  activeSys: SystemDef | undefined;
  activeCatLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return systems;
    return systems.filter(s =>
      s.code.toLowerCase().includes(needle) ||
      s.shortName.toLowerCase().includes(needle),
    );
  }, [systems, q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ChipShell
        open={open}
        setOpen={setOpen}
        label="System"
        value={activeSys?.code ?? "—"}
        sublabel={activeSys?.shortName}
      />
      <PopoverContent align="start" className="w-[420px] p-0">
        <div className="border-b border-[var(--ink-200)] p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-500)]" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={`Search ${activeCatLabel.toLowerCase()}…`}
              className="glass-input w-full rounded-md py-1.5 pl-8 pr-2 text-[12.5px]"
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-[12px] text-[var(--ink-500)]">No systems match.</p>
          )}
          {filtered.map(s => {
            const isActive = s.code === activeCode;
            const isBespoke = s.code.startsWith("BSP-");
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => { onChange(s.code); setOpen(false); }}
                className={
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors " +
                  (isActive ? "bg-[var(--accent-500)]/10" : "hover:bg-[var(--ink-50)]")
                }
              >
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono-num text-[12.5px] font-semibold text-[var(--ink-900)]">
                      {isBespoke ? "🛠 " : ""}{s.code}
                    </span>
                    {isBespoke && (
                      <span className="rounded-full bg-[var(--accent-500)]/15 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
                        Bespoke
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[11.5px] text-[var(--ink-500)]">{s.shortName}</span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BoardChip({
  boards, value, onChange, recommended,
}: {
  boards: ReturnType<typeof getAvailableBoards>;
  value: string;
  onChange: (label: string) => void;
  recommended: string;
}) {
  const [open, setOpen] = useState(false);
  const display = value === "auto" ? `Auto · ${recommended}` : value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ChipShell open={open} setOpen={setOpen} label="Board" value={display} />
      <PopoverContent align="start" className="w-72 p-2">
        <div className="grid gap-0.5">
          <button
            type="button"
            onClick={() => { onChange("auto"); setOpen(false); }}
            className={
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors " +
              (value === "auto" ? "bg-[var(--ink-900)] text-white" : "hover:bg-[var(--ink-50)]")
            }
          >
            <span className="flex flex-col leading-tight">
              <span className="text-[12.5px] font-semibold">Auto</span>
              <span className={"text-[10.5px] " + (value === "auto" ? "text-white/70" : "text-[var(--ink-500)]")}>
                Pick the smallest board ≥ wall height
              </span>
            </span>
            <span className={"font-mono-num text-[10.5px] " + (value === "auto" ? "text-white/80" : "text-[var(--ink-500)]")}>
              {recommended}
            </span>
          </button>
          <div className="my-1 border-t border-[var(--ink-200)]/70" />
          {boards.map(b => {
            const isActive = value === b.label;
            return (
              <button
                key={b.label}
                type="button"
                onClick={() => { onChange(b.label); setOpen(false); }}
                className={
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors " +
                  (isActive ? "bg-[var(--accent-500)]/10 text-[var(--ink-900)]" : "hover:bg-[var(--ink-50)]")
                }
              >
                <span className="font-mono-num text-[12.5px] font-semibold">{b.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-[var(--accent-500)]" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}