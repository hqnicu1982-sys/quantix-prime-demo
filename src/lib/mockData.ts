// Quantix Prime — comprehensive mock data (v2)
// All data is hardcoded for the demo. Active project = Hotel Fitzrovia.

// ==================================================================
// USER & TEAM
// ==================================================================
export const currentUser = {
  id: "na",
  name: "Nick Andrei",
  role: "Site Manager",
  tier: "Pro",
  initials: "NA",
};

export type Persona = "site" | "commercial";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  tier: "Admin" | "Pro Control" | "Pro" | "Site User" | "Operative";
  initials: string;
  email?: string;
  joined: string;
  projects: number;
  capability: string;
  lastActive: string;
  status?: "pending" | "active";
};

export const team: TeamMember[] = [
  { id: "na", name: "Nick Andrei", role: "Site Manager", tier: "Pro", initials: "NA", joined: "Jan 2026", projects: 6, capability: "Upload price lists, create call-offs, log deliveries, raise dayworks", lastActive: "now", status: "active" },
  { id: "sm", name: "Sarah Mitchell", role: "Commercial QS", tier: "Pro Control", initials: "SM", joined: "Feb 2026", projects: 11, capability: "Approves call-offs, manages BoQ, signs invoices, owns financials", lastActive: "2h ago", status: "active" },
  { id: "dp", name: "David Park", role: "Managing Director", tier: "Admin", initials: "DP", joined: "Jan 2026", projects: 11, capability: "Full access, billing, user management", lastActive: "yesterday", status: "active" },
  { id: "mk", name: "Marcin Kowalski", role: "Lead Dryliner", tier: "Operative", initials: "MK", joined: "Mar 2026", projects: 2, capability: "View tasks, confirm labour hours", lastActive: "3h ago", status: "active" },
  { id: "ro", name: "Rachel Okonkwo", role: "Estimator", tier: "Pro", initials: "RO", joined: "Feb 2026", projects: 5, capability: "Builds BoQ, uses Calculator, read-only financials", lastActive: "yesterday", status: "active" },
  { id: "aj", name: "Andy Jones", role: "Lead Taper", tier: "Operative", initials: "AJ", joined: "Mar 2026", projects: 1, capability: "View tasks, confirm labour", lastActive: "1d ago", status: "active" },
  { id: "pw", name: "Paweł Wilkowski", role: "Foreman", tier: "Site User", initials: "PW", joined: "Mar 2026", projects: 3, capability: "View + log daily reports", lastActive: "4h ago", status: "active" },
  { id: "bd", name: "ben@drywallcrew.co.uk", role: "Pending invite", tier: "Site User", initials: "B", joined: "invited 18 Apr", projects: 0, capability: "—", lastActive: "—", status: "pending" },
];

// ==================================================================
// PROJECTS
// ==================================================================
export type Health = "healthy" | "watch" | "risk" | "starting";

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  mainContractor: string;
  contractValue: number;
  margin: number;
  progress: number;
  health: Health;
  startDate: string;
  endDate: string;
  hasFullData: boolean;
  /**
   * Our role on this project. Drives the Payments tab UI:
   *  - "subcontractor": we submit Applications, receive Notices/Certs
   *  - "main_contractor": we receive Applications, issue Notices/Certs
   * Defaults to "subcontractor" when undefined.
   */
  ourRole?: "subcontractor" | "main_contractor";
};

export const projects: Project[] = [
  { id: "fitzrovia", name: "Hotel Fitzrovia", subtitle: "Drylining · W1T 4JQ · Lvl 4–6", mainContractor: "Kier Construction", contractValue: 2100000, margin: 23.8, progress: 67, health: "healthy", startDate: "04/02/2026", endDate: "19/12/2026", hasFullData: true, ourRole: "subcontractor" },
  { id: "trafalgar", name: "Trafalgar Wharf — Blocks A & B", subtitle: "Fit-out · E16 · 148 units", mainContractor: "Wates Group", contractValue: 1840000, margin: 11.2, progress: 42, health: "risk", startDate: "12/11/2025", endDate: "30/10/2026", hasFullData: false },
  { id: "bermondsey", name: "Bermondsey Lofts", subtitle: "Specialty partitions · SE1 · 9 lofts", mainContractor: "ISG plc", contractValue: 680000, margin: 14.8, progress: 88, health: "watch", startDate: "08/09/2025", endDate: "30/05/2026", hasFullData: false },
  { id: "greenwich", name: "Greenwich Peninsula Phase 3", subtitle: "Drylining shell · SE10 · 212 units", mainContractor: "Multiplex Construction", contractValue: 1950000, margin: 26.4, progress: 31, health: "healthy", startDate: "06/01/2026", endDate: "15/01/2027", hasFullData: false },
  { id: "stratford", name: "Stratford Commercial Tower", subtitle: "Office fit-out · E15 · 18 floors", mainContractor: "Mace Group", contractValue: 1120000, margin: 28.7, progress: 94, health: "healthy", startDate: "20/05/2025", endDate: "15/06/2026", hasFullData: false },
  { id: "camden", name: "Camden Market Redevelopment", subtitle: "Acoustic partitions · NW1 · 28 units", mainContractor: "Kier Construction", contractValue: 495000, margin: 24.1, progress: 18, health: "starting", startDate: "10/03/2026", endDate: "30/09/2026", hasFullData: false },
];

