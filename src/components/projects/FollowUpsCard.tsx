import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogFollowUpDialog } from "./LogFollowUpDialog";
import {
  getFollowUpHistory, useManualFollowUps, deleteFollowUp,
  FOLLOW_UP_OUTCOMES, type ManualFollowUp,
} from "@/lib/tenderDetails";
import type { Project } from "@/lib/mockData";
import {
  Mail, Phone, Users, Cog, MoreHorizontal, Plus, Pencil, Trash2, BellRing,
} from "lucide-react";
import { toast } from "sonner";

function ChannelIcon({ c }: { c: "email" | "call" | "meeting" | "system" }) {
  const cls = "h-3.5 w-3.5";
  if (c === "email") return <Mail className={cls} />;
  if (c === "call") return <Phone className={cls} />;
  if (c === "meeting") return <Users className={cls} />;
  return <Cog className={cls} />;
}

export function FollowUpsCard({
  project, compact = false, title = "Follow-up history",
}: {
  project: Project;
  compact?: boolean;
  title?: string;
}) {
  const manual = useManualFollowUps(project.id);
  const history = getFollowUpHistory(project);
  const manualById = new Map(manual.map((r) => [r.id, r]));

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ManualFollowUp | null>(null);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className={
          compact
            ? "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
            : "text-[13px] font-semibold text-[var(--ink-900)]"
        }>
          {title}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-[11.5px]"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3 w-3" /> Log follow-up
        </Button>
      </div>

      {history.length === 0 ? (
        <p className="rounded border border-dashed border-[var(--ink-200)] px-3 py-6 text-center text-[12px] text-[var(--ink-500)]">
          No follow-ups yet — log the first one to start the timeline.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-[var(--ink-200)] pl-4">
          {history.map((e) => {
            const editable = e.manual && manualById.has(e.id);
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-[var(--ink-200)] bg-[var(--card)] text-[var(--ink-500)]">
                  <ChannelIcon c={e.channel} />
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[var(--ink-900)]">
                    {e.by}
                    {e.manual && (
                      <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1 py-0.5 text-[10px] font-medium text-[var(--accent-500)]">
                        logged
                      </span>
                    )}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <p className="text-[11px] text-[var(--ink-500)]">{e.daysAgo}d ago · {e.date}</p>
                    {editable && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Follow-up actions"
                            className="rounded p-1 text-[var(--ink-500)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)]"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onSelect={() => setEditing(manualById.get(e.id)!)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[var(--red-500)] focus:text-[var(--red-500)]"
                            onSelect={() => {
                              if (deleteFollowUp(e.id)) toast("Follow-up deleted");
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--ink-700)]">{e.note}</p>
                {(e.outcome || e.nextReminderDate) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-500)]">
                    {e.outcome && (
                      <span>
                        Outcome: <span className="font-medium text-[var(--ink-700)]">
                          {FOLLOW_UP_OUTCOMES.find((o) => o.code === e.outcome)?.label ?? e.outcome}
                        </span>
                      </span>
                    )}
                    {e.nextReminderDate && (
                      <span className="inline-flex items-center gap-1">
                        <BellRing className="h-3 w-3" />
                        Next: <span className="font-medium text-[var(--ink-700)]">{e.nextReminderDate}</span>
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <LogFollowUpDialog
        project={project}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <LogFollowUpDialog
        project={project}
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        existing={editing ?? undefined}
      />
    </section>
  );
}