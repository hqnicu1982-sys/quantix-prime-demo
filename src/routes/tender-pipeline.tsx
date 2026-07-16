import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { useProject } from "@/lib/ProjectContext";
import { fmtMoney, daysSince, type Project } from "@/lib/mockData";
import { groupByStatus, isFollowUpOverdue } from "@/lib/projectLifecycle";
import { SendQuoteButton, MarkActiveDialog, MarkLostDialog, CloneTenderButton } from "@/components/projects/LifecycleActionDialogs";
import { TenderDetailSheet } from "@/components/projects/TenderDetailSheet";
import { useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Clock, Flame } from "lucide-react";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

/** Days past the follow-up reminder (or past 14d from quote sent). 0 if not overdue. */
function daysOverdue(p: Project): number {
  if (p.status !== "awaiting") return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parse = (s?: string) => {
    if (!s) return null;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
  };
  const rem = parse(p.followUpReminderDate);
  if (rem) {
    const d = Math.floor((today.getTime() - rem.getTime()) / 86400000);
    if (d >= 0) return d;
  }
  const sent = parse(p.quoteSentDate);
  if (sent) {
    const d = Math.floor((today.getTime() - sent.getTime()) / 86400000);
    if (d > 14) return d - 14;
  }
  return 0;
}

export const Route = createFileRoute("/tender-pipeline")({ component: GuardedTenderPipeline });

function GuardedTenderPipeline() {
  const allowed = useCan("view.tenderPipeline");
  if (!allowed) return <NoAccess cap="view.tenderPipeline" title="Tender Pipeline restricted" />;
  return <TenderPipeline />;
}

type ValueBand = "all" | "sub500" | "500to1m" | "1to2m" | "over2m";
const BANDS: { id: ValueBand; label: string; test: (v: number) => boolean }[] = [
  { id: "all", label: "All values", test: () => true },
  { id: "sub500", label: "Under £500k", test: (v) => v < 500000 },
  { id: "500to1m", label: "£500k – £1m", test: (v) => v >= 500000 && v < 1000000 },
  { id: "1to2m", label: "£1m – £2m", test: (v) => v >= 1000000 && v < 2000000 },
  { id: "over2m", label: "Over £2m", test: (v) => v >= 2000000 },
];

