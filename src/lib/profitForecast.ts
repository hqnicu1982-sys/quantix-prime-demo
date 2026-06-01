import { useMemo } from "react";
import type { Project } from "./mockData";
import { useProject } from "./ProjectContext";
import { useProjectData } from "./projectData";
import { useBoqAllocation } from "./boqAllocation";
import { useProjectTasks, taskPlannedCost, daysBetween } from "./planner";
import { useProjectVariations } from "./variations";
import { useLabourLogs } from "./laborLog";
import { effectiveRate } from "./labour";
import { useIntegrationConnection } from "./integrationConnections";

// ============================================================================
// Profit Forecast — pre-execution & live "will this job make money?" engine.
// Aggregates Contract value + BoQ allocations + Planner labour + Variations
// into a single Forecast-At-Completion (EAC) with a confidence score.
// Pure-ish: hook wraps the existing localStorage-backed stores.
// ============================================================================

export type ForecastVerdict = "profit" | "tight" | "loss";

export type ForecastDriver = {
  label: string;
  deltaMoney: number; // signed; +ve increases cost or reduces margin
  kind: "labour" | "materials" | "vo" | "overhead" | "risk";
};

export type ProfitForecast = {
  revenue: {
    contractValue: number;
    approvedVOs: number;
    pendingVOs: number;       // weighted by 50% in forecastRevenue
    forecastRevenue: number;
  };
  cost: {
    boqBudget: number;        // qty × rate across all BoQ lines
    boqCommitted: number;     // ordered+delivered qty × rate
    materialsCommitted: number; // == boqCommitted (alias for UI clarity)
    materialsEstimated: number; // boqBudget portion not yet committed
    materialsCost: number;    // max(boqBudget, boqCommitted) — committed can exceed budget
    labourPlanned: number;    // Σ plannedHours × rate (committed: crew + hours set)
    labourEstimated: number;  // Σ baseline ore din durata task-urilor neasignate
    labourTotal: number;      // labourPlanned + labourEstimated
    estimatedCostShare: number; // 0..1 — % din direct cost care vine din estimate
    labourActual: number;     // Σ logged hours × rate (informational)
    variationCost: number;    // approved + 0.5 × pending
    overheads: number;        // % of revenue
    riskBuffer: number;       // % of (materials + labour)
    forecastCostAtCompletion: number;
  };
  margin: {
    targetMargin: number;     // %
    forecastMargin: number;   // %
    deltaVsTarget: number;    // percentage points
    forecastProfit: number;   // £
    verdict: ForecastVerdict;
  };
  confidence: {
    boqAllocatedPct: number;     // 0..100 — % of BoQ value committed/ordered
    plannerScheduledPct: number; // 0..100 — % of tasks with crew + plannedHours
    msProjectLinked: boolean;
    score: number;               // 0..100
    note: string;
  };
  drivers: ForecastDriver[];
};

export type ForecastAssumptions = {
  /** Overheads as a fraction of revenue. Default 8%. */
  overheadPct: number;
  /** Risk buffer as a fraction of direct cost. Default 5%. */
  riskPct: number;
  /** Weight applied to pending VO cost & revenue. Default 0.5. */
  pendingVoWeight: number;
};

export const DEFAULT_ASSUMPTIONS: ForecastAssumptions = {
  overheadPct: 0.08,
  riskPct: 0.05,
  pendingVoWeight: 0.5,
};

function verdictFor(forecastMargin: number, targetMargin: number, profit: number): ForecastVerdict {
  if (profit <= 0) return "loss";
  const delta = forecastMargin - targetMargin;
  if (delta >= -2) return "profit";
  if (delta >= -5) return "tight";
  return "loss";
}

/**
 * Compute the forecast from already-loaded inputs.
 * Kept pure so it can be unit-tested without React.
 */
