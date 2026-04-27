// Maps raw metric values → impact tier for color coding.
// Tiers: critical (top 10%), high, standard, eco/none.

export type Tier = "critical" | "high" | "standard" | "eco" | "none";

export function fireTier(min: number): Tier {
  if (!min) return "none";
  if (min >= 120) return "critical";
  if (min >= 60)  return "high";
  if (min >= 30)  return "standard";
  return "eco";
}

export function acousticTier(rw: number): Tier {
  if (!rw) return "none";
  if (rw >= 55) return "critical";
  if (rw >= 45) return "high";
  if (rw >= 35) return "standard";
  return "eco";
}

export function heightTier(m: number): Tier {
  if (!m) return "none";
  if (m >= 7.0) return "critical";
  if (m >= 5.0) return "high";
  if (m >= 3.5) return "standard";
  return "eco";
}

export function thicknessTier(mm: number): Tier {
  // Thinner = better → flip the scale
  if (!mm) return "none";
  if (mm <= 50)  return "eco";
  if (mm <= 100) return "standard";
  if (mm <= 150) return "high";
  return "critical";
}

/** Best (most impressive) tier across a set of metrics — used for ribbon color. */
export function bestTier(...tiers: Tier[]): Tier {
  const order: Tier[] = ["critical", "high", "standard", "eco", "none"];
  for (const t of order) if (tiers.includes(t)) return t;
  return "none";
}

/** CSS variable a tier resolves to. */
export function tierColorVar(t: Tier): string {
  switch (t) {
    case "critical": return "var(--tier-critical)";
    case "high":     return "var(--tier-high)";
    case "standard": return "var(--tier-standard)";
    case "eco":      return "var(--tier-eco)";
    default:         return "var(--ink-500)";
  }
}