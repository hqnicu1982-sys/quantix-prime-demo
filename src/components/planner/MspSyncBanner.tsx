import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpToLine, CheckCircle2, RefreshCw, Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectTasks } from "@/lib/planner";
import {
  computePendingChanges,
  pushToMsp,
  summarizeChange,
  useMspBaseline,
} from "@/lib/mspBidirectionalSync";
import {
  formatRelative,
  recordIntegrationPush,
  useIntegrationConnection,
} from "@/lib/integrationConnections";

/**
 * Bidirectional sync banner — shows the live drift between the local planner
 * and the MSProject baseline, and lets the user push the deltas back. Hidden
 * when MSProject is not connected and no baseline exists for this project.
 */
export function MspSyncBanner({ projectId }: { projectId: string }) {
  const baseline = useMspBaseline(projectId);
  const tasks = useProjectTasks(projectId);
  const conn = useIntegrationConnection("msp");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const pending = useMemo(() => computePendingChanges(baseline, tasks), [baseline, tasks]);

  if (!baseline && !conn) return null;

  const inSync = pending.length === 0;
  const counts = {
    added: pending.filter((c) => c.kind === "added").length,
    updated: pending.filter((c) => c.kind === "updated").length,
    deleted: pending.filter((c) => c.kind === "deleted").length,
  };

  const push = async () => {
    if (!baseline || pending.length === 0) return;
    setBusy(true);
    try {
      const res = await pushToMsp(projectId, tasks, pending);
      if (conn) recordIntegrationPush("msp");
      toast.success("Modificările au fost trimise în MSProject", {
        description: `${res.added} adăugate · ${res.updated} actualizate · ${res.deleted} șterse`,
      });
      setExpanded(false);
    } catch (err) {
      toast.error("Push către MSProject a eșuat", {
        description: err instanceof Error ? err.message : "Reîncearcă mai târziu.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-[12px]",
        inSync
          ? "border-[var(--green-600)]/30 bg-[var(--green-600)]/5"
          : "border-[var(--amber-500)]/40 bg-[var(--amber-500)]/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {inSync ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--green-600)]" />
          ) : (
            <Wifi className="h-4 w-4 text-[var(--amber-500)]" />
          )}
          <span className="font-semibold text-[var(--ink-900)]">
            {inSync ? "Sincronizat cu MSProject" : "Modificări locale neîmpinse"}
          </span>
        </div>

        <span className="text-[11px] text-[var(--ink-500)]">
          Ultimul pull: {formatRelative(baseline?.syncedAt ?? conn?.lastSync)} ·
          Ultimul push: {formatRelative(conn?.lastPush)}
          {typeof conn?.pushes === "number" && ` · ${conn.pushes} push${conn.pushes === 1 ? "" : "es"}`}
        </span>

        {!inSync && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--amber-500)]/15 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">
            {pending.length} pending
            <span className="text-[var(--ink-500)]">
              ({counts.added}+ {counts.updated}~ {counts.deleted}–)
            </span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {!inSync && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide" : "Review"}
            </Button>
          )}
          <Button
            size="sm"
            disabled={inSync || busy || !baseline}
            onClick={push}
            title={!baseline ? "Pornește un import MSProject ca să activezi push-back-ul" : undefined}
          >
            {busy ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Push…
              </>
            ) : (
              <>
                <ArrowUpToLine className="mr-1.5 h-3.5 w-3.5" />
                Push to MSProject
              </>
            )}
          </Button>
        </div>
      </div>

      {expanded && pending.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-auto rounded border border-[var(--ink-200)] bg-white px-2 py-1.5 font-mono text-[11px] leading-relaxed text-[var(--ink-700)]">
          {pending.slice(0, 30).map((c, i) => (
            <li
              key={`${c.taskId}-${i}`}
              className={cn(
                c.kind === "added" && "text-[var(--green-600)]",
                c.kind === "deleted" && "text-[var(--red-500)]",
              )}
            >
              {summarizeChange(c)}
            </li>
          ))}
          {pending.length > 30 && (
            <li className="text-[var(--ink-500)]">… {pending.length - 30} more</li>
          )}
        </ul>
      )}
    </div>
  );
}