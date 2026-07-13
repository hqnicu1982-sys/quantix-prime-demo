import { updateProject, addCustomProject } from "./customProjects";
import { dateOffset, type Project, type ProjectStatus } from "./mockData";
import { freezeBaseline, getBaseline, type AwardBaseline } from "./awardBaseline";
import { getDrawings } from "./drawingRegistry";
import { seedSuggestedCallOffs } from "./procurementSeed";
import { getProjectData } from "./projectData";
import { addAssignment, getAssignments } from "./labour";
import { logTeamEvent } from "./teamAudit";
import { logFollowUp } from "./tenderDetails";

// ---------------------------------------------------------------------------
// Basic status transitions
// ---------------------------------------------------------------------------

/** Mark a tender as "Awaiting" — records quote sent today + 14-day follow-up. */
export function sendQuote(projectId: string) {
  updateProject(projectId, {
    status: "awaiting",
    quoteSentDate: dateOffset(0),
    followUpReminderDate: dateOffset(14),
    expectedResponseDate: dateOffset(15),
  });
}

/** Pure status flip. Prefer awardProject() for the full award handoff. */
export function markActive(projectId: string) {
  updateProject(projectId, {
    status: "active",
    startDate: dateOffset(0),
    progress: 0,
    health: "starting",
  });
}

// ---------------------------------------------------------------------------
// Award handoff — orchestrates the atomic transition Tender/Awaiting → Active.
// Freezes the commercial baseline, promotes tender drawings to the contract set,
// seeds procurement drafts, assigns the delivery team, and logs the audit
// trail so nothing about "what was priced" can silently drift after award.
// ---------------------------------------------------------------------------

export type AwardOptions = {
  assignedPm?: string;         // team member id (Project Manager)
  assignedQs?: string;         // Commercial QS
  assignedSiteLead?: string;   // Site Manager / Foreman
  seedProcurement?: boolean;   // default true — pushes draft call-offs
  actor?: string;              // display name of the user confirming
  notes?: string;
};

export type AwardResult = {
  baseline: AwardBaseline;
  seededCallOffs: number;
  assignments: number;
};

export function awardProject(project: Project, opts: AwardOptions = {}): AwardResult {
  const projectId = project.id;
  const actor = opts.actor ?? "System";

  // 1) Freeze commercial baseline
  const data = getProjectData(projectId);
  const drawings = getDrawings(projectId);
  const tenderRevIds = drawings.revisions
    .filter((r) => r.isTender && r.status === "current")
    .map((r) => r.id);

  const baseline: AwardBaseline = getBaseline(projectId) ?? freezeBaseline({
    projectId,
    frozenAt: Date.now(),
    frozenBy: actor,
    contractValue: project.contractValue,
    estimatedMargin: project.margin,
    boqLineCount: data.boqLines.length,
    systemCount: data.systems.length,
    drawingRevisionIds: tenderRevIds,
    notes: opts.notes,
  });

  // 2) Seed suggested procurement (draft call-offs)
  const seededCallOffs = opts.seedProcurement === false
    ? 0
    : seedSuggestedCallOffs(projectId, data);

  // 3) Assign delivery team
  const existing = getAssignments(projectId);
  const already = new Set(existing.map((a) => a.memberId));
  let assignments = 0;
  for (const [role, memberId] of [
    ["Project Manager", opts.assignedPm],
    ["Commercial QS", opts.assignedQs],
    ["Site Lead", opts.assignedSiteLead],
  ] as const) {
    if (!memberId || already.has(memberId)) continue;
    addAssignment({ projectId, memberId, projectRole: role });
    already.add(memberId);
    assignments += 1;
  }

  // 4) Flip status + record award metadata
  updateProject(projectId, {
    status: "active",
    startDate: dateOffset(0),
    progress: 0,
    health: "starting",
    awardedDate: dateOffset(0),
    awardedBy: actor,
    assignedPm: opts.assignedPm,
    assignedQs: opts.assignedQs,
    assignedSiteLead: opts.assignedSiteLead,
    baselineFrozen: true,
  });

  // 5) Audit trail (piggyback on team audit for now)
  logTeamEvent({
    kind: "assignment.added",
    subject: project.name,
    subjectId: projectId,
    projectId,
    detail: `Project awarded — baseline £${project.contractValue.toLocaleString("en-GB")} · ${seededCallOffs} draft call-offs · ${assignments} team assignments`,
  });

  // 6) Kickoff reminder — commercial CRM entry so PM sees it in the feed
  logFollowUp({
    projectId,
    isoDate: new Date().toISOString(),
    channel: "meeting",
    by: actor,
    note: "Award confirmed — kickoff to schedule within 7 days.",
    outcome: "won",
    nextReminderDate: displayDate(7),
  });

  return { baseline, seededCallOffs, assignments };
}

function displayDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}


/** Mark a bid as Lost — records reason and winning competitor. */
export function markLost(projectId: string, reason: string, toCompetitor: string) {
  updateProject(projectId, {
    status: "lost",
    lostReason: reason,
    lostToCompetitor: toCompetitor,
    lostDate: dateOffset(0),
  });
}

/** Mark an active project as complete. */
export function markComplete(projectId: string) {
  updateProject(projectId, {
    status: "complete",
    progress: 100,
    completedDate: dateOffset(0),
    endDate: dateOffset(0),
  });
}

/** Clone a project (any stage) as a fresh Tender for re-bidding. */
export function cloneAsTender(p: Project): Project {
  return addCustomProject({
    name: `${p.name} (Copy)`,
    subtitle: p.subtitle,
    mainContractor: p.mainContractor,
    contractValue: p.contractValue,
    margin: 0,
    progress: 0,
    health: "starting",
    startDate: "—",
    endDate: "—",
    status: "tender",
  });
}

/** True when a follow-up is overdue OR the bid has been waiting more than 14 days. */
export function isFollowUpOverdue(p: Project): boolean {
  if (p.status !== "awaiting") return false;
  // Explicit reminder date past?
  if (p.followUpReminderDate) {
    const m = p.followUpReminderDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const then = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (then.getTime() <= today.getTime()) return true;
    }
  }
  // Fallback: quote sent > 14 days ago
  if (p.quoteSentDate) {
    const m = p.quoteSentDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const then = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      const today = new Date();
      const days = Math.floor((today.getTime() - then.getTime()) / 86400000);
      if (days > 14) return true;
    }
  }
  return false;
}

/** Group projects by lifecycle status (undefined treated as "active"). */
export function groupByStatus(list: Project[]): Record<ProjectStatus, Project[]> {
  const out: Record<ProjectStatus, Project[]> = {
    tender: [], awaiting: [], active: [], lost: [], complete: [],
  };
  for (const p of list) out[p.status ?? "active"].push(p);
  return out;
}