function TenderPipeline() {
  const { all } = useProject();
  const grouped = useMemo(() => groupByStatus(all), [all]);

  const tenders = grouped.tender;
  const awaiting = grouped.awaiting;
  const decided = [...grouped.active, ...grouped.lost, ...grouped.complete];
  const won = grouped.active.length + grouped.complete.length;
  const winRate = decided.length ? Math.round((won / decided.length) * 100) : 0;
  const pipelineValue = [...tenders, ...awaiting].reduce((s, p) => s + p.contractValue, 0);

  // Avg days from quote sent → decision (use lostDate/startDate as decision proxies)
  const decisionAges: number[] = [];
  for (const p of decided) {
    const sent = daysSince(p.quoteSentDate);
    const decision = daysSince(p.lostDate ?? p.startDate);
    if (sent !== null && decision !== null && sent >= decision) decisionAges.push(sent - decision);
  }
  const avgDecisionDays = decisionAges.length
    ? Math.round(decisionAges.reduce((a, b) => a + b, 0) / decisionAges.length)
    : null;

  // Filters
  const contractors = useMemo(() => {
    const set = new Set<string>();
    for (const p of [...tenders, ...awaiting]) set.add(p.mainContractor);
    return ["all", ...Array.from(set).sort()];
  }, [tenders, awaiting]);
  const [contractor, setContractor] = useState<string>("all");
  const [band, setBand] = useState<ValueBand>("all");
  const bandTest = BANDS.find((b) => b.id === band)!.test;
  const applies = (p: Project) =>
    (contractor === "all" || p.mainContractor === contractor) && bandTest(p.contractValue);
  const fTenders = tenders.filter(applies);
  const fAwaiting = awaiting.filter(applies);

  // Contractor volume + win rate table
  const contractorStats = useMemo(() => {
    const map = new Map<string, { tenders: number; awaiting: number; won: number; lost: number; value: number }>();
    for (const p of all) {
      if (!p.status || p.status === "active" && !p.quoteSentDate) continue;
      const row = map.get(p.mainContractor) ?? { tenders: 0, awaiting: 0, won: 0, lost: 0, value: 0 };
      if (p.status === "tender") row.tenders++;
      if (p.status === "awaiting") row.awaiting++;
      if (p.status === "active" || p.status === "complete") row.won++;
      if (p.status === "lost") row.lost++;
      row.value += p.contractValue;
      map.set(p.mainContractor, row);
    }
    return Array.from(map.entries())
      .map(([name, r]) => {
        const decided = r.won + r.lost;
        const rate = decided ? Math.round((r.won / decided) * 100) : null;
        return { name, ...r, decided, rate };
      })
      .sort((a, b) => (b.tenders + b.awaiting + b.decided) - (a.tenders + a.awaiting + a.decided))
      .slice(0, 6);
  }, [all]);

  return (
    <Section
      title="Tender Pipeline"
      subtitle="Estimator view — every live opportunity in flight, awaiting decision, and won or lost"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Pipeline value" value={fmtMoney(pipelineValue, { compact: true })} delta={`${tenders.length + awaiting.length} live bids`} tone="info" />
        <Kpi label="Win rate" value={`${winRate}%`} delta={`${won} won of ${decided.length} decided`} tone={winRate >= 50 ? "success" : winRate >= 30 ? "warning" : "danger"} />
        <Kpi label="Avg time to decision" value={avgDecisionDays !== null ? `${avgDecisionDays}d` : "—"} delta="quote sent → decision" />
        <Kpi label="By stage" value={`${tenders.length} · ${awaiting.length} · ${grouped.lost.length}`} delta="Tender · Awaiting · Lost" />
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <span className="font-semibold text-[var(--ink-500)] uppercase tracking-wider text-[10.5px]">Filters</span>
          <select value={contractor} onChange={(e) => setContractor(e.target.value)} className="rounded-md border border-[var(--ink-200)] bg-transparent px-2.5 py-1.5">
            {contractors.map((c) => <option key={c} value={c}>{c === "all" ? "All contractors" : c}</option>)}
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value as ValueBand)} className="rounded-md border border-[var(--ink-200)] bg-transparent px-2.5 py-1.5">
            {BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          {(contractor !== "all" || band !== "all") && (
            <button onClick={() => { setContractor("all"); setBand("all"); }} className="text-[var(--accent-500)] hover:underline">Clear</button>
          )}
          <span className="ml-auto text-[var(--ink-500)]">{fTenders.length + fAwaiting.length} shown</span>
        </div>
      </Card>

      {/* Kanban-lite: horizontal snap-swipe on mobile, side-by-side on desktop */}
      <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-3 px-3 pb-2 sm:mx-0 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid lg:grid-cols-2">
        <div className="min-w-[88%] shrink-0 snap-center sm:min-w-0 sm:flex-1 lg:min-w-0">
          <PipelineColumn
            title="Tender"
            subtitle="Pricing / quote not yet sent"
            tone="info"
            count={fTenders.length}
            value={fTenders.reduce((s, p) => s + p.contractValue, 0)}
            items={fTenders}
          />
        </div>
        <div className="min-w-[88%] shrink-0 snap-center sm:min-w-0 sm:flex-1 lg:min-w-0">
          <PipelineColumn
            title="Awaiting decision"
            subtitle="Quote sent · chasing feedback"
            tone="warning"
            count={fAwaiting.length}
            value={fAwaiting.reduce((s, p) => s + p.contractValue, 0)}
            items={fAwaiting}
            overdueCount={fAwaiting.filter((p) => daysOverdue(p) > 0).length}
          />
        </div>
      </div>
      <p className="-mt-2 text-center text-[10.5px] uppercase tracking-wider text-[var(--ink-500)] sm:hidden">
        Swipe between columns →
      </p>

      {/* Contractor performance */}
      <Card>
        <CardHead title="Top main contractors" subtitle="Bid volume and win rate — where our pipeline concentrates" />
        {/* Mobile: stacked cards */}
        <div className="divide-y divide-[var(--ink-200)] sm:hidden">
          {contractorStats.map((r) => (
            <div key={r.name} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate font-semibold text-[13px] text-[var(--ink-900)]">{r.name}</p>
                <p className="shrink-0 font-mono-num text-[12.5px] font-semibold">{r.rate !== null ? `${r.rate}%` : "—"}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--ink-500)]">
                <span><span className="font-mono-num text-[var(--ink-900)]">{r.tenders}</span> tender</span>
                <span><span className="font-mono-num text-[var(--ink-900)]">{r.awaiting}</span> awaiting</span>
                <span className="text-[var(--green-600)]"><span className="font-mono-num">{r.won}</span> won</span>
                <span className="text-[var(--red-500)]"><span className="font-mono-num">{r.lost}</span> lost</span>
                <span className="ml-auto font-mono-num text-[var(--ink-700)]">{fmtMoney(r.value, { compact: true })}</span>
              </div>
            </div>
          ))}
          {contractorStats.length === 0 && (
            <p className="px-4 py-6 text-center text-[12px] text-[var(--ink-500)]">No contractor data yet.</p>
          )}
        </div>
        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Contractor</th>
                <th className="px-4 py-2.5 text-right font-semibold">Live tenders</th>
                <th className="px-4 py-2.5 text-right font-semibold">Awaiting</th>
                <th className="px-4 py-2.5 text-right font-semibold">Won</th>
                <th className="px-4 py-2.5 text-right font-semibold">Lost</th>
                <th className="px-4 py-2.5 text-right font-semibold">Win rate</th>
                <th className="px-4 py-2.5 text-right font-semibold">Total value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {contractorStats.map((r) => (
                <tr key={r.name} className="hover:bg-[var(--ink-50)]">
                  <td className="px-4 py-2.5 font-semibold text-[var(--ink-900)]">{r.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{r.tenders}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{r.awaiting}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-[var(--green-600)]">{r.won}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-[var(--red-500)]">{r.lost}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num font-semibold">{r.rate !== null ? `${r.rate}%` : "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{fmtMoney(r.value, { compact: true })}</td>
                </tr>
              ))}
              {contractorStats.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[var(--ink-500)]">No contractor data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}

function PipelineColumn({
  title, subtitle, tone, count, value, items, overdueCount = 0,
}: {
  title: string; subtitle: string;
  tone: "info" | "warning";
  count: number; value: number; items: Project[]; overdueCount?: number;
}) {
  return (
    <Card className="flex h-full flex-col">
      <div className={"flex items-start justify-between gap-3 border-b border-[var(--ink-200)] px-4 py-3 sm:px-5 sm:py-4 " +
        (tone === "info" ? "bg-[var(--accent-500)]/[0.04]" : "bg-[var(--amber-500)]/[0.06]")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Briefcase className={"h-3.5 w-3.5 " + (tone === "info" ? "text-[var(--accent-500)]" : "text-[var(--amber-500)]")} />
            <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink-900)]">{title}</h3>
            <StatusBadge tone={tone === "info" ? "info" : "warning"}>{count}</StatusBadge>
            {overdueCount > 0 && (
              <StatusBadge tone="danger" dot>
                {overdueCount} overdue
              </StatusBadge>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] text-[var(--ink-500)]">{subtitle}</p>
        </div>
        <p className="shrink-0 font-mono-num text-[13px] font-semibold text-[var(--ink-700)]">{fmtMoney(value, { compact: true })}</p>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-[var(--ink-200)] p-6 text-center text-[12px] text-[var(--ink-500)]">
            Nothing here right now.
          </div>
        )}
        {items.map((p) => <PipelineCard key={p.id} project={p} />)}
      </div>
    </Card>
  );
}