export const projectsKpi = {
  totalValue: 8420000,
  weightedMargin: 22.1,
  marginDeltaQoQ: 0.4,
  atRisk: 2,
  mainContractors: 5,
};

// ==================================================================
// HOTEL FITZROVIA — DETAIL
// ==================================================================
export const fitzrovia = {
  id: "fitzrovia",
  name: "Hotel Fitzrovia",
  contractValue: 2100000,
  spent: 1070000,
  spentPct: 51,
  forecastMargin: 23.8,
  forecastProfit: 499000,
  progress: 67,
  programmeAhead: 3,
  estimatedBoq: 1599200,
  pricedBoq: 1548700,
  actualToDate: 1069400,
  savedVsEstimate: 50500,
};

export const fitzroviaSystems = [
  { name: "GypWall CLASSIC (C-48/70)", area: "2,840 m²", value: 198400, readiness: 96, color: "blue" as const },
  { name: "CasoLine MF ceilings", area: "4,120 m²", value: 162800, readiness: 100, color: "green" as const },
  { name: "ShaftWall (Knauf)", area: "410 m²", value: 87240, readiness: 62, color: "amber" as const },
  { name: "GypWall ROBUST (impact)", area: "340 m²", value: 34200, readiness: 100, color: "purple" as const },
];

export const fitzroviaHealth = [
  { label: "Programme", value: 85, status: "healthy" as Health, note: "Ahead +3d" },
  { label: "Budget", value: 62, status: "watch" as Health, note: "Over +£14k labour" },
  { label: "Quality (snag rate)", value: 93, status: "healthy" as Health, note: "1.8% · low" },
  { label: "Safety (near-misses)", value: 100, status: "healthy" as Health, note: "2 logged · open 0" },
];

export const fitzroviaActivity = [
  { id: 1, title: "Call-off #247 approved", who: "Sarah Mitchell QS", when: "today 09:14", tone: "success" as const },
  { id: 2, title: "BoQ rev 3.2 published", who: "Rachel Okonkwo", when: "yesterday 17:22", tone: "info" as const },
  { id: 3, title: "Price list uploaded — Minster (152 items, 3 review)", who: "Nick Andrei", when: "yesterday 14:48", tone: "info" as const },
  { id: 4, title: "Site delay: L5 ceilings rain 1.5d", who: "Nick Andrei", when: "Fri 17 Apr", tone: "warning" as const },
];

// ==================================================================
// DASHBOARD — MORNING BRIEFING
// ==================================================================
export const briefing = {
  date: "Monday 20 April 2026",
  greeting: "Good morning, Nick.",
  summary: "Hotel Fitzrovia is **3 days ahead** on the upper floors but **£14.2k over** on labour. Three things need your eyes today.",
};

export const dashboardKpis = [
  { label: "Project margin (today)", value: "23.8%", delta: "+1.2pp vs last week", trend: "up" as const, tone: "success" as const },
  { label: "Contract value remaining", value: "£1.42m", delta: "67.4% complete · £2.1m contract", trend: "flat" as const, tone: "neutral" as const },
  { label: "Labour vs BoQ (this week)", value: "+£14.2k", delta: "Level 4 drylining overspend", trend: "up" as const, tone: "danger" as const },
  { label: "Readiness next 2 weeks", value: "94%", delta: "18 of 19 tasks green", trend: "flat" as const, tone: "success" as const },
];

export const focusToday = [
  {
    id: 1,
    tone: "danger" as const,
    badge: "High impact",
    impact: "Est. £18k margin risk",
    title: "Approve Level 5 Knauf board call-off",
    body: "Site needs boards by 24 Apr. Order window closes in 1 day, 4 hours. Chosen supplier: Minster (£8.20/m² — £0.30 cheaper than CCF).",
    primary: { label: "Review & approve", to: "/calloffs" as const },
    secondary: { label: "Snooze" },
  },
  {
    id: 2,
    tone: "warning" as const,
    badge: "Reconcile",
    impact: "£1,247 variance",
    title: "Reconcile CCF invoice #CCF-10824",
    body: "Invoiced £8,340 vs PO £7,093. Likely cause: price uplift not reflected on PO.",
    primary: { label: "Open reconciliation", to: "/invoices" as const },
  },
  {
    id: 3,
    tone: "accent" as const,
    badge: "Investigate",
    impact: "Labour overrun",
    title: "Level 4 dryliners running 22% over BoQ hours",
    body: "Marcin's crew: planned 248h, burned 302h at 76% complete. Either re-baseline or raise a dayworks variation with Kier.",
    primary: { label: "View labour detail", to: "/projects/$projectId/labour" as const, projectId: "fitzrovia" },
    secondary: { label: "Raise dayworks" },
  },
];

