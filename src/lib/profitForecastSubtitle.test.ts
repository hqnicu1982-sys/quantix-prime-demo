import { describe, it, expect } from "vitest";
import { formatForecastCostSubtitle } from "./profitForecastSubtitle";
import type { ProfitForecast } from "./profitForecast";

function makeCost(over: Partial<ProfitForecast["cost"]> = {}): ProfitForecast["cost"] {
  return {
    boqBudget: 0,
    boqCommitted: 0,
    materialsCommitted: 0,
    materialsEstimated: 0,
    materialsCost: 0,
    labourPlanned: 0,
    labourEstimated: 0,
    labourTotal: 0,
    estimatedCostShare: 0,
    labourActual: 0,
    variationCost: 0,
    overheads: 0,
    riskBuffer: 0,
    forecastCostAtCompletion: 0,
    ...over,
  };
}

describe("formatForecastCostSubtitle", () => {
  it("always lists materials and labour (even when zero)", () => {
    const s = formatForecastCostSubtitle(makeCost());
    expect(s).toContain("materials £0");
    expect(s).toContain("labour £0");
  });

  it("includes every non-zero EAC component so the parts visibly add up", () => {
    // Regression: the subtitle used to only show materials + labour, so a
    // £233k EAC looked like £54k. Make sure all components surface.
    const s = formatForecastCostSubtitle(
      makeCost({
        materialsCost: 0,
        labourTotal: 54_000,
        variationCost: 7_000,
        overheads: 169_000,
        riskBuffer: 3_000,
        forecastCostAtCompletion: 233_000,
      }),
    );
    expect(s).toContain("VOs £7k");
    expect(s).toContain("overheads £169k");
    expect(s).toContain("risk £3k");
  });

  it("omits zero VOs / overheads / risk to keep subtitle readable", () => {
    const s = formatForecastCostSubtitle(
      makeCost({ materialsCost: 10_000, labourTotal: 20_000 }),
    );
    expect(s).not.toContain("VOs");
    expect(s).not.toContain("overheads");
    expect(s).not.toContain("risk");
  });

  it("post-MSProject import: tasks synced but no crew → labour estimat only", () => {
    // After a Replace-all MSProject import, plannerScheduledPct can be 0 yet
    // labour estimate exists from programme hours. Subtitle must still show
    // the labour figure and the estimat badge.
    const s = formatForecastCostSubtitle(
      makeCost({
        labourEstimated: 120_000,
        labourTotal: 120_000,
        overheads: 15_000,
        riskBuffer: 6_000,
        estimatedCostShare: 0.89,
      }),
    );
    expect(s).toContain("labour £120k");
    expect(s).toContain("overheads £15k");
    expect(s).toContain("risk £6k");
    expect(s).toContain("89% estimat");
  });

  it("does not append estimat suffix when cost share is zero", () => {
    const s = formatForecastCostSubtitle(
      makeCost({ materialsCost: 1_000, labourTotal: 1_000, estimatedCostShare: 0 }),
    );
    expect(s).not.toMatch(/estimat/);
  });

  it("uses ' · ' separators between parts", () => {
    const s = formatForecastCostSubtitle(
      makeCost({ materialsCost: 100, labourTotal: 200, overheads: 50 }),
    );
    expect(s.split(" · ").length).toBeGreaterThanOrEqual(3);
  });
});