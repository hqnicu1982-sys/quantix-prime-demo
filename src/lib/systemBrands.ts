// Mock brand catalog for the multi-system experiment.
// Each brand owns its own systems, accent colour and short marketing line.
// At this stage only British Gypsum has real data — the others are visual
// placeholders so we can iterate on UX before wiring up Lovable Cloud.

export type BrandId = "british-gypsum" | "knauf" | "siniat" | "fermacell";

export type Brand = {
  id: BrandId;
  name: string;
  initial: string;
  /** CSS colour (oklch) used for badges, pills, accents on hero */
  accent: string;
  /** Foreground colour used on top of `accent` for chips */
  accentInk: string;
  /** Short tagline shown under the brand chip */
  tagline: string;
  /** True when we have real systems wired up. Others show a "coming soon" banner. */
  hasCatalog: boolean;
  /** How many systems are advertised (real for BG, indicative for others) */
  systemCount: number;
};

export const BRANDS: Brand[] = [
  {
    id: "british-gypsum",
    name: "British Gypsum",
    initial: "BG",
    accent: "oklch(0.55 0.18 250)",   // blue
    accentInk: "oklch(0.99 0 0)",
    tagline: "Gyproc, Gypframe, GypLyner",
    hasCatalog: true,
    systemCount: 3,
  },
  {
    id: "knauf",
    name: "Knauf",
    initial: "K",
    accent: "oklch(0.58 0.21 27)",    // red
    accentInk: "oklch(0.99 0 0)",
    tagline: "Performer, Diamond, Safeboard",
    hasCatalog: false,
    systemCount: 0,
  },
  {
    id: "siniat",
    name: "Siniat",
    initial: "S",
    accent: "oklch(0.62 0.16 155)",   // green
    accentInk: "oklch(0.99 0 0)",
    tagline: "Megadeco, GTEC, Weather Defence",
    hasCatalog: false,
    systemCount: 0,
  },
  {
    id: "fermacell",
    name: "Fermacell",
    initial: "F",
    accent: "oklch(0.6 0.13 70)",     // amber
    accentInk: "oklch(0.99 0 0)",
    tagline: "Gypsum-fibre boards, dry screed",
    hasCatalog: false,
    systemCount: 0,
  },
];

export const getBrand = (id: BrandId): Brand =>
  BRANDS.find(b => b.id === id) ?? BRANDS[0];

const STORAGE_KEY = "qp-active-brand";

export function readActiveBrand(): BrandId {
  if (typeof window === "undefined") return "british-gypsum";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && BRANDS.some(b => b.id === stored)) return stored as BrandId;
  return "british-gypsum";
}

export function writeActiveBrand(id: BrandId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
  // notify listeners (BrandSelector + Calculator hero)
  window.dispatchEvent(new CustomEvent("qp-brand-change", { detail: id }));
}

export function subscribeBrand(cb: (id: BrandId) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<BrandId>).detail);
  window.addEventListener("qp-brand-change", handler);
  return () => window.removeEventListener("qp-brand-change", handler);
}