export const marginTrend = [
  { week: "W7", budgeted: 26, actual: 28.2 },
  { week: "W8", budgeted: 26, actual: 27.4 },
  { week: "W9", budgeted: 26, actual: 25.1 },
  { week: "W10", budgeted: 26, actual: 22.8 },
  { week: "W11", budgeted: 26, actual: 21.9 },
  { week: "W12", budgeted: 26, actual: 22.4 },
  { week: "W13", budgeted: 26, actual: 22.6 },
  { week: "W14", budgeted: 26, actual: 23.8 },
];

export const weather = {
  location: "Fitzrovia W1T",
  temperature: "12°C",
  conditions: "Overcast · wind 14 mph",
  alert: "External board install Thu — Rain risk 68%",
};

export const onSiteToday = [
  { id: "marcin", name: "Marcin's Crew", count: 6, role: "dryliners", level: "L4", time: "07:12", status: "on-time" as const },
  { id: "andy", name: "Andy Jones Taper", count: 2, role: "tapers", level: "L3", time: "07:05", status: "on-time" as const },
  { id: "pawel", name: "Paweł's Crew", count: 4, role: "fixers", level: "L5", time: "08:14", status: "late" as const },
];

export const deliveriesToday = [
  { id: 1, supplier: "CCF", item: "220× Gyproc WallBoard", eta: "ETA 11:30", level: "Level 5", status: "inbound" as const },
  { id: 2, supplier: "Minster", item: "Rockwool RW3", eta: "Received 08:42 · signed AJ", level: "—", status: "done" as const },
];

// ==================================================================
// SYSTEM CATALOG (British Gypsum systems)
// ==================================================================
export type CatalogSystem = {
  code: string;
  name: string;
  category: string;
  fire: string;
  acoustic: string;
  spec: string;
  spec_label: string;
  price: number;
  badge: string;
  badgeTone: "success" | "info" | "neutral" | "warning" | "danger";
  iconColor: "blue" | "purple" | "green" | "amber" | "red" | "navy";
};

export const catalogCategories = [
  { id: "all", label: "All categories", count: 2847 },
  { id: "walls", label: "Walls", count: 714 },
  { id: "lining", label: "Wall lining", count: 328 },
  { id: "shaft", label: "ShaftWall", count: 186 },
  { id: "ceilings", label: "Ceilings", count: 562 },
  { id: "floors", label: "Floors", count: 241 },
  { id: "external", label: "External sheathing", count: 174 },
  { id: "plaster", label: "Plaster systems", count: 396 },
  { id: "steel", label: "Steel protection", count: 246 },
];

export const catalogSystems: CatalogSystem[] = [
  { code: "C-48/70", name: "GypWall CLASSIC", category: "walls", fire: "60 min", acoustic: "43 Rw dB", spec_label: "Height", spec: "4.2 m", price: 42.80, badge: "Popular", badgeTone: "success", iconColor: "blue" },
  { code: "C-70 IMP", name: "GypWall ROBUST", category: "walls", fire: "60 min", acoustic: "48 Rw dB", spec_label: "Impact", spec: "SD2", price: 56.40, badge: "Impact-rated", badgeTone: "info", iconColor: "purple" },
  { code: "MF-SUS", name: "CasoLine MF", category: "ceilings", fire: "30 min", acoustic: "37 Rw dB", spec_label: "Span", spec: "1.4 m", price: 34.20, badge: "Acoustic", badgeTone: "neutral", iconColor: "green" },
  { code: "S-CW", name: "ShaftWall S-CW", category: "shaft", fire: "120 min", acoustic: "52 Rw dB", spec_label: "Height", spec: "8.1 m", price: 78.60, badge: "120 min fire", badgeTone: "info", iconColor: "amber" },
  { code: "C-92/146", name: "GypWall QUIET", category: "walls", fire: "60 min", acoustic: "63 Rw dB", spec_label: "Height", spec: "5.8 m", price: 68.20, badge: "63 Rw dB", badgeTone: "success", iconColor: "amber" },
  { code: "FC-S", name: "FireCase S", category: "steel", fire: "240 min", acoustic: "—", spec_label: "Section", spec: "UB/UC", price: 92.40, badge: "240 min", badgeTone: "danger", iconColor: "red" },
];

