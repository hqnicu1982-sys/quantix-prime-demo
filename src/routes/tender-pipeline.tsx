import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { useProject } from "@/lib/ProjectContext";
import { fmtMoney, daysSince, type Project } from "@/lib/mockData";
import { groupByStatus, isFollowUpOverdue } from "@/lib/projectLifecycle";
import { SendQuoteButton, MarkActiveDialog, MarkLostDialog, CloneTenderButton } from "@/components/projects/LifecycleActionDialogs";
import { useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Clock } from "lucide-react";

export const Route = createFileRoute("/tender-pipeline")({ component: TenderPipeline });

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Kanban-lite */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineColumn
          title="Tender"
          subtitle="Pricing / quote not yet sent"
          tone="info"
          count={fTenders.length}
          value={fTenders.reduce((s, p) => s + p.contractValue, 0)}
          items={fTenders}
        />
        <PipelineColumn
          title="Awaiting decision"
          subtitle="Quote sent · chasing feedback"
          tone="warning"
          count={fAwaiting.length}
          value={fAwaiting.reduce((s, p) => s + p.contractValue, 0)}
          items={fAwaiting}
        />
      </div>

      {/* Contractor performance */}
      <Card>
        <CardHead title="Top main contractors" subtitle="Bid volume and win rate — where our pipeline concentrates" />
        <div className="overflow-x-auto">
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
  title, subtitle, tone, count, value, items,
}: {
  title: string; subtitle: string;
  tone: "info" | "warning";
  count: number; value: number; items: Project[];
}) {
  return (
    <Card className="flex flex-col">
      <div className={"flex items-start justify-between gap-3 border-b border-[var(--ink-200)] px-5 py-4 " +
        (tone === "info" ? "bg-[var(--accent-500)]/[0.04]" : "bg-[var(--amber-500)]/[0.06]")}>
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className={"h-3.5 w-3.5 " + (tone === "info" ? "text-[var(--accent-500)]" : "text-[var(--amber-500)]")} />
            <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink-900)]">{title}</h3>
            <StatusBadge tone={tone === "info" ? "info" : "warning"}>{count}</StatusBadge>
          </div>
          <p className="mt-0.5 text-[11.5px] text-[var(--ink-500)]">{subtitle}</p>
        </div>
        <p className="font-mono-num text-[13px] font-semibold text-[var(--ink-700)]">{fmtMoney(value, { compact: true })}</p>
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
  const stale = p.status === "awaiting" && age !== null && age > 14;
  const flag = overdue || stale;
  return (
    <div className={"rounded-md border p-3 transition-shadow hover:shadow-[0_2px_10px_rgba(15,40,71,0.06)] " +
      (flag ? "border-[var(--red-500)]/40 bg-[var(--red-500)]/[0.04]" : "border-[var(--ink-200)] bg-[var(--card)]")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
            <p className="truncate font-semibold text-[13px] text-[var(--ink-900)] hover:text-[var(--accent-500)]">{p.name}</p>
            <p className="truncate text-[11px] text-[var(--ink-500)]">{p.mainContractor}</p>
          </Link>
        </div>
        <p className="font-mono-num text-[13px] font-semibold text-[var(--ink-900)]">{fmtMoney(p.contractValue, { compact: true })}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-500)]">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{p.quoteSentDate ? `${age}d since quote` : "quote not sent"}</span>
        {flag && (
          <StatusBadge tone="danger" dot>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {overdue ? "Follow-up overdue" : "Stale >14d"}
          </StatusBadge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {p.status === "tender" && <SendQuoteButton project={p} />}
        <MarkActiveDialog project={p} />
        <MarkLostDialog project={p} />
        <CloneTenderButton project={p} />
      </div>
    </div>
  );
}