export function computeProfitForecastFromInputs(input: {
  project: Pick<Project, "id" | "contractValue" | "margin">;
  boqLines: { id: string; qty: number; ratePerUnit?: number }[];
  allocations: { lineId: string; ordered: number; delivered: number }[];
  tasks: { plannedHours?: number; crewId?: string; status: string }[];
  loggedHoursByCrew: Record<string, number>;
  variations: { status: string; costImpact: number; approvedValue?: number }[];
  msProjectLinked: boolean;
  assumptions?: Partial<ForecastAssumptions>;
}): ProfitForecast {
  const a: ForecastAssumptions = { ...DEFAULT_ASSUMPTIONS, ...(input.assumptions ?? {}) };
  const { project } = input;

  // ---- Revenue ----
  const approvedVOs = input.variations
    .filter((v) => v.status === "approved")
    .reduce((s, v) => s + (v.approvedValue ?? v.costImpact), 0);
  const pendingVOs = input.variations
    .filter((v) => v.status === "draft" || v.status === "submitted")
    .reduce((s, v) => s + v.costImpact, 0);
  const forecastRevenue = project.contractValue + approvedVOs + pendingVOs * a.pendingVoWeight;

  // ---- Materials (BoQ) ----
  const boqBudget = input.boqLines.reduce(
    (s, l) => s + l.qty * (l.ratePerUnit ?? 0),
    0,
  );
  let boqCommittedValue = 0;
  let boqOrderedQty = 0;
  let boqTotalQty = 0;
  for (const line of input.boqLines) {
    const alloc = input.allocations.find((x) => x.lineId === line.id);
    const committed = (alloc?.ordered ?? 0) + (alloc?.delivered ?? 0);
    boqCommittedValue += committed * (line.ratePerUnit ?? 0);
    boqOrderedQty += committed;
    boqTotalQty += line.qty;
  }
  // If committed > budget (over-order / price drift) take the larger value.
  const materialsCost = Math.max(boqBudget, boqCommittedValue);

  // ---- Labour (Planner) ----
  let labourPlanned = 0;
  let scheduledTasks = 0;
  for (const t of input.tasks) {
    const hasPlan = !!t.plannedHours && !!t.crewId;
    if (hasPlan) scheduledTasks += 1;
    if (hasPlan && t.crewId) {
      labourPlanned += (t.plannedHours ?? 0) * effectiveRate(t.crewId, project.id);
    }
  }
  const labourActual = Object.entries(input.loggedHoursByCrew).reduce(
    (s, [crewId, hrs]) => s + hrs * effectiveRate(crewId, project.id),
    0,
  );

  // ---- Variations cost (price-as-sell, so cost ~ revenue side; we treat the
  // execution cost as approved + half of pending, conservative). ----
  const variationCost =
    approvedVOs * 0.78 + pendingVOs * a.pendingVoWeight * 0.78; // assume ~22% margin on VOs

  // ---- Overheads & risk ----
  const overheads = forecastRevenue * a.overheadPct;
  const directCost = materialsCost + labourPlanned + variationCost;
  const riskBuffer = directCost * a.riskPct;
  const forecastCostAtCompletion = directCost + overheads + riskBuffer;

  // ---- Margin ----
  const forecastProfit = forecastRevenue - forecastCostAtCompletion;
  const forecastMargin = forecastRevenue > 0 ? (forecastProfit / forecastRevenue) * 100 : 0;
  const targetMargin = project.margin;
  const deltaVsTarget = forecastMargin - targetMargin;
  const verdict = verdictFor(forecastMargin, targetMargin, forecastProfit);

  // ---- Confidence ----
  const boqAllocatedPct = boqTotalQty > 0 ? Math.min(100, (boqOrderedQty / boqTotalQty) * 100) : 0;
  const plannerScheduledPct =
    input.tasks.length > 0 ? (scheduledTasks / input.tasks.length) * 100 : 0;
  let score =
    Math.round(boqAllocatedPct * 0.45 + plannerScheduledPct * 0.45);
  if (input.msProjectLinked) score = Math.min(100, score + 10);
  // Floor: if we have a contract value & target margin, baseline confidence 15.
  if (project.contractValue > 0) score = Math.max(score, 15);
  let note = "Forecast preliminar — adaugă alocări BoQ și ore planner pentru precizie.";
  if (score >= 70) note = "Forecast solid — bază bună de decizie.";
  else if (score >= 40) note = "Forecast indicativ — încă lipsesc alocări sau ore planner.";

  // ---- Drivers (top 3 cost contributors above/below proportional share) ----
  const drivers: ForecastDriver[] = [];
  // Labour vs budget share
  const expectedLabour = forecastRevenue * (1 - targetMargin / 100) * 0.35; // assume labour ~35% of cost
  if (labourPlanned > 0) {
    const delta = labourPlanned - expectedLabour;
    drivers.push({
      label:
        delta >= 0
          ? `Labour planificat depășește alocarea cu ${fmtMoneyShort(Math.abs(delta))}`
          : `Labour planificat sub țintă cu ${fmtMoneyShort(Math.abs(delta))}`,
      deltaMoney: delta,
      kind: "labour",
    });
  }
  // Materials over budget
  if (boqCommittedValue > boqBudget && boqBudget > 0) {
    drivers.push({
      label: `Committed materials peste BoQ cu ${fmtMoneyShort(boqCommittedValue - boqBudget)}`,
      deltaMoney: boqCommittedValue - boqBudget,
      kind: "materials",
    });
  }
  // VO swing
  if (Math.abs(approvedVOs + pendingVOs * a.pendingVoWeight) > 0) {
    const voNet = (approvedVOs + pendingVOs * a.pendingVoWeight) * 0.22; // margin contribution
    drivers.push({
      label:
        voNet >= 0
          ? `VO-uri aduc +${fmtMoneyShort(voNet)} margin (${fmtMoneyShort(approvedVOs)} aprobat, ${fmtMoneyShort(pendingVOs)} pending)`
          : `VO-uri reduc margin cu ${fmtMoneyShort(Math.abs(voNet))}`,
      deltaMoney: -voNet,
      kind: "vo",
    });
  }
  // Risk buffer if small project margin
  if (riskBuffer > 0) {
    drivers.push({
      label: `Risk buffer ${(a.riskPct * 100).toFixed(0)}% = ${fmtMoneyShort(riskBuffer)}`,
      deltaMoney: riskBuffer,
      kind: "risk",
    });
  }

  return {
    revenue: { contractValue: project.contractValue, approvedVOs, pendingVOs, forecastRevenue },
    cost: {
      boqBudget,
      boqCommitted: boqCommittedValue,
      materialsCost,
      labourPlanned,
      labourActual,
      variationCost,
      overheads,
      riskBuffer,
      forecastCostAtCompletion,
    },
    margin: { targetMargin, forecastMargin, deltaVsTarget, forecastProfit, verdict },
    confidence: {
      boqAllocatedPct,
      plannerScheduledPct,
      msProjectLinked: input.msProjectLinked,
      score,
      note,
    },
    drivers: drivers
      .sort((a, b) => Math.abs(b.deltaMoney) - Math.abs(a.deltaMoney))
      .slice(0, 4),
  };
}

function fmtMoneyShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `£${(n / 1_000).toFixed(1)}k`;
  return `£${Math.round(n)}`;
}

// ---------------------------------------------------------------------------
// React hook — wires the live stores
// ---------------------------------------------------------------------------

export function useProfitForecast(projectId: string, assumptions?: Partial<ForecastAssumptions>): ProfitForecast {
  const { all } = useProject();
  const project = all.find((p) => p.id === projectId);
  const data = useProjectData(projectId);
  const boq = useBoqAllocation(projectId);
  const tasks = useProjectTasks(projectId);
  const variations = useProjectVariations(projectId);
  const logs = useLabourLogs(projectId);
  const mspConn = useIntegrationConnection("msp");

  return useMemo(() => {
    if (!project) {
      return computeProfitForecastFromInputs({
        project: { id: projectId, contractValue: 0, margin: 0 },
        boqLines: [],
        allocations: [],
        tasks: [],
        loggedHoursByCrew: {},
        variations: [],
        msProjectLinked: false,
        assumptions,
      });
    }
    const allocations = boq.systems.flatMap((s) =>
      s.lines.map((l) => ({ lineId: l.line.id, ordered: l.ordered, delivered: l.delivered })),
    );
    const loggedHoursByCrew: Record<string, number> = {};
    for (const t of tasks) {
      if (!t.crewId) continue;
      const hrs = logs
        .filter((log: { taskId?: string; hours: number }) => log.taskId === t.id)
        .reduce((s: number, log: { hours: number }) => s + log.hours, 0);
      if (hrs > 0) loggedHoursByCrew[t.crewId] = (loggedHoursByCrew[t.crewId] ?? 0) + hrs;
    }
    return computeProfitForecastFromInputs({
      project,
      boqLines: data.boqLines,
      allocations,
      tasks,
      loggedHoursByCrew,
      variations,
      msProjectLinked: !!mspConn,
      assumptions,
    });
  }, [project, projectId, data, boq, tasks, variations, logs, mspConn, assumptions]);
}

// ---------------------------------------------------------------------------
// Pretty helpers exported for the card
// ---------------------------------------------------------------------------

export const VERDICT_META: Record<ForecastVerdict, { label: string; tone: string; bg: string; border: string }> = {
  profit: {
    label: "On track for profit",
    tone: "text-[var(--green-600)]",
    bg: "bg-[var(--green-600)]/10",
    border: "border-[var(--green-600)]/30",
  },
  tight: {
    label: "Tight margin",
    tone: "text-[var(--amber-500)]",
    bg: "bg-[var(--amber-500)]/10",
    border: "border-[var(--amber-500)]/30",
  },
  loss: {
    label: "At risk of loss",
    tone: "text-[var(--red-500)]",
    bg: "bg-[var(--red-500)]/10",
    border: "border-[var(--red-500)]/30",
  },
};