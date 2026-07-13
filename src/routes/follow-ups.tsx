import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Kpi, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import {
  useAllManualFollowUps, getFollowUpHistory, FOLLOW_UP_OUTCOMES,
  type FollowUpEntry,
} from "@/lib/tenderDetails";
import { isFollowUpOverdue } from "@/lib/projectLifecycle";
import type { Project, ProjectStatus } from "@/lib/mockData";
import { TenderDetailSheet } from "@/components/projects/TenderDetailSheet";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Phone, Users, Cog, Download, BellRing, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Quantix Prime" },
      { name: "description", content: "Cross-project feed of every tender and client follow-up logged across the pipeline." },
      { property: "og:title", content: "Follow-ups — Quantix Prime" },
      { property: "og:description", content: "Cross-project follow-up feed for the commercial team." },
    ],
  }),
  component: FollowUpsPage,
});

type Row = FollowUpEntry & { project: Project };
type StageFilter = "all" | "pre" | "active";
type ChannelFilter = "all" | "email" | "call" | "meeting" | "system";
type RangeFilter = "7" | "30" | "90" | "all";

const CHANNEL_ICON = {
  email: Mail, call: Phone, meeting: Users, system: Cog,
} as const;

function isPreStage(s: ProjectStatus | undefined) {
  return s === "tender" || s === "awaiting";
}

