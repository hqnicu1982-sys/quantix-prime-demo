import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight text-[var(--ink-900)] md:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--ink-500)]">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[var(--ink-200)] bg-card transition-shadow hover:shadow-[0_2px_12px_rgba(15,40,71,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-[var(--ink-200)] px-5 py-4", className)}>
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight text-[var(--ink-900)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
  trend?: "up" | "down" | "flat";
}) {
  const toneColor = {
    success: "text-[var(--green-600)]",
    danger: "text-[var(--red-500)]",
    warning: "text-[var(--amber-500)]",
    info: "text-[var(--accent-500)]",
    neutral: "text-[var(--ink-500)]",
  }[tone];
  return (
    <Card className="p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className={cn("font-display mt-2 text-[28px] font-semibold leading-none tracking-tight", tone === "danger" ? "text-[var(--red-500)]" : "text-[var(--ink-900)]")}>{value}</p>
      {delta && (
        <p className={cn("mt-2 flex items-center gap-1 text-[12px] font-medium", toneColor)}>
          {trend === "up" && <span aria-hidden>▲</span>}
          {trend === "down" && <span aria-hidden>▼</span>}
          <span>{delta}</span>
        </p>
      )}
    </Card>
  );
}
