import { useMemo, useState } from "react";
import { PackagePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectTasks } from "@/lib/planner";
import { useProjectData } from "@/lib/projectData";
import { proposeCallOffs } from "@/lib/callOffPlanning";
import { useCallOffSettings } from "@/lib/callOffSettings";
import { AutoCallOffSettingsDialog } from "./AutoCallOffSettingsDialog";
import { AutoCallOffReviewDialog } from "./AutoCallOffReviewDialog";

const DISMISS_KEY = (pid: string) => `qp-auto-calloff-dismissed-${pid}`;

/**
 * Quietly watches the planner + BoQ + existing call-offs. When tasks have
 * material needs that aren't covered yet, surfaces a one-click review dialog
 * that creates draft call-offs in bulk. User confirms every batch — nothing
 * is sent automatically.
 */
export function AutoCallOffBanner({ projectId }: { projectId: string }) {
  const tasks = useProjectTasks(projectId);
  const project = useProjectData(projectId);
  const settings = useCallOffSettings(projectId);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(DISMISS_KEY(projectId)) ?? "",
  );

  const proposals = useMemo(
    () =>
      proposeCallOffs(
        tasks,
        project.boqLines,
        project.callOffs,
        project.supplierChoices,
        {
          defaultLeadDays: settings.defaultLeadDays,
          bufferDays: settings.bufferDays,
          coalesceWindowDays: settings.coalesceWindowDays,
          urgencyImminentDays: settings.urgencyImminentDays,
          minBatchQty: settings.minBatchQty,
          perMaterialLeadDays: settings.perMaterialLeadDays,
        },
      ),
    [tasks, project.boqLines, project.callOffs, project.supplierChoices, settings],
  );

  // Hash used to invalidate a previous "dismiss" once new needs appear.
  const sig = useMemo(
    () => proposals.map((p) => p.key).sort().join("|"),
    [proposals],
  );

  // Still mount the gear button when there are no proposals so the user can
  // tune rules proactively.
  if (proposals.length === 0) {
    return (
      <div className="flex items-center justify-end">
        <AutoCallOffSettingsDialog projectId={projectId} />
      </div>
    );
  }
  if (dismissed === sig) {
    return (
      <div className="flex items-center justify-end">
        <AutoCallOffSettingsDialog projectId={projectId} />
      </div>
    );
  }

  const urgent = proposals.filter((p) => p.urgency !== "ok").length;
  const tone = urgent > 0
    ? "border-[var(--amber-500)]/40 bg-[var(--amber-500)]/5"
    : "border-[var(--accent-500)]/40 bg-[var(--accent-500)]/5";

  const dismiss = () => {
    setDismissed(sig);
    if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY(projectId), sig);
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-[12px]", tone)}>
        <Sparkles className="h-4 w-4 text-[var(--accent-500)]" />
        <div className="min-w-0">
          <p className="font-semibold text-[var(--ink-900)]">
            {proposals.length} call-off{proposals.length === 1 ? "" : "s"} suggested from the programme
          </p>
          <p className="text-[11px] text-[var(--ink-500)]">
            {urgent > 0
              ? `${urgent} need attention now to meet on-site dates · review and confirm before they're created.`
              : "Tasks have material needs not yet covered · review and confirm to create drafts."}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <AutoCallOffSettingsDialog projectId={projectId} />
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={dismiss}>
            Dismiss
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <PackagePlus className="mr-1.5 h-3.5 w-3.5" /> Review proposals
          </Button>
        </div>
      </div>

      <AutoCallOffReviewDialog
        projectId={projectId}
        proposals={proposals}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}