// ==================================================================
// CALCULATOR — sample pre-fill
// ==================================================================
export const calculatorPreset = {
  system: { code: "C-48/70", name: "GypWall CLASSIC", subtitle: "Single layer · 60 min fire · 43 Rw dB" },
  area: 2840,
  height: 3.2,
  board: "Gyproc WallBoard 15 mm (standard)",
  insulation: "Rockwool RW3 50mm",
  sides: "Two layer × 2 sides",
  labourRate: 24.50,
  wastage: 7,
};

export const calculatorResults = {
  material: 108420,
  labour: 89840,
  total: 198260,
  perM2: 69.81,
  breakdown: [
    { name: "Gyproc WallBoard 15mm", detail: "12,168 m²", cost: 48672, color: "blue" as const },
    { name: "Gypframe C-48/70 studs", detail: "1,894 m", cost: 22348, color: "purple" as const },
    { name: "Rockwool RW3 50mm", detail: "2,840 m²", cost: 26106, color: "amber" as const },
    { name: "Jointing tape + compound", detail: "kit", cost: 8124, color: "green" as const },
    { name: "Screws + ancillaries", detail: "—", cost: 3170, color: "navy" as const },
  ],
  saving: 4380,
};

// ==================================================================
// COSTED BoQ
// ==================================================================
export type BoqRow = {
  code: string;
  name: string;
  subtitle: string;
  qty: number;
  unit: string;
  rate: number;
  ccf: number | null;
  minster: number | null;
  best: "ccf" | "minster" | "review";
  reviewNote?: string;
  saving: number;
};

export const costedBoqRows: BoqRow[] = [
  { code: "BQ-014", name: "Gyproc WallBoard 15mm tapered edge", subtitle: "GypWall CLASSIC · single layer", qty: 12168, unit: "m²", rate: 4.25, ccf: 4.18, minster: 3.92, best: "minster", saving: 4015 },
  { code: "BQ-015", name: "Gypframe stud C48/70 0.5mm", subtitle: "2.4m length · pre-galvanised", qty: 1894, unit: "m", rate: 12.40, ccf: 11.80, minster: 12.20, best: "ccf", saving: 1136 },
  { code: "BQ-022", name: "Rockwool RW3 50mm", subtitle: "Acoustic infill 1200×600", qty: 2840, unit: "m²", rate: 9.40, ccf: 9.05, minster: 9.68, best: "ccf", saving: 994 },
  { code: "BQ-031", name: "Gyproc SoundBloc 15mm", subtitle: "GypWall QUIET · acoustic grade", qty: 680, unit: "m²", rate: 6.80, ccf: 6.45, minster: 6.28, best: "minster", saving: 354 },
  { code: "BQ-044", name: "Glasroc F FireCase 20mm", subtitle: "Review: 2 possible matches", qty: 410, unit: "m²", rate: 18.60, ccf: null, minster: 17.85, best: "review", reviewNote: "2 possible matches", saving: 0 },
  { code: "BQ-051", name: "Drywall screws 3.5×35mm", subtitle: "Self-tapping · 1000 pack", qty: 24, unit: "pack", rate: 8.20, ccf: 7.40, minster: 7.90, best: "ccf", saving: 12 },
  { code: "BQ-058", name: "Joint tape + compound (kit)", subtitle: "Gyproc ProMix · 20L", qty: 48, unit: "kit", rate: 14.80, ccf: 14.20, minster: 13.65, best: "minster", saving: 55 },
];

export const costedBoqKpi = {
  estimated: 1599200,
  cheapest: 1548700,
  singleSupplier: 1583400,
  notPriced: 4,
  coverage: 95,
  totalSaving: 50466,
};

// ==================================================================
// PRICE INTELLIGENCE
// ==================================================================
export const priceIntelKpi = {
  itemsTracked: 234,
  ccfItems: 82,
  minsterItems: 152,
  avgUplift: 2.4,
  marketAvg: 1.1,
  bestSaving: 4015,
  marketCoverage: 2,
  marketTotal: 5,
};

export const priceTrend = [
  { week: "W7", ccf: 4.20, minster: 4.10 },
  { week: "W8", ccf: 4.18, minster: 4.10 },
  { week: "W9", ccf: 4.15, minster: 4.15 },
  { week: "W10", ccf: 4.22, minster: 4.10 },
  { week: "W11", ccf: 4.20, minster: 4.05 },
  { week: "W12", ccf: 4.21, minster: 3.98 },
  { week: "W13", ccf: 4.19, minster: 3.95 },
  { week: "W14", ccf: 4.18, minster: 3.92 },
];