function FollowUpsPage() {
  const { all } = useProject();
  useAllManualFollowUps(); // subscribe → re-render on new/edit/delete

  const [stage, setStage] = useState<StageFilter>("all");
  const [owner, setOwner] = useState<string>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [outcome, setOutcome] = useState<string>("all");
  const [range, setRange] = useState<RangeFilter>("30");
  const [q, setQ] = useState("");
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const navigate = useNavigate();

  // Build all rows once per render — derived + manual, across every visible project.
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const p of all) {
      const history = getFollowUpHistory(p);
      for (const e of history) out.push({ ...e, project: p });
    }
    return out.sort((a, b) => a.daysAgo - b.daysAgo);
  }, [all]);

  const owners = useMemo(
    () => Array.from(new Set(rows.map((r) => r.by))).sort(),
    [rows],
  );

  const filtered = useMemo(() => rows.filter((r) => {
    if (stage === "pre" && !isPreStage(r.project.status)) return false;
    if (stage === "active" && r.project.status !== "active") return false;
    if (owner !== "all" && r.by !== owner) return false;
    if (channel !== "all" && r.channel !== channel) return false;
    if (outcome !== "all" && r.outcome !== outcome) return false;
    if (range !== "all") {
      const max = Number(range);
      if (r.daysAgo > max) return false;
    }
    if (q) {
      const hay = `${r.by} ${r.note} ${r.project.name}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, stage, owner, channel, outcome, range, q]);

  const last7 = rows.filter((r) => r.daysAgo <= 7).length;
  const last30 = rows.filter((r) => r.daysAgo <= 30).length;
  const overdueCount = all.filter((p) => isFollowUpOverdue(p)).length;
  const byChannel = {
    email: rows.filter((r) => r.channel === "email").length,
    call: rows.filter((r) => r.channel === "call").length,
    meeting: rows.filter((r) => r.channel === "meeting").length,
  };

  function openRow(r: Row) {
    if (isPreStage(r.project.status)) {
      setOpenProject(r.project);
    } else {
      navigate({ to: "/projects/$projectId", params: { projectId: r.project.id } });
    }
  }

  function exportCsv() {
    const rowsOut = [
      ["Date", "Days ago", "Project", "Stage", "Channel", "By", "Outcome", "Next reminder", "Note"],
      ...filtered.map((r) => [
        r.date,
        String(r.daysAgo),
        r.project.name,
        r.project.status ?? "active",
        r.channel,
        r.by,
        r.outcome ?? "",
        r.nextReminderDate ?? "",
        r.note,
      ]),
    ];
    const csv = rowsOut.map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `follow-ups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Follow-ups exported", { description: `${filtered.length} events → CSV` });
  }

  return (
    <Section
      title="Follow-ups"
      subtitle="Every tender chase, client call and site touchpoint — logged across every project"
      right={
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Logged (7d)" value={`${last7}`} tone={last7 > 0 ? "info" : "neutral"} />
        <Kpi label="Logged (30d)" value={`${last30}`} />
        <Kpi label="Overdue reminders" value={`${overdueCount}`} tone={overdueCount > 0 ? "danger" : "success"} />
        <Kpi
          label="Mix"
          value={`${byChannel.email}·${byChannel.call}·${byChannel.meeting}`}
          delta="Email · Call · Meeting"
        />
      </div>

      <Card>
        <CardHead title="Timeline" subtitle={`${filtered.length} of ${rows.length} events`} />

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink-200)] bg-[var(--ink-50)]/50 px-5 py-3">
          <select value={stage} onChange={(e) => setStage(e.target.value as StageFilter)} className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]">
            <option value="all">All stages</option>
            <option value="pre">Tender / Awaiting</option>
            <option value="active">Active</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value as ChannelFilter)} className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]">
            <option value="all">All channels</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="system">System</option>
          </select>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]">
            <option value="all">All outcomes</option>
            {FOLLOW_UP_OUTCOMES.map((o) => (<option key={o.code} value={o.code}>{o.label}</option>))}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]">
            <option value="all">All owners</option>
            {owners.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value as RangeFilter)} className="h-8 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project, owner, or note…"
            className="h-8 flex-1 min-w-48 rounded border border-[var(--ink-200)] bg-card px-2 text-[12px]"
          />
          {(stage !== "all" || channel !== "all" || outcome !== "all" || owner !== "all" || range !== "30" || q) && (
            <Button variant="ghost" size="sm" onClick={() => { setStage("all"); setChannel("all"); setOutcome("all"); setOwner("all"); setRange("30"); setQ(""); }}>Clear</Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                <th className="px-4 py-2.5 text-left font-semibold">Channel</th>
                <th className="px-4 py-2.5 text-left font-semibold">By</th>
                <th className="px-4 py-2.5 text-left font-semibold">Note</th>
                <th className="px-4 py-2.5 text-left font-semibold">Outcome</th>
                <th className="px-4 py-2.5 text-left font-semibold">Next reminder</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--ink-500)]">No follow-ups match your filters.</td></tr>
              )}
              {filtered.map((r) => {
                const Icon = CHANNEL_ICON[r.channel];
                const st = r.project.status ?? "active";
                const tone = st === "tender" ? "info" : st === "awaiting" ? "warning" : st === "active" ? "success" : st === "lost" ? "danger" : "neutral";
                return (
                  <tr key={`${r.project.id}-${r.id}`} onClick={() => openRow(r)} className="cursor-pointer hover:bg-[var(--ink-50)]">
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <p className="font-medium text-[var(--ink-900)]">{r.date}</p>
                      <p className="text-[10.5px] text-[var(--ink-500)]">{r.daysAgo}d ago</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-[var(--ink-900)]">{r.project.name}</p>
                      <StatusBadge tone={tone} dot>{st}</StatusBadge>
                    </td>
                    <td className="px-4 py-2.5"><Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" /></td>
                    <td className="px-4 py-2.5 font-medium">
                      {r.by}
                      {r.manual && (
                        <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1 py-0.5 text-[10px] font-medium text-[var(--accent-500)]">logged</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-700)]">
                      <p className="line-clamp-2 max-w-[380px]">{r.note}</p>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-700)]">
                      {r.outcome
                        ? FOLLOW_UP_OUTCOMES.find((o) => o.code === r.outcome)?.label
                        : <span className="text-[var(--ink-300)]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-700)]">
                      {r.nextReminderDate
                        ? (<span className="inline-flex items-center gap-1"><BellRing className="h-3 w-3" />{r.nextReminderDate}</span>)
                        : <span className="text-[var(--ink-300)]">—</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--ink-300)]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {openProject && (
        <TenderDetailSheet
          project={openProject}
          open={!!openProject}
          onOpenChange={(v) => { if (!v) setOpenProject(null); }}
        />
      )}
    </Section>
  );
}