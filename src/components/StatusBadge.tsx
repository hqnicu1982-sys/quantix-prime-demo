import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const toneStyles: Record<Tone, string> = {
  success: "bg-[var(--green-600)]/10 text-[var(--green-600)] border-[var(--green-600)]/20",
  warning: "bg-[var(--amber-500)]/10 text-[var(--amber-500)] border-[var(--amber-500)]/20",
  danger: "bg-[var(--red-500)]/10 text-[var(--red-500)] border-[var(--red-500)]/20",
  info: "bg-[var(--accent-500)]/10 text-[var(--accent-500)] border-[var(--accent-500)]/20",
  accent: "bg-[var(--accent-500)]/10 text-[var(--accent-500)] border-[var(--accent-500)]/20",
  neutral: "bg-[var(--ink-50)] text-[var(--ink-700)] border-[var(--ink-200)]",
};

const dotColor: Record<Tone, string> = {
  success: "bg-[var(--green-600)]",
  warning: "bg-[var(--amber-500)]",
  danger: "bg-[var(--red-500)]",
  info: "bg-[var(--accent-500)]",
  accent: "bg-[var(--accent-500)]",
  neutral: "bg-[var(--ink-500)]",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider border",
        toneStyles[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])} />}
      {children}
    </span>
  );
}
