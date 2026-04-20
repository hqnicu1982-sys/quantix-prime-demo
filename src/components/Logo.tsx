export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center text-[11px] font-bold ${
          light ? "bg-white text-primary" : "bg-primary text-primary-foreground"
        }`}
        style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
      >
        QP
      </div>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-primary"}`}>
        Quantix Prime
      </span>
    </div>
  );
}
