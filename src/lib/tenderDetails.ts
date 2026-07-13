import { team, daysSince, type Project } from "./mockData";

/** Deterministic non-negative hash of a string (for stable pseudo-random picks). */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The three team members who could own a tender bid. */
const ESTIMATOR_POOL = team.filter((m) =>
  ["Estimator", "Commercial QS", "Managing Director"].includes(m.role),
);

export function getAssignedEstimator(p: Project) {
  const pool = ESTIMATOR_POOL.length ? ESTIMATOR_POOL : team.slice(0, 1);
  return pool[hash(p.id) % pool.length];
}

/** Derive a plausible scope summary from project name + contract value. */
export function getTenderScope(p: Project): {
  summary: string;
  areas: string[];
  systems: string[];
  programme: string;
} {
  const name = p.name.toLowerCase();
  const isHotel = name.includes("hotel") || name.includes("fitzrovia");
  const isTower = name.includes("tower") || name.includes("wharf") || name.includes("cross");
  const isRetail = name.includes("retail") || name.includes("market") || name.includes("square") || name.includes("sq");
  const isFitout = name.includes("fit-out") || name.includes("cat b");
  const isResi = name.includes("lofts") || name.includes("place") || name.includes("peninsula");

  let summary = "Drylining package — partitions, wall linings, MF ceilings and acoustic detailing.";
  const areas: string[] = [];
  const systems: string[] = [];

  if (isHotel) {
    summary = "Full drylining package to guestrooms, corridors and back-of-house — acoustic-rated partitions and MF ceilings throughout.";
    areas.push("Guestrooms (all floors)", "Corridors & lift lobbies", "BOH / plant rooms");
    systems.push("60min FR party walls (British Gypsum GypWall Robust)", "MF5 ceilings", "Shaftwall to risers");
  } else if (isTower) {
    summary = "Cat A/B drylining to office floors — partitions, linings, MF ceilings and riser shaftwall.";
    areas.push("Office floors", "Core linings", "WC pods");
    systems.push("Knauf Metal Stud partitions", "Rigitone perforated ceilings", "Siniat GTEC Shaftwall");
  } else if (isRetail) {
    summary = "Retail unit fit-out drylining — shopfront linings, tenant partitions, MF ceilings.";
    areas.push("Retail units (GF/L1)", "Common mall areas");
    systems.push("Steel-framed partitions", "Moisture-resistant board to WCs", "MF plasterboard ceilings");
  } else if (isFitout) {
    summary = "Cat B fit-out drylining — meeting rooms, breakouts, teapoints and acoustic pods.";
    areas.push("Meeting rooms", "Open-plan breakout", "Executive floor");
    systems.push("Double-boarded acoustic partitions (55dB Rw)", "Rockfon Mono ceilings");
  } else if (isResi) {
    summary = "Residential drylining — party walls, compartment linings, acoustic ceilings to Building Regs Part E.";
    areas.push("Apartments (all blocks)", "Communal corridors");
    systems.push("Part E-compliant party walls", "Resilient bar acoustic ceilings");
  } else {
    areas.push("All floors", "Core linings");
    systems.push("Metal-stud partitions", "MF ceilings");
  }

  const weeks = Math.max(8, Math.round(p.contractValue / 55000));
  const programme = `~${weeks} weeks on site — 2 gangs (boarders + tapers) + 1 ceiling fixer.`;
  return { summary, areas, systems, programme };
}

export type FollowUpEntry = {
  date: string;              // dd/mm/yyyy
  daysAgo: number;
  channel: "email" | "call" | "meeting" | "system";
  by: string;                // team member name
  note: string;
};

/**
 * Build a follow-up timeline from real project fields + deterministic filler.
 * Tenders show 1–2 entries (invite + pricing kick-off); awaiting show 3–5.
 */
export function getFollowUpHistory(p: Project): FollowUpEntry[] {
  const est = getAssignedEstimator(p);
  const entries: FollowUpEntry[] = [];
  const h = hash(p.id);

  // 1) Tender invite received
  const inviteDays = p.quoteSentDate
    ? (daysSince(p.quoteSentDate) ?? 0) + 7 + (h % 7)
    : 14 + (h % 10);
  entries.push({
    date: offsetToDisplay(-inviteDays),
    daysAgo: inviteDays,
    channel: "email",
    by: p.mainContractor,
    note: `Tender invitation received — RFQ pack + drawings issued (${p.name}).`,
  });

  // 2) Kick-off / pricing note
  entries.push({
    date: offsetToDisplay(-Math.max(1, inviteDays - 3 - (h % 3))),
    daysAgo: Math.max(1, inviteDays - 3 - (h % 3)),
    channel: "system",
    by: est.name,
    note: "Take-off started in Calculator; BoQ v1 drafted against tender drawings.",
  });

  // 3) Quote sent (if applicable)
  if (p.quoteSentDate) {
    const days = daysSince(p.quoteSentDate) ?? 0;
    entries.push({
      date: p.quoteSentDate,
      daysAgo: days,
      channel: "email",
      by: est.name,
      note: `Quotation issued to ${p.mainContractor}. Awaiting response.`,
    });

    if (p.status === "awaiting" && days >= 5) {
      entries.push({
        date: offsetToDisplay(-Math.max(1, days - 5)),
        daysAgo: Math.max(1, days - 5),
        channel: "call",
        by: est.name,
        note: `Chase call to ${p.mainContractor} — confirmed pack received, review in progress.`,
      });
    }
    if (p.status === "awaiting" && days >= 10) {
      entries.push({
        date: offsetToDisplay(-Math.max(1, days - 10)),
        daysAgo: Math.max(1, days - 10),
        channel: "email",
        by: est.name,
        note: "Follow-up email — asked for indicative decision date.",
      });
    }
  }

  // Sort newest first
  return entries.sort((a, b) => a.daysAgo - b.daysAgo);
}

function offsetToDisplay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}