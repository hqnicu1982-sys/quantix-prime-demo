export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`flex h-8 w-8 items-center justify-center text-[10px] font-bold tracking-tight ${
            light ? "bg-accent text-white" : "bg-accent text-white"
          }`}
          style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
          aria-hidden
        >
          QP
        </div>
      </div>
      {!compact && (
        <span className={`text-base font-bold tracking-tight ${light ? "text-white" : "text-primary"}`}>
          Quantix Prime
        </span>
      )}
    </div>
  );
}