export const topMovers = [
  { item: "Gyproc FireLine 15mm", supplier: "CCF", was: 6.84, now: 7.58, pct: 10.8, dir: "up" as const },
  { item: "Rockwool RW3 100mm", supplier: "Minster", was: 14.20, now: 15.10, pct: 6.3, dir: "up" as const },
  { item: "Gyproc WallBoard 15mm", supplier: "Minster", was: 4.10, now: 3.92, pct: 4.4, dir: "down" as const },
  { item: "Gypframe U-track 50mm", supplier: "CCF", was: 2.84, now: 2.72, pct: 4.2, dir: "down" as const },
];

export const priceAlerts = [
  { id: 1, tone: "warning" as const, title: "FireLine 15mm up 10.8% at CCF", body: "Your Hotel Fitzrovia BoQ has 340m² of this. New price adds £440 to budget. Minster still at £6.84 — consider switching.", action: "Review" },
  { id: 2, tone: "info" as const, title: "WallBoard 15mm now cheaper at Minster", body: "Dropped from £4.10 to £3.92. Your outstanding orders (1,850m²) would save £333 if switched.", action: "Switch" },
];

// ==================================================================
// PRICE LIST UPLOADS
// ==================================================================
export const priceListUploads = [
  { id: 1, name: "Minster Price List April 2026.xlsx", date: "18 Apr 14:48", items: 152, matched: 149, review: 3, status: "ok" as const },
  { id: 2, name: "CCF Catalogue Q2 2026.pdf", date: "17 Apr 09:15", items: 82, matched: 76, review: 4, historical: 2, status: "ok" as const },
  { id: 3, name: "Travis Perkins Price Sheet.pdf", date: "12 Apr", items: 48, matched: 29, review: 19, status: "review" as const },
];

export const ambiguousMatches = [
  {
    id: 1,
    raw: "GLASROC F 20MM FIRECASE BRD",
    options: [
      { match: "Glasroc F FireCase 20mm", confidence: 68 },
      { match: "Glasroc S Multi-Board 20mm", confidence: 52 },
    ],
  },
];

export const livePreview = [
  { raw: "GYPROC WALLBD 15MM TE 1200X2400", matched: "Gyproc WallBoard 15mm tapered edge 1200×2400", confidence: 94, boqRef: "#14" },
  { raw: "GYPFRAME C48 STUD 2.4M PG", matched: "Gypframe stud C48/70 0.5mm 2.4m", confidence: 92, boqRef: "#15" },
  { raw: "ROCKWL RW3 50MM 1200X600", matched: "Rockwool RW3 50mm 1200×600", confidence: 91, boqRef: "#22" },
];

// ==================================================================
// CALL-OFFS
// ==================================================================
export type CallOffState = "draft" | "submitted" | "reviewed" | "approved" | "po-sent" | "in-delivery" | "closed" | "review-needed";

export type CallOff = {
  ref: string;
  item: string;
  subtitle: string;
  supplier: "CCF" | "Minster";
  qty: string;
  value: number;
  state: CallOffState;
  needBy: string;
  needByOverdue?: boolean;
};

export const callOffs: CallOff[] = [
  { ref: "CO-247", item: "Gyproc WallBoard 15mm", subtitle: "Level 5 Apartment walls", supplier: "Minster", qty: "1,850 m²", value: 7252, state: "approved", needBy: "24 Apr 2026" },
  { ref: "CO-246", item: "Rockwool RW3 50mm", subtitle: "L4 acoustic infill", supplier: "CCF", qty: "840 m²", value: 7602, state: "review-needed", needBy: "22 Apr 2026", needByOverdue: true },
  { ref: "CO-245", item: "Gypframe studs C48/70", subtitle: "L5+L6", supplier: "CCF", qty: "1,200 m", value: 14160, state: "in-delivery", needBy: "21 Apr · partial" },
  { ref: "CO-244", item: "Gyproc SoundBloc 15mm", subtitle: "GypWall QUIET · L3", supplier: "Minster", qty: "680 m²", value: 4270, state: "draft", needBy: "28 Apr 2026" },
  { ref: "CO-243", item: "MF ceiling kit (CasoLine)", subtitle: "L2 ceiling grid", supplier: "CCF", qty: "420 m²", value: 5124, state: "po-sent", needBy: "26 Apr 2026" },
];

export const callOffTabs = [
  { id: "all", label: "All", count: 47 },
  { id: "draft", label: "Draft", count: 5 },
  { id: "submitted", label: "Submitted", count: 3 },
  { id: "reviewed", label: "Reviewed", count: 2 },
  { id: "approved", label: "Approved", count: 4 },
  { id: "in-delivery", label: "In delivery", count: 8 },
  { id: "closed", label: "Closed", count: 25 },
];

