export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-500)] text-[10px] font-bold tracking-tight text-white shadow-sm"
        aria-hidden
      >
        QP
      </div>
      {!compact && (
        <span className={`font-display text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-[var(--navy-900)]"}`}>
          Quantix<span className={`italic font-normal ml-1 ${light ? "text-[var(--accent-100)]" : "text-[var(--accent-500)]"}`}>Prime</span>
        </span>
      )}
    </div>
  );
}