function PipelineCard({ project: p }: { project: Project }) {
  const age = daysSince(p.quoteSentDate);
  const overdue = isFollowUpOverdue(p);
  const overdueDays = daysOverdue(p);
  const stale = p.status === "awaiting" && age !== null && age > 14;
  const flag = overdue || stale;
  const [open, setOpen] = useState(false);
  return (
    <div className={"rounded-md border border-l-4 p-3 transition-shadow hover:shadow-[0_2px_10px_rgba(15,40,71,0.06)] " +
      (flag
        ? "border-[var(--ink-200)] border-l-[var(--red-500)] bg-[var(--red-500)]/[0.04]"
        : "border-[var(--ink-200)] border-l-[var(--ink-200)] bg-[var(--card)]")}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-[13px] text-[var(--ink-900)] hover:text-[var(--accent-500)]">{p.name}</p>
          <p className="truncate text-[11px] text-[var(--ink-500)]">{p.mainContractor}</p>
        </div>
        <p className="shrink-0 font-mono-num text-[13px] font-semibold text-[var(--ink-900)]">{fmtMoney(p.contractValue, { compact: true })}</p>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-500)]">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {p.quoteSentDate ? `${age}d since quote` : "quote not sent"}
        </span>
        {flag && (
          <StatusBadge tone="danger" dot className="font-bold">
            {overdue ? (
              <><Flame className="mr-1 h-3 w-3" />{overdueDays > 0 ? `${overdueDays}d overdue` : "Follow-up overdue"}</>
            ) : (
              <><AlertTriangle className="mr-1 h-3 w-3" />Stale &gt;14d</>
            )}
          </StatusBadge>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        {p.status === "tender" && <SendQuoteButton project={p} />}
        <MarkActiveDialog project={p} />
        <MarkLostDialog project={p} />
        <CloneTenderButton project={p} />
      </div>
      <TenderDetailSheet project={p} open={open} onOpenChange={setOpen} />
    </div>
  );
}