export const callOffStateMachine = [
  { id: "draft", label: "Draft", who: "NA", when: "18 Apr 09:14", status: "done" as const },
  { id: "submitted", label: "Submitted", who: "NA", when: "18 Apr 11:02", status: "done" as const },
  { id: "reviewed", label: "Reviewed", who: "Sarah M", when: "18 Apr 14:28", status: "done" as const },
  { id: "approved", label: "Approved", who: "Sarah M", when: "today 09:14", status: "current" as const },
  { id: "po-sent", label: "PO sent", who: "—", when: "pending", status: "pending" as const },
  { id: "delivered", label: "Delivered", who: "—", when: "ETA 24 Apr", status: "pending" as const },
  { id: "closed", label: "Closed", who: "—", when: "—", status: "pending" as const },
];

// ==================================================================
// INVOICES
// ==================================================================
export type Invoice = {
  id: string;
  supplier: "CCF" | "Minster";
  state: "matched" | "needs-review" | "disputed";
  received: string;
  matchedAt?: string;
  poRef: string;
  callOffRef: string;
  invoiced: number;
  expected: number;
  variance: number;
  variancePct: number;
  lineDetail: string;
  alert?: string;
};

export const invoices: Invoice[] = [
  {
    id: "CCF-10821",
    supplier: "CCF",
    state: "matched",
    received: "18 Apr",
    matchedAt: "18 Apr 15:32",
    poRef: "PO-00247",
    callOffRef: "CO-247",
    invoiced: 7252,
    expected: 7252,
    variance: 0,
    variancePct: 0,
    lineDetail: "1,850 m² Gyproc WallBoard @ £3.92",
  },
  {
    id: "CCF-10824",
    supplier: "CCF",
    state: "needs-review",
    received: "today 09:42",
    poRef: "PO-00248",
    callOffRef: "CO-249",
    invoiced: 8340,
    expected: 7093,
    variance: 1247,
    variancePct: 17.6,
    lineDetail: "840 m² Rockwool @ £9.93 invoice vs £8.45 PO",
    alert: "Price uplift not reflected on PO. Likely supplier forgot to apply agreed Q2 contract rate.",
  },
  {
    id: "MIN-8472",
    supplier: "Minster",
    state: "disputed",
    received: "15 Apr",
    matchedAt: "Disputed 16 Apr",
    poRef: "PO-00245",
    callOffRef: "CO-243",
    invoiced: 5684,
    expected: 5124,
    variance: 560,
    variancePct: 10.9,
    lineDetail: "Over-delivery: invoice shows 445 m² delivered, PO was 420 m². Site confirmed only 420 m² received — possible short-pick error. Awaiting Minster credit note.",
  },
];

export const invoiceKpi = {
  total: 34,
  autoMatched: 28,
  flagged: 4,
  flaggedVariance: 2148,
  disputed: 2,
};

export const reconFlow = [
  { id: 1, label: "BoQ estimate", value: 1599200, tone: "neutral" as const },
  { id: 2, label: "Costed BoQ (priced)", value: 1548700, tone: "info" as const },
  { id: 3, label: "PO / Call-off (approved)", value: 1480000, tone: "warning" as const, suffix: "committed" },
  { id: 4, label: "Invoice (actual)", value: 1069400, tone: "success" as const, suffix: "paid" },
];

// ==================================================================
// FINANCIAL DASHBOARD
// ==================================================================
export const financialKpi = {
  revenueMtd: 342180,
  revenueTarget: 320000,
  revenueDeltaPct: 6.9,
  cogsMtd: 268420,
  cogsRevenuePct: 78.4,
  cogsBudgetPct: 76,
  margin: 73760,
  marginPct: 21.6,
  marginBudgetPct: 24,
  cashRunway: 14.2,
  cashCurrent: 482000,
};

export const projectMargins = projects.map((p) => ({
  name: p.name.split(" ").slice(0, 2).join(" "),
  margin: p.margin,
  health: p.health,
}));

export const pnlSummary = {
  revenue: [
    { label: "Contract billings", value: 342180 },
    { label: "Dayworks variations", value: 8240 },
    { label: "Retention released", value: 4800 },
  ],
  revenueTotal: 355220,
  costs: [
    { label: "Materials", value: 168200 },
    { label: "Labour (subcontract)", value: 88400 },
    { label: "Plant & tools", value: 6420 },
    { label: "Site expenses", value: 5400 },
  ],
  costsTotal: 268420,
  grossProfit: 86800,
  grossPct: 24.4,
  overheads: [
    { label: "Office", value: 12400 },
    { label: "Insurance", value: 3200 },
    { label: "Vehicles", value: 5800 },
    { label: "Software", value: 840 },
  ],
  overheadsTotal: 22240,
  netProfit: 64560,
  netPct: 18.2,
};

