import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtMoney, daysSince, type Project } from "@/lib/mockData";
import {
  getAssignedEstimator, getTenderScope, getFollowUpHistory,
  logFollowUp, useManualFollowUps, FOLLOW_UP_OUTCOMES,
  type FollowUpOutcome,
} from "@/lib/tenderDetails";
import { useCurrentUser } from "@/lib/currentUser";
import { isFollowUpOverdue } from "@/lib/projectLifecycle";
import {
  SendQuoteButton, MarkActiveDialog, MarkLostDialog, CloneTenderButton,
} from "./LifecycleActionDialogs";
import {
  Mail, Phone, Users, Cog, ArrowUpRight, User, Calendar, Layers, Plus,
} from "lucide-react";

function ChannelIcon({ c }: { c: "email" | "call" | "meeting" | "system" }) {
  const cls = "h-3.5 w-3.5";
  if (c === "email") return <Mail className={cls} />;
  if (c === "call") return <Phone className={cls} />;
  if (c === "meeting") return <Users className={cls} />;
  return <Cog className={cls} />;
}

export function TenderDetailSheet({
  project, open, onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const est = getAssignedEstimator(project);
  const scope = getTenderScope(project);
  // Subscribe to manual follow-ups so history re-renders on new entries.
  useManualFollowUps(project.id);
  const history = getFollowUpHistory(project);
  const overdue = isFollowUpOverdue(project);
  const quoteAge = daysSince(project.quoteSentDate);
  const responseIn = project.expectedResponseDate ? -(daysSince(project.expectedResponseDate) ?? 0) : null;
  const [logOpen, setLogOpen] = useState(false);

  return (
    <>
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
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                Follow-up history
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-[11.5px]"
                onClick={() => setLogOpen(true)}
              >
                <Plus className="h-3 w-3" /> Log follow-up
              </Button>
            </div>
            <ol className="relative space-y-3 border-l border-[var(--ink-200)] pl-4">
              {history.map((e, i) => (
                <li key={i} className="relative">
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
                    <p className="shrink-0 text-[11px] text-[var(--ink-500)]">{e.daysAgo}d ago · {e.date}</p>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--ink-700)]">{e.note}</p>
                  {e.outcome && (
                    <p className="mt-1 text-[11px] text-[var(--ink-500)]">
                      Outcome: <span className="font-medium text-[var(--ink-700)]">
                        {FOLLOW_UP_OUTCOMES.find((o) => o.code === e.outcome)?.label ?? e.outcome}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
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

    <LogFollowUpDialog
      projectId={project.id}
      open={logOpen}
      onOpenChange={setLogOpen}
    />
    </>
  );
}

// Wrap return so we can render the dialog as a sibling of Sheet.
// The Sheet root above must now share a fragment with the dialog below.

function LogFollowUpDialog({
  projectId, open, onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const [channel, setChannel] = useState<"email" | "call" | "meeting">("email");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<FollowUpOutcome | "">("no-response");
  const canSave = note.trim().length > 0 && date;

  function reset() {
    setChannel("email");
    setDate(today);
    setNote("");
    setOutcome("no-response");
  }
  function handleSave() {
    if (!canSave) return;
    // Use noon so localised display matches the chosen date across TZs.
    const iso = new Date(`${date}T12:00:00`).toISOString();
    logFollowUp({
      projectId,
      isoDate: iso,
      channel,
      by: me.name,
      note: note.trim(),
      outcome: outcome || undefined,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log follow-up</DialogTitle>
          <DialogDescription>
            Record an email, call or meeting. Added to the tender history immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fu-channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger id="fu-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fu-date">Date</Label>
              <Input
                id="fu-date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fu-outcome">Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as FollowUpOutcome)}>
              <SelectTrigger id="fu-outcome"><SelectValue placeholder="Select outcome" /></SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_OUTCOMES.map((o) => (
                  <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fu-note">Notes</Label>
            <Textarea
              id="fu-note"
              placeholder="e.g. Spoke with James, said pricing review by Friday."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>Save follow-up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}