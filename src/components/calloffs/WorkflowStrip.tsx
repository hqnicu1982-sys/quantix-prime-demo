import { CALL_OFF_STEPS, stepIndex } from "@/lib/callOffWorkflow";
import type { CallOffState } from "@/lib/mockData";
import { Check, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual 7-step strip — current step highlighted, completed steps green,
 * pending steps muted. Used as the page header on every call-off screen
 * so users always see where the work sits in the lifecycle.
 */
export function WorkflowStrip({
  currentState,
  needsReview,
  compact = false,
}: {
  currentState: CallOffState;
  needsReview?: boolean;
  compact?: boolean;
}) {
  const idx = stepIndex(currentState);
  return (
    <div className="overflow-x-auto">
      <ol className={cn("flex min-w-[760px] items-stretch gap-1.5", compact && "min-w-[640px]")}>
        {CALL_OFF_STEPS.map((step, i) => {
          const done = i < idx;
          const current = i === idx;
          const flag = current && needsReview;
          return (
            <li key={step.id} className="flex flex-1 items-stretch">
              <div
                className={cn(
                  "flex flex-1 flex-col gap-0.5 rounded-md border px-3 py-2 text-[11.5px] transition-colors",
                  current && !flag && "border-[var(--accent-500)] bg-[var(--accent-500)]/10 ring-2 ring-[var(--accent-500)]/30",
                  current && flag && "border-[var(--amber-500)] bg-[var(--amber-500)]/10 ring-2 ring-[var(--amber-500)]/30",
                  done && "border-[var(--green-600)]/40 bg-[var(--green-600)]/5",
                  !done && !current && "border-[var(--ink-200)] bg-[var(--ink-50)] text-[var(--ink-500)]",
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {done && <Check className="h-3 w-3 text-[var(--green-600)]" />}
                  {flag && <AlertTriangle className="h-3 w-3 text-[var(--amber-500)]" />}
                  <span>{i + 1}. {step.label}</span>
                </div>
                {!compact && (
                  <p className="text-[10.5px] leading-snug opacity-80">{step.description}</p>
                )}
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider opacity-60">{step.actor}</p>
              </div>
              {i < CALL_OFF_STEPS.length - 1 && (
                <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 self-center text-[var(--ink-500)]" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}