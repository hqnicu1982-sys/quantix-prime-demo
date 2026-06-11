import { useState, type ReactNode } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

export type WizardStep = {
  id: string;
  label: string;
  render: () => ReactNode;
  /** Return false to disable Next. Defaults to true. */
  canAdvance?: () => boolean;
};

export type FormWizardProps = {
  title: string;
  subtitle?: string;
  workflowStrip?: ReactNode;
  steps: WizardStep[];
  submitLabel: string;
  onSubmit: () => void;
  canSubmit?: boolean;
  onCancel?: () => void;
};

export function FormWizard({
  title,
  subtitle,
  workflowStrip,
  steps,
  submitLabel,
  onSubmit,
  canSubmit = true,
  onCancel,
}: FormWizardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const canNext = current.canAdvance ? current.canAdvance() : true;
  const isLast = step === steps.length - 1;

  return (
    <div className="space-y-5">
      {workflowStrip && (
        <Card>
          <CardHead title="Where this lands in the workflow" />
          <div className="p-5">{workflowStrip}</div>
        </Card>
      )}

      <Card>
        <CardHead title={title} subtitle={subtitle} />

        <ol className="flex flex-wrap gap-2 border-b border-[var(--ink-200)] px-5 py-3 text-[11.5px]">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors",
                  i === step && "bg-[var(--accent-500)]/10 text-[var(--accent-500)] ring-1 ring-[var(--accent-500)]/40",
                  i < step && "bg-[var(--green-600)]/10 text-[var(--green-600)] hover:bg-[var(--green-600)]/20",
                  i > step && "text-[var(--ink-500)] cursor-not-allowed",
                )}
              >
                {i < step && <Check className="h-3 w-3" />}
                {i + 1} · {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-[var(--ink-500)]" />}
            </li>
          ))}
        </ol>

        <div className="space-y-4 p-5 text-[13px]">{current.render()}</div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-[var(--ink-200)] bg-card/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
          </div>
          {!isLast ? (
            <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" disabled={!canSubmit} onClick={onSubmit}>
              {submitLabel}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}