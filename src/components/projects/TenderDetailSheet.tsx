import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtMoney, daysSince, type Project } from "@/lib/mockData";
import { getAssignedEstimator, getTenderScope } from "@/lib/tenderDetails";
import { FollowUpsCard } from "./FollowUpsCard";
import { isFollowUpOverdue } from "@/lib/projectLifecycle";
import {
  SendQuoteButton, MarkActiveDialog, MarkLostDialog, CloneTenderButton,
} from "./LifecycleActionDialogs";
import { ArrowUpRight, User, Calendar, Layers, Cog } from "lucide-react";

export function TenderDetailSheet({
  project, open, onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const est = getAssignedEstimator(project);
  const scope = getTenderScope(project);
  const overdue = isFollowUpOverdue(project);
  const quoteAge = daysSince(project.quoteSentDate);
  const responseIn = project.expectedResponseDate ? -(daysSince(project.expectedResponseDate) ?? 0) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="border-b border-[var(--ink-200)] px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            <StatusBadge tone={project.status === "tender" ? "info" : "warning"} dot>
              {project.status === "tender" ? "Tender" : "Awaiting"}
            </StatusBadge>
            {overdue && <StatusBadge tone="danger" dot>Follow-up overdue</StatusBadge>}
          </div>
          <SheetTitle className="font-display text-[22px] leading-tight tracking-tight">
            {project.name}
          </SheetTitle>
          <SheetDescription className="text-[12.5px]">
            {project.mainContractor} · {project.subtitle}
          </SheetDescription>
          <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-[var(--ink-500)]">Bid value</p>
              <p className="font-mono-num text-[15px] font-semibold text-[var(--ink-900)]">
                {fmtMoney(project.contractValue, { compact: true })}
              </p>
            </div>
            <div>
              <p className="text-[var(--ink-500)]">Quote sent</p>
              <p className="font-semibold text-[var(--ink-900)]">
                {project.quoteSentDate ?? "Not sent"}
                {quoteAge !== null && <span className="ml-1 text-[11px] text-[var(--ink-500)]">({quoteAge}d ago)</span>}
              </p>
            </div>
            {project.expectedResponseDate && (
              <div>
                <p className="text-[var(--ink-500)]">Response due</p>
                <p className="font-semibold text-[var(--ink-900)]">
                  {project.expectedResponseDate}
                  {responseIn !== null && (
                    <span className={"ml-1 text-[11px] " + (responseIn < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-500)]")}>
                      ({responseIn < 0 ? `${-responseIn}d late` : `in ${responseIn}d`})
                    </span>
                  )}
                </p>
              </div>
            )}
            {project.followUpReminderDate && (
              <div>
                <p className="text-[var(--ink-500)]">Next follow-up</p>
                <p className={"font-semibold " + (overdue ? "text-[var(--red-500)]" : "text-[var(--ink-900)]")}>
                  {project.followUpReminderDate}
                </p>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-5 px-5 py-4">
          {/* Estimator */}
          <section>
            <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Assigned estimator
            </h3>
            <div className="flex items-center gap-3 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/50 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-500)]/15 text-[13px] font-bold text-[var(--accent-500)]">
                {est.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{est.name}</p>
                <p className="truncate text-[11.5px] text-[var(--ink-500)]">{est.role} · {est.tier}</p>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--ink-500)]">
                <User className="inline h-3 w-3" /> owner
              </span>
            </div>
          </section>

          {/* Scope */}
          <section>
            <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Scope of works
            </h3>
            <p className="text-[13px] leading-relaxed text-[var(--ink-700)]">{scope.summary}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-500)]">
                  <Layers className="h-3 w-3" /> Areas
                </p>
                <ul className="space-y-1 text-[12.5px] text-[var(--ink-700)]">
                  {scope.areas.map((a) => <li key={a}>• {a}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-500)]">
                  <Cog className="h-3 w-3" /> Systems
                </p>
                <ul className="space-y-1 text-[12.5px] text-[var(--ink-700)]">
                  {scope.systems.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[12px] text-[var(--ink-500)]">
              <Calendar className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{scope.programme}</span>
            </p>
          </section>

          {/* Follow-up history */}
          <FollowUpsCard project={project} compact />
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 border-t border-[var(--ink-200)] bg-[var(--card)] px-5 py-3">
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
            {project.status === "tender" && <SendQuoteButton project={project} />}
            <MarkActiveDialog project={project} />
            <MarkLostDialog project={project} />
            <CloneTenderButton project={project} />
          </div>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--accent-500)] hover:underline"
          >
            Open project workspace <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}