export const cashflow30 = [
  { d: 1, cash: 380 }, { d: 5, cash: 410 }, { d: 10, cash: 420 }, { d: 15, cash: 460 },
  { d: 20, cash: 472 }, { d: 25, cash: 478 }, { d: 30, cash: 482 },
];

export const topSuppliersSpend = [
  { name: "CCF", value: 68000 },
  { name: "Minster", value: 52000 },
  { name: "Travis Perkins", value: 14000 },
  { name: "Wickes", value: 8000 },
  { name: "Jewson", value: 6000 },
];

export const retentionHeld = [
  { mc: "Kier", value: 42000 },
  { mc: "Wates", value: 18000 },
  { mc: "Multiplex", value: 24000 },
];

// ==================================================================
// PLANNER (GANTT)
// ==================================================================
export type GanttRow = {
  id: number;
  level: string;
  task: string;
  crew: string;
  startDay: number; // 0..20 (Apr 20 = 0)
  duration: number;
  progress: number;
  color: "blue" | "green" | "amber" | "red" | "purple" | "grey";
  alert?: string;
  isMilestone?: boolean;
};

export const ganttRows: GanttRow[] = [
  { id: 1, level: "Level 5", task: "Framing", crew: "Marcin's Crew", startDay: 1, duration: 5, progress: 100, color: "blue" },
  { id: 2, level: "Level 5", task: "Boarding", crew: "Marcin's Crew", startDay: 4, duration: 7, progress: 40, color: "blue" },
  { id: 3, level: "Level 5", task: "Taping", crew: "Andy Jones", startDay: 9, duration: 6, progress: 0, color: "green" },
  { id: 4, level: "Level 6", task: "Framing", crew: "Paweł's Crew", startDay: 6, duration: 6, progress: 0, color: "blue" },
  { id: 5, level: "Level 6", task: "Boarding", crew: "Marcin's Crew", startDay: 10, duration: 7, progress: 0, color: "blue", alert: "Material readiness: Rockwool short" },
  { id: 6, level: "Level 6", task: "Taping", crew: "Andy Jones", startDay: 15, duration: 6, progress: 0, color: "green" },
  { id: 7, level: "ShaftWall A", task: "Framing", crew: "Paweł's Crew", startDay: 2, duration: 7, progress: 60, color: "amber" },
  { id: 8, level: "ShaftWall A", task: "Boarding", crew: "Paweł's Crew", startDay: 7, duration: 8, progress: 0, color: "amber" },
  { id: 9, level: "ShaftWall B", task: "Framing (delayed)", crew: "Paweł's Crew", startDay: 4, duration: 8, progress: 0, color: "red" },
  { id: 10, level: "Ceilings L4", task: "MF grid", crew: "MF subcontractor", startDay: 1, duration: 6, progress: 80, color: "purple" },
  { id: 11, level: "Ceilings L5", task: "MF grid", crew: "MF subcontractor", startDay: 8, duration: 5, progress: 0, color: "purple" },
  { id: 12, level: "Inspection", task: "Taping checkpoint", crew: "Kier QA", startDay: 14, duration: 1, progress: 0, color: "grey", isMilestone: true },
  { id: 13, level: "Milestone", task: "Lvl 5 handover", crew: "—", startDay: 16, duration: 1, progress: 0, color: "grey", isMilestone: true },
  { id: 14, level: "Snag", task: "Snag list closeout", crew: "Marcin's Crew", startDay: 17, duration: 3, progress: 0, color: "grey" },
];

// ==================================================================
// MATERIAL READINESS
// ==================================================================
export type ReadinessRow = {
  id: number;
  task: string;
  start: string;
  crew: string;
  status: "READY" | "AT_RISK" | "BLOCKED";
  required: { name: string; qty: string }[];
  note: string;
  action?: string;
};

export const readinessRows: ReadinessRow[] = [
  { id: 1, task: "Level 5 Boarding", start: "Thu 23 Apr", crew: "Marcin's Crew", status: "READY",
    required: [
      { name: "Gyproc WallBoard 15mm", qty: "1,850 m²" },
      { name: "Gypframe studs C48", qty: "620 m" },
      { name: "Drywall screws", qty: "—" },
    ],
    note: "All materials confirmed on site or inbound · Order placed CO-247 · Delivery ETA 24 Apr 11:30" },
  { id: 2, task: "Level 6 Boarding", start: "Wed 29 Apr", crew: "Marcin's Crew", status: "AT_RISK",
    required: [
      { name: "Gyproc WallBoard 15mm", qty: "1,200 m²" },
      { name: "Gypframe studs", qty: "520 m" },
      { name: "Rockwool RW3 50mm", qty: "680 m²" },
    ],
    note: "Rockwool shortage — only 420m² on site, need 680m², lead time 5 days. Raise call-off for 260m² Rockwool today to meet start date.",
    action: "Create call-off" },
  { id: 3, task: "ShaftWall Core A Boarding", start: "Mon 27 Apr", crew: "Paweł's Crew", status: "READY",
    required: [{ name: "Glasroc F FireCase 20mm", qty: "410 m²" }],
    note: "Confirmed on site" },
  { id: 4, task: "Ceilings L5 MF Grid", start: "Tue 28 Apr", crew: "MF subcontractor", status: "READY",
    required: [{ name: "MF ceiling kit (CasoLine)", qty: "—" }],
    note: "CO-243 approved, PO sent" },
  { id: 5, task: "Level 6 Framing", start: "Sat 26 Apr", crew: "Paweł's Crew", status: "READY",
    required: [
      { name: "Gypframe studs", qty: "620 m" },
      { name: "U-track", qty: "180 m" },
    ],
    note: "CO-245 in delivery, partial received" },
];

// ==================================================================
// DAILY SITE REPORT
// ==================================================================
export const dailyReport = {
  date: "Monday 20 April 2026",
  weather: "Overcast 12°C / wind 14 mph",
  hours: "07:00 → 16:30",
  mainContractor: "Kier Construction",
  projectRef: "KC-FZR-2026",
  signedIn: 13,
  signedOut: 11,
  labour: [
    { crew: "Marcin Kowalski + 5 dryliners", inTime: "07:12", outTime: "16:30", hours: 9.3, work: "L4 + L5 boarding" },
    { crew: "Andy Jones + 2 tapers", inTime: "07:05", outTime: "16:30", hours: 9.4, work: "L4 taping & jointing" },
    { crew: "Paweł Wilkowski + 3 fixers", inTime: "08:14", outTime: "16:30", hours: 8.3, work: "L6 framing setup", late: true },
  ],
  materials: [
    { ref: "DN-88421", supplier: "Minster", item: "220 × Rockwool RW3 50mm (1,560m²)", time: "08:42", signed: "AJ", status: "ok" as const },
    { ref: "—", supplier: "CCF", item: "220 × Gyproc WallBoard", time: "expected 11:30", signed: "—", status: "pending" as const },
  ],
  workDone: [
    "Level 4 taping: completed rooms 4.12 to 4.18 (120m², 62% of total L4 taping now done)",
    "Level 5 framing: completed corridor grid (42m run)",
    "Level 6: setup + RAMS review with Paweł's crew",
    "Snag closure: 4 items signed off from last week's inspection",
  ],
  issues: [
    "Near-miss logged: trip hazard from temporary cabling L4 stair — resolved, photo attached",
    "Dayworks raised: 4.5h overtime on Saturday for rain make-up, sent to QS",
  ],
  tomorrow: [
    "Level 5 framing continues (L5 main corridor)",
    "Level 4 taping completion",
    "Deliveries expected: Gyproc tape + compound, CCF",
    "Inspection 14:00 by Kier site manager (Alex P)",
  ],
  submittedBy: "Nick Andrei",
  submittedAt: "17:24 (draft)",
};

// ==================================================================
// INTEGRATIONS
// ==================================================================
export const integrations = [
  { id: "xero", name: "Xero", category: "Accounting", connected: true, lastSync: "5 minutes ago", stats: "24 POs · 18 invoices · 2 errors" },
  { id: "qb", name: "QuickBooks", category: "Accounting", connected: false },
  { id: "sage", name: "Sage 50", category: "Accounting", connected: false },
  { id: "asta", name: "Asta Powerproject", category: "Programme", connected: true, lastSync: "1 hour ago" },
  { id: "msp", name: "MS Project", category: "Programme", connected: false },
  { id: "procore", name: "Procore", category: "Main contractor", connected: false, note: "For main contractors who mandate Procore" },
  { id: "slack", name: "Slack", category: "Collaboration", connected: false },
  { id: "teams", name: "Microsoft Teams", category: "Collaboration", connected: false },
];

// ==================================================================
// HELPERS
// ==================================================================
export function fmtMoney(n: number, opts: { compact?: boolean; prefix?: boolean } = {}): string {
  const { compact = false, prefix = true } = opts;
  if (compact && Math.abs(n) >= 1_000_000) return `${prefix ? "£" : ""}${(n / 1_000_000).toFixed(2)}m`;
  if (compact && Math.abs(n) >= 1_000) return `${prefix ? "£" : ""}${Math.round(n / 1_000)}k`;
  return `${prefix ? "£" : ""}${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}
