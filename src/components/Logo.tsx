import logoAsset from "@/assets/fixmargin-logo.png.asset.json";

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden
        className="h-7 w-7 rounded-md bg-card object-contain shadow-sm"
      />
      {!compact && (
        <span className={`font-display text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-[var(--navy-900)]"}`}>
          Fix<span className={`italic font-normal ml-0.5 ${light ? "text-[var(--accent-100)]" : "text-[var(--accent-500)]"}`}>Margin</span>
        </span>
      )}
    </div>
  );
}
