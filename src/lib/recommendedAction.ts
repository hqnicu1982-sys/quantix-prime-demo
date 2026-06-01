import { PLANNER_TODAY, daysBetween, type PlannerTask, type TaskBlocker } from "./planner";

export type RecActionKind = "navigate-variations" | "navigate-calloffs" | "push" | "reassign-crew";

export type RecCandidate = {
  kind: RecActionKind;
  blockerType: TaskBlocker["type"];
  label: string;
  baseReason: string;
};

export type ScoredRecAction = RecCandidate & {
  score: number;
  weightScore: number;
  urgencyScore: number;
  impactScore: number;
  urgencyTier: "overdue" | "imminent" | "soon" | "later";
  impactTier: "high" | "medium" | "low";
  daysUntilStart: number;
  plannedCost: number;
  reason: string;
};

export type PickArgs = {
  blockers: TaskBlocker[];
  task: PlannerTask;
  suggestedStart?: string;
  canEdit: boolean;
  plannedCost: number;
  today?: Date;
};

// Baseline weight per blocker type. Higher = inherently more critical to unblock.
const TYPE_WEIGHT: Record<TaskBlocker["type"], number> = {
  variation: 50, // legal/contract gate — nothing moves without it
  material: 40, // procurement lead-time risk
  predecessor: 30, // schedule logic — usually fixable by replanning
  labour: 25, // double-booking — reassignable
  design: 20,
  sub: 20,
};

function urgencyScore(daysUntilStart: number, status: PlannerTask["status"]) {
  let tier: ScoredRecAction["urgencyTier"];
  let score: number;
  if (daysUntilStart < 0) {
    tier = "overdue";
    score = 60 + Math.min(40, Math.abs(daysUntilStart) * 4);
  } else if (daysUntilStart <= 3) {
    tier = "imminent";
    score = 45;
  } else if (daysUntilStart <= 14) {
    tier = "soon";
    score = 20;
  } else {
    tier = "later";
    score = 5;
  }
  if (status === "blocked" || status === "behind") score += 15;
  return { tier, score };
}

function impactScore(plannedCost: number) {
  let tier: ScoredRecAction["impactTier"];
  let score: number;
  if (plannedCost >= 20_000) {
    tier = "high";
    score = 40;
  } else if (plannedCost >= 5_000) {
    tier = "medium";
    score = 20;
  } else {
    tier = "low";
    score = 5;
  }
  return { tier, score };
}

function candidatesFor(args: PickArgs): RecCandidate[] {
  const { blockers, suggestedStart, task, canEdit } = args;
  const out: RecCandidate[] = [];
  for (const b of blockers) {
    if (b.type === "variation") {
      out.push({
        kind: "navigate-variations",
        blockerType: "variation",
        label: "Approve variation",
        baseReason: "Variation must be approved before work can start.",
      });
    } else if (b.type === "material") {
      out.push({
        kind: "navigate-calloffs",
        blockerType: "material",
        label: "Raise call-off",
        baseReason: "Materials need a confirmed call-off.",
      });
    } else if (b.type === "predecessor" && canEdit && suggestedStart && suggestedStart !== task.start) {
      out.push({
        kind: "push",
        blockerType: "predecessor",
        label: `Push to ${suggestedStart}`,
        baseReason: "Aligns start with the latest predecessor.",
      });
    } else if (b.type === "labour") {
      out.push({
        kind: "reassign-crew",
        blockerType: "labour",
        label: "Reassign crew",
        baseReason: "Crew is double-booked in this window.",
      });
    }
  }
  return out;
}

export function scoreCandidates(args: PickArgs): ScoredRecAction[] {
  const today = args.today ?? PLANNER_TODAY;
  const daysUntilStart = daysBetween(today, args.task.start);
  const u = urgencyScore(daysUntilStart, args.task.status);
  const i = impactScore(args.plannedCost);

  const candidates = candidatesFor(args);
  if (candidates.length === 0) return [];

  const scored = candidates.map((c) => {
    const typeWeight = TYPE_WEIGHT[c.blockerType] ?? 10;
    const score = typeWeight + u.score + i.score;
    const bits: string[] = [c.baseReason];
    if (u.tier === "overdue") bits.push(`Start was ${Math.abs(daysUntilStart)}d ago.`);
    else if (u.tier === "imminent") bits.push(`Starts in ${daysUntilStart}d.`);
    if (i.tier === "high") bits.push(`High P&L impact (£${Math.round(args.plannedCost / 1000)}k planned).`);
    else if (i.tier === "medium") bits.push(`£${Math.round(args.plannedCost / 1000)}k planned labour at stake.`);
    return {
      ...c,
      score,
      weightScore: typeWeight,
      urgencyScore: u.score,
      impactScore: i.score,
      urgencyTier: u.tier,
      impactTier: i.tier,
      daysUntilStart,
      plannedCost: args.plannedCost,
      reason: bits.join(" "),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function pickRecommendedAction(args: PickArgs): ScoredRecAction | null {
  return scoreCandidates(args)[0] ?? null;
}