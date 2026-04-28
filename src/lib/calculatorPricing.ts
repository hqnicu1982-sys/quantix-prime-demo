// ============================================================================
// Calculator pricing helper
// Bridges the calculator's per-m² material totals with Costed BoQ unit prices,
// and adds a labour estimate so the Live Summary can show £ totals + £/m².
// ============================================================================
import { costedBoqRows, calculatorResults } from "./mockData";

export const HOURS_PER_M2 = 0.4; // mock productivity assumption (drylining)

export type PricedLine = {
  item: string;
  qty: number;
  unit: string;
  unitPrice: number | null;     // null = no price found in catalogue
  lineCost: number | null;
  supplier: "ccf" | "minster" | "rate" | null;
};

export type CostEstimate = {
  materials: number;
  labour: number;
  total: number;
  perM2: number;
  hours: number;
  labourRate: number;       // £/hr equivalent for display
  pricedLines: number;
  totalLines: number;
  lines: PricedLine[];
};

/**
 * Best-effort price lookup against the Costed BoQ catalogue.
 * Matches by case-insensitive substring on either direction (so
 * "Gyproc WallBoard 12.5" hits "Gyproc WallBoard 12.5mm tapered edge").
 */
export function priceMaterial(name: string): { unitPrice: number; supplier: "ccf" | "minster" | "rate" } | null {
  const needle = name.toLowerCase().trim();
  if (!needle) return null;
  for (const row of costedBoqRows) {
    const hay = row.name.toLowerCase();
    if (hay.includes(needle) || needle.includes(hay.split(" ").slice(0, 3).join(" "))) {
      const ccf = row.ccf ?? Infinity;
      const min = row.minster ?? Infinity;
      const best = Math.min(ccf, min, row.rate);
      if (best === ccf && row.ccf != null)        return { unitPrice: row.ccf, supplier: "ccf" };
      if (best === min && row.minster != null)    return { unitPrice: row.minster, supplier: "minster" };
      return { unitPrice: row.rate, supplier: "rate" };
    }
  }
  return null;
}

export function estimateCost(
  totals: { item: string; unit: string; qty: number }[],
  area: number,
  wasteFactor: number,
): CostEstimate {
  const lines: PricedLine[] = totals.map((t) => {
    const p = priceMaterial(t.item);
    return {
      item: t.item,
      qty: t.qty,
      unit: t.unit,
      unitPrice: p?.unitPrice ?? null,
      lineCost: p ? p.unitPrice * t.qty : null,
      supplier: p?.supplier ?? null,
    };
  });

  const materials = lines.reduce((s, l) => s + (l.lineCost ?? 0), 0);
  const labourArea = area * wasteFactor;
  const labour = labourArea * calculatorResults.labourRate;
  const hours = labourArea * HOURS_PER_M2;
  const total = materials + labour;
  const perM2 = area > 0 ? total / area : 0;

  return {
    materials,
    labour,
    total,
    perM2,
    hours,
    labourRate: calculatorResults.labourRate,
    pricedLines: lines.filter((l) => l.unitPrice != null).length,
    totalLines: lines.length,
    lines,
  };
}

export function fmtMoneyShort(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return `£${Math.round(n).toLocaleString()}`;
  return `£${n.toFixed(0)}`;
}
