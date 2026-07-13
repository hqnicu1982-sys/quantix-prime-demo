import { updateProject, addCustomProject } from "./customProjects";
import { dateOffset, type Project, type ProjectStatus } from "./mockData";

/** Mark a tender as "Awaiting" — records quote sent today + 14-day follow-up. */
export function sendQuote(projectId: string) {
  updateProject(projectId, {
    status: "awaiting",
    quoteSentDate: dateOffset(0),
    followUpReminderDate: dateOffset(14),
    expectedResponseDate: dateOffset(15),
  });
}

/** Convert an awaiting/tender bid into a live project. Freezes estimator baseline. */
export function markActive(projectId: string) {
  updateProject(projectId, {
    status: "active",
    startDate: dateOffset(0),
    progress: 0,
    health: "starting",
  });
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
