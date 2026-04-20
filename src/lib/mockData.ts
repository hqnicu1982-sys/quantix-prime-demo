// Quantix Prime — mock data

export type Status = "READY" | "AT_RISK" | "BLOCKED" | "OVERDUE";

// ====================== PROJECTS ======================
export type Project = {
  id: string;
  name: string;
  contractValue: string;
  contractValueNum: number;
  mainContractor: string;
  startDate: string;
  endDate: string;
  phase: string;
  weekCurrent: number;
  weekTotal: number;
  status: "active" | "completed";
  hasFullData: boolean;
};

export const projects: Project[] = [
  { id: "fitzrovia", name: "Hotel Fitzrovia", contractValue: "£2.1M", contractValueNum: 2100000, mainContractor: "Kier Construction", startDate: "05/01/2026", endDate: "28/08/2026", phase: "Internal Fit-out", weekCurrent: 14, weekTotal: 32, status: "active", hasFullData: true },
  { id: "canary", name: "Office Refurb Canary Wharf", contractValue: "£890k", contractValueNum: 890000, mainContractor: "Skanska", startDate: "10/02/2026", endDate: "18/06/2026", phase: "Strip-out & framing", weekCurrent: 8, weekTotal: 18, status: "active", hasFullData: false },
  { id: "westfield", name: "Retail Fit-Out Westfield", contractValue: "£340k", contractValueNum: 340000, mainContractor: "ISG", startDate: "02/09/2025", endDate: "20/12/2025", phase: "Completed", weekCurrent: 16, weekTotal: 16, status: "completed", hasFullData: false },
];

// Backwards compat
export const project = {
  name: projects[0].name,
  contractValue: projects[0].contractValue,
  mainContractor: projects[0].mainContractor,
  startDate: projects[0].startDate,
  endDate: projects[0].endDate,
};

// ====================== TEAM ======================
export const team = [
  { id: "np", name: "Nick Popescu", role: "Site Manager", initials: "NP" },
  { id: "js", name: "John Smith", role: "Commercial Manager / QS", initials: "JS" },
  { id: "sw", name: "Sarah Williams", role: "Buyer", initials: "SW" },
  { id: "mt", name: "Mike Thompson", role: "Foreman", initials: "MT" },
];

// ====================== TODAY KPIs ======================
export const todayKpis = {
  operatives: 14,
  dayCost: 3640,
  deliveries: [
    { supplier: "SIG", time: "10:00" },
    { supplier: "CCF", time: "14:00" },
    { supplier: "Knauf", time: "16:00" },
  ],
  tasksReady: 11,
  tasksTotal: 14,
  weeklyMargin: 1240,
  ppc: 82,
};

// ====================== ROADBLOCKS ======================
export const roadblocks = [
  { id: 1, title: "Ceiling grid Level 2 — SIG delivery slipped 3 days", severity: "AT_RISK" as Status, when: "2 days ago", reason: "Supplier transport delay; replacement order placed with CCF", affected: ["MF Ceiling L2 — Zone B"], owner: "Sarah Williams" },
  { id: 2, title: "Fire-rated board shortage — no PO raised for FireLine 15mm", severity: "BLOCKED" as Status, when: "today", reason: "Procurement gap — risers due to start Wed 23/04", affected: ["Fire stopping L2", "Riser cupboards L2"], owner: "Sarah Williams" },
  { id: 3, title: "Level 4 electrical first fix — waiting on MC clearance", severity: "AT_RISK" as Status, when: "yesterday", reason: "Kier pending sign-off on services route revision", affected: ["Boarding L4 — Corridor"], owner: "Nick Popescu" },
];

// ====================== MARGIN TREND ======================
export const marginTrend = [
  { week: "W7", margin: 18.0, target: 18 },
  { week: "W8", margin: 17.4, target: 18 },
  { week: "W9", margin: 16.9, target: 18 },
  { week: "W10", margin: 16.2, target: 18 },
  { week: "W11", margin: 15.8, target: 18 },
  { week: "W12", margin: 15.1, target: 18 },
  { week: "W13", margin: 14.6, target: 18 },
  { week: "W14", margin: 14.2, target: 18 },
];

export const commercialActions = [
  { id: 1, title: "4 invoices need review", detail: "£890 total variance flagged", action: "Review" },
  { id: 2, title: "SIG board price up 4%", detail: "Compare with CCF alternative — potential £620 saving", action: "Compare" },
  { id: 3, title: "Labour over budget on Level 3", detail: "+£420 vs BoQ allowance", action: "Investigate" },
];

export const supplierConcentration = [
  { supplier: "SIG", pct: 42, amount: 86000 },
  { supplier: "CCF", pct: 28, amount: 57400 },
  { supplier: "Jewson", pct: 18, amount: 36900 },
  { supplier: "British Gypsum", pct: 8, amount: 16400 },
  { supplier: "Other", pct: 4, amount: 8200 },
];

export const monthlyMini = [
  { week: "W11", revenue: 42000, cost: 36500 },
  { week: "W12", revenue: 46000, cost: 39800 },
  { week: "W13", revenue: 48000, cost: 41200 },
  { week: "W14", revenue: 48000, cost: 40500 },
];

// ====================== WEEKLY TASKS ======================
export type Task = {
  id: number;
  title: string;
  crew: string;
  operatives: number;
  duration: string;
  day: number; // 0..9 (2 weeks)
  span: number;
  system: "L3 Partitions" | "L2 Partitions" | "L3 Ceilings";
  status: Status;
  constraints: { materials: boolean; labour: boolean; preceding: boolean; permits: boolean };
  reasonForVariance?: string;
};

export const weeklyTasks: Task[] = [
  { id: 1, title: "Partitions L3 — Grid 1-5", crew: "Crew A", operatives: 4, duration: "2 days", day: 0, span: 2, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 2, title: "MF Ceiling L2 — Zone B", crew: "Crew B", operatives: 3, duration: "3 days", day: 0, span: 3, system: "L3 Ceilings", status: "AT_RISK", constraints: { materials: false, labour: true, preceding: true, permits: true }, reasonForVariance: "SIG delivery slipped 3 days; CCF substitution underway" },
  { id: 3, title: "Boarding L4 — Corridor", crew: "Crew C", operatives: 3, duration: "2 days", day: 2, span: 2, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 4, title: "Fire stopping L2 risers", crew: "Crew D", operatives: 2, duration: "1 day", day: 3, span: 1, system: "L2 Partitions", status: "BLOCKED", constraints: { materials: false, labour: true, preceding: false, permits: true }, reasonForVariance: "FireLine 15mm — no PO raised; predecessor incomplete" },
  { id: 5, title: "Skim coat L1 lobby", crew: "Crew A", operatives: 2, duration: "1 day", day: 2, span: 1, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 6, title: "Bulkheads L3", crew: "Crew B", operatives: 2, duration: "2 days", day: 3, span: 2, system: "L3 Ceilings", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 7, title: "Tape & joint L4", crew: "Crew C", operatives: 3, duration: "2 days", day: 0, span: 2, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 8, title: "Riser cupboards L2", crew: "Crew D", operatives: 2, duration: "1 day", day: 4, span: 1, system: "L2 Partitions", status: "AT_RISK", constraints: { materials: true, labour: true, preceding: true, permits: false }, reasonForVariance: "Hot works permit pending" },
  { id: 9, title: "Acoustic batt insulation L3", crew: "Crew A", operatives: 2, duration: "1 day", day: 9, span: 1, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 10, title: "Track set out L5", crew: "Crew E", operatives: 2, duration: "1 day", day: 5, span: 1, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 11, title: "Wet area boarding L2", crew: "Crew B", operatives: 3, duration: "2 days", day: 7, span: 2, system: "L2 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 12, title: "Door linings L3", crew: "Crew C", operatives: 2, duration: "1 day", day: 9, span: 1, system: "L3 Partitions", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 13, title: "Suspended ceiling L1", crew: "Crew D", operatives: 3, duration: "2 days", day: 6, span: 2, system: "L3 Ceilings", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 14, title: "MF perimeter L4", crew: "Crew E", operatives: 2, duration: "1 day", day: 8, span: 1, system: "L3 Ceilings", status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
];

// ====================== OPERATIVES ======================
export const operatives = [
  { id: 1, name: "James Whittaker", role: "Charge hand", crew: "Crew A", clockIn: "07:02", dayRate: 280 },
  { id: 2, name: "Liam O'Connor", role: "Dryliner", crew: "Crew A", clockIn: "07:05", dayRate: 240 },
  { id: 3, name: "Daniel Pereira", role: "Dryliner", crew: "Crew A", clockIn: "07:01", dayRate: 240 },
  { id: 4, name: "Marcus Johnson", role: "Charge hand", crew: "Crew B", clockIn: "06:58", dayRate: 280 },
  { id: 5, name: "Sean Murphy", role: "Ceiling fixer", crew: "Crew B", clockIn: "07:10", dayRate: 250 },
  { id: 6, name: "Andrei Popescu", role: "Dryliner", crew: "Crew C", clockIn: "07:00", dayRate: 240 },
  { id: 7, name: "Tomasz Kowalski", role: "Tape & joint", crew: "Crew C", clockIn: "07:03", dayRate: 230 },
  { id: 8, name: "David Hughes", role: "Labourer", crew: "Crew D", clockIn: "07:15", dayRate: 200 },
  { id: 9, name: "Ryan Patel", role: "Dryliner", crew: "Crew D", clockIn: "07:08", dayRate: 240 },
  { id: 10, name: "Connor Walsh", role: "Ceiling fixer", crew: "Crew E", clockIn: "07:12", dayRate: 250 },
  { id: 11, name: "Aleksy Nowak", role: "Dryliner", crew: "Crew E", clockIn: "07:04", dayRate: 240 },
  { id: 12, name: "Owen Davies", role: "Labourer", crew: "Crew A", clockIn: "07:20", dayRate: 200 },
  { id: 13, name: "Kieran Brown", role: "Dryliner", crew: "Crew B", clockIn: "07:06", dayRate: 240 },
  { id: 14, name: "Filip Janowski", role: "Tape & joint", crew: "Crew C", clockIn: "07:09", dayRate: 230 },
];

// ====================== LABOUR vs BoQ ======================
export const labourVsBoq = [
  { task: "Partitions L3", hours: 48, allowance: 52, variance: -120, progress: "60m² of 240m²", pct: 25 },
  { task: "Ceilings L2", hours: 36, allowance: 28, variance: 240, progress: "40m² of 180m²", pct: 22 },
  { task: "Firestopping L3", hours: 12, allowance: 16, variance: -96, progress: "15 of 22 penetrations", pct: 68 },
  { task: "Tape & joint L4", hours: 18, allowance: 20, variance: -50, progress: "32m² of 90m²", pct: 36 },
  { task: "Skim L1 lobby", hours: 9, allowance: 8, variance: 30, progress: "Complete", pct: 100 },
];

export const dayworks = [
  { id: 1, supplier: "MTech Electrical", description: "3 operatives × 2 days", amount: 1440, status: "approved", approver: "John Smith (QS)" },
  { id: 2, supplier: "Heritage Joinery", description: "2 operatives × 1 day", amount: 520, status: "pending" },
  { id: 3, supplier: "ABC Firestopping", description: "1 operative × 0.5 day", amount: 140, status: "pending" },
];

// ====================== BoQ ======================
export const boqItems = [
  "100mm partitions Level 3 — £45/m² — 240m²",
  "70mm partitions Level 2 — £42/m² — 160m²",
  "MF Ceiling Level 2 — £38/m² — 180m²",
  "Boarding Level 4 — £18/m² — 320m²",
  "Tape & joint Level 4 — £9/m² — 90m²",
  "Fire stopping Level 3 — £24/lm — 22 penetrations",
  "Skim coat Level 1 lobby — £12/m² — 60m²",
  "Suspended ceiling Level 1 — £35/m² — 220m²",
];

// ====================== COSTED BoQ (full) ======================
export type BoqRow = {
  code: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  value: number;
  cheapest: number;
  costVar: number;
  marginImpact: number;
  system: "L3 Partitions" | "L2 Partitions" | "L3 Ceilings" | "Firestopping" | "Miscellaneous";
};

export const costedBoq: BoqRow[] = [
  // L3 Partitions (8)
  { code: "P3.01", description: "100mm metal stud partition, 1x12.5mm board both sides", qty: 240, unit: "m²", rate: 45, value: 10800, cheapest: 41.20, costVar: -912, marginImpact: 912, system: "L3 Partitions" },
  { code: "P3.02", description: "Plasterboard wallboard 12.5mm 1200x2400", qty: 380, unit: "sht", rate: 5.85, value: 2223, cheapest: 5.62, costVar: -87, marginImpact: 87, system: "L3 Partitions" },
  { code: "P3.03", description: "Metal stud 70mm x 2.7m", qty: 280, unit: "lm", rate: 3.20, value: 896, cheapest: 2.95, costVar: -70, marginImpact: 70, system: "L3 Partitions" },
  { code: "P3.04", description: "Acoustic batt insulation 50mm", qty: 240, unit: "m²", rate: 12.80, value: 3072, cheapest: 12.20, costVar: -144, marginImpact: 144, system: "L3 Partitions" },
  { code: "P3.05", description: "Skirting & shadow gap detail", qty: 180, unit: "lm", rate: 8.50, value: 1530, cheapest: 8.20, costVar: -54, marginImpact: 54, system: "L3 Partitions" },
  { code: "P3.06", description: "Drywall screws 25mm 1000pk", qty: 12, unit: "box", rate: 9.80, value: 117.60, cheapest: 9.40, costVar: -4.80, marginImpact: 5, system: "L3 Partitions" },
  { code: "P3.07", description: "Tape & joint Level 5 finish", qty: 480, unit: "m²", rate: 9, value: 4320, cheapest: 8.80, costVar: -96, marginImpact: 96, system: "L3 Partitions" },
  { code: "P3.08", description: "Door lining sets — single FD30", qty: 22, unit: "set", rate: 145, value: 3190, cheapest: 138, costVar: -154, marginImpact: 154, system: "L3 Partitions" },
  // L2 Partitions (5)
  { code: "P2.01", description: "70mm metal stud partition, 1x12.5mm board", qty: 160, unit: "m²", rate: 42, value: 6720, cheapest: 39.50, costVar: -400, marginImpact: 400, system: "L2 Partitions" },
  { code: "P2.02", description: "Aquapanel 12.5mm wet areas", qty: 90, unit: "sht", rate: 18.40, value: 1656, cheapest: 17.95, costVar: -41, marginImpact: 41, system: "L2 Partitions" },
  { code: "P2.03", description: "Riser shaft wall 92mm", qty: 48, unit: "m²", rate: 58, value: 2784, cheapest: 56, costVar: -96, marginImpact: 96, system: "L2 Partitions" },
  { code: "P2.04", description: "Acoustic mineral wool 100mm", qty: 160, unit: "m²", rate: 14.20, value: 2272, cheapest: 13.80, costVar: -64, marginImpact: 64, system: "L2 Partitions" },
  { code: "P2.05", description: "Angle bead 2.4m galv", qty: 220, unit: "lm", rate: 1.45, value: 319, cheapest: 1.38, costVar: -15.40, marginImpact: 15, system: "L2 Partitions" },
  // L3 Ceilings (6)
  { code: "C3.01", description: "MF suspended ceiling system", qty: 180, unit: "m²", rate: 38, value: 6840, cheapest: 36.50, costVar: -270, marginImpact: 270, system: "L3 Ceilings" },
  { code: "C3.02", description: "MF5 channel 3.6m", qty: 320, unit: "lm", rate: 2.10, value: 672, cheapest: 2.05, costVar: -16, marginImpact: 16, system: "L3 Ceilings" },
  { code: "C3.03", description: "Primary channel & soffit brackets", qty: 180, unit: "m²", rate: 4.20, value: 756, cheapest: 4.05, costVar: -27, marginImpact: 27, system: "L3 Ceilings" },
  { code: "C3.04", description: "Tegular tile 600x600 mineral fibre", qty: 220, unit: "m²", rate: 14.80, value: 3256, cheapest: 14.20, costVar: -132, marginImpact: 132, system: "L3 Ceilings" },
  { code: "C3.05", description: "Bulkhead detail with curved corner", qty: 42, unit: "lm", rate: 28, value: 1176, cheapest: 26.50, costVar: -63, marginImpact: 63, system: "L3 Ceilings" },
  { code: "C3.06", description: "Access panels 600x600 — fire-rated", qty: 18, unit: "no", rate: 92, value: 1656, cheapest: 88, costVar: -72, marginImpact: 72, system: "L3 Ceilings" },
  // Firestopping (3)
  { code: "F.01", description: "Firestopping collars 110mm", qty: 22, unit: "no", rate: 38, value: 836, cheapest: 36, costVar: -44, marginImpact: 44, system: "Firestopping" },
  { code: "F.02", description: "Gyproc FireLine 15mm 1200x2400", qty: 80, unit: "sht", rate: 11.20, value: 896, cheapest: 10.85, costVar: -28, marginImpact: 28, system: "Firestopping" },
  { code: "F.03", description: "Intumescent sealant 310ml", qty: 24, unit: "tube", rate: 8.40, value: 201.60, cheapest: 8.10, costVar: -7.20, marginImpact: 7, system: "Firestopping" },
  // Miscellaneous (2)
  { code: "M.01", description: "Door linings — fire-rated FD60", qty: 8, unit: "set", rate: 195, value: 1560, cheapest: 188, costVar: -56, marginImpact: 56, system: "Miscellaneous" },
  { code: "M.02", description: "Access panel — service riser 450x450", qty: 12, unit: "no", rate: 64, value: 768, cheapest: 60, costVar: -48, marginImpact: 48, system: "Miscellaneous" },
];

// ====================== MATERIAL READINESS ======================
export type MaterialItem = {
  name: string;
  qty: string;
  poStatus: "raised" | "pending" | "none";
  poDate?: string;
  deliveryStatus: "confirmed" | "expected" | "late" | "missing";
  deliveryDate?: string;
};

export type MaterialTask = {
  id: number;
  task: string;
  start: string;
  system: string;
  materials: MaterialItem[];
  po: "raised" | "pending" | "none" | "mixed";
  delivery: "confirmed" | "expected" | "late" | "missing" | "—";
  status: Status;
};

export const materialReadiness: MaterialTask[] = [
  { id: 1, task: "Partitions L3 Grid 1-5", start: "21/04/2026", system: "L3 Partitions", po: "raised", delivery: "confirmed", status: "READY",
    materials: [
      { name: "Plasterboard 12.5mm Wallboard 1200x2400", qty: "120 sht", poStatus: "raised", poDate: "15/04/2026", deliveryStatus: "confirmed", deliveryDate: "20/04/2026" },
      { name: "Metal stud 70mm x 2.7m", qty: "280 lm", poStatus: "raised", poDate: "15/04/2026", deliveryStatus: "confirmed", deliveryDate: "20/04/2026" },
      { name: "Acoustic batt 50mm", qty: "60 m²", poStatus: "raised", poDate: "15/04/2026", deliveryStatus: "confirmed", deliveryDate: "20/04/2026" },
    ]},
  { id: 2, task: "MF Ceiling L2 Zone B", start: "21/04/2026", system: "L3 Ceilings", po: "raised", delivery: "late", status: "AT_RISK",
    materials: [
      { name: "MF5 channel 3.6m", qty: "120 lm", poStatus: "raised", poDate: "12/04/2026", deliveryStatus: "late", deliveryDate: "23/04/2026" },
      { name: "Primary channel", qty: "60 lm", poStatus: "raised", poDate: "12/04/2026", deliveryStatus: "late", deliveryDate: "23/04/2026" },
      { name: "Soffit brackets", qty: "180 no", poStatus: "raised", poDate: "12/04/2026", deliveryStatus: "confirmed", deliveryDate: "20/04/2026" },
    ]},
  { id: 3, task: "Fire stopping L2 risers", start: "22/04/2026", system: "Firestopping", po: "none", delivery: "missing", status: "BLOCKED",
    materials: [
      { name: "Gyproc FireLine 15mm 1200x2400", qty: "80 sht", poStatus: "none", deliveryStatus: "missing" },
      { name: "Firestopping collars 110mm", qty: "22 no", poStatus: "none", deliveryStatus: "missing" },
    ]},
  { id: 4, task: "Boarding L4 Corridor", start: "23/04/2026", system: "L3 Partitions", po: "raised", delivery: "confirmed", status: "READY",
    materials: [
      { name: "Plasterboard 12.5mm 1200x2400", qty: "240 sht", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "confirmed", deliveryDate: "22/04/2026" },
      { name: "Drywall screws 25mm 1000pk", qty: "8 box", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "confirmed", deliveryDate: "22/04/2026" },
    ]},
  { id: 5, task: "Skim coat L1 lobby", start: "23/04/2026", system: "L3 Partitions", po: "raised", delivery: "confirmed", status: "READY",
    materials: [{ name: "Thistle MultiFinish 25kg", qty: "18 bag", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "confirmed", deliveryDate: "22/04/2026" }]},
  { id: 6, task: "Bulkheads L3", start: "24/04/2026", system: "L3 Ceilings", po: "pending", delivery: "expected", status: "AT_RISK",
    materials: [
      { name: "Angle bead 2.4m galv", qty: "60 lm", poStatus: "pending", deliveryStatus: "expected" },
      { name: "12.5mm wallboard", qty: "30 sht", poStatus: "pending", deliveryStatus: "expected" },
    ]},
  { id: 7, task: "Wet area boarding L2", start: "24/04/2026", system: "L2 Partitions", po: "raised", delivery: "confirmed", status: "READY",
    materials: [{ name: "Aquapanel 12.5mm", qty: "90 sht", poStatus: "raised", poDate: "17/04/2026", deliveryStatus: "confirmed", deliveryDate: "23/04/2026" }]},
  { id: 8, task: "Riser cupboards L2", start: "25/04/2026", system: "L2 Partitions", po: "raised", delivery: "expected", status: "AT_RISK",
    materials: [
      { name: "Fire-rated FireLine 15mm", qty: "40 sht", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "expected", deliveryDate: "28/04/2026" },
    ]},
  { id: 9, task: "Door linings L3", start: "25/04/2026", system: "L3 Partitions", po: "raised", delivery: "confirmed", status: "READY",
    materials: [{ name: "MDF lining sets — FD30", qty: "22 set", poStatus: "raised", poDate: "17/04/2026", deliveryStatus: "confirmed", deliveryDate: "24/04/2026" }]},
  { id: 10, task: "Suspended ceiling L1", start: "28/04/2026", system: "L3 Ceilings", po: "raised", delivery: "confirmed", status: "READY",
    materials: [
      { name: "Tegular tiles 600x600", qty: "220 no", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "confirmed", deliveryDate: "27/04/2026" },
      { name: "T-grid 24mm", qty: "180 lm", poStatus: "raised", poDate: "16/04/2026", deliveryStatus: "confirmed", deliveryDate: "27/04/2026" },
    ]},
  { id: 11, task: "L4 services bulkheads", start: "18/04/2026", system: "L3 Ceilings", po: "raised", delivery: "missing", status: "OVERDUE",
    materials: [{ name: "Angle bead 2.4m galv", qty: "40 lm", poStatus: "raised", poDate: "10/04/2026", deliveryStatus: "missing" }]},
  { id: 12, task: "Acoustic batt L3", start: "30/04/2026", system: "L3 Partitions", po: "none", delivery: "missing", status: "BLOCKED",
    materials: [{ name: "Acoustic mineral wool 100mm", qty: "60 m²", poStatus: "none", deliveryStatus: "missing" }]},
];

// ====================== PRICE COMPARISON ======================
export const priceComparison = [
  { item: "Plasterboard 12.5mm Wallboard 1200x2400", category: "Plasterboard", qty: 380, unit: "/sht", sig: 4.80, ccf: 4.65, jewson: 4.95, bg: 5.10 },
  { item: "Plasterboard 15mm Wallboard 1200x2400", category: "Plasterboard", qty: 60, unit: "/sht", sig: 6.20, ccf: 6.05, jewson: 6.40, bg: 6.50 },
  { item: "Gyproc FireLine 15mm 1200x2400", category: "Fire protection", qty: 80, unit: "/sht", sig: 9.40, ccf: 9.60, jewson: 9.20, bg: 9.55 },
  { item: "Gyproc SoundBloc 12.5mm", category: "Plasterboard", qty: 40, unit: "/sht", sig: 7.80, ccf: 7.60, jewson: 7.95, bg: 8.10 },
  { item: "Aquapanel 12.5mm 1200x900", category: "Plasterboard", qty: 90, unit: "/sht", sig: 18.40, ccf: 17.95, jewson: 18.80, bg: 18.60 },
  { item: "Metal stud 70mm x 2.7m", category: "Metal framing", qty: 280, unit: "/lm", sig: 3.20, ccf: 2.95, jewson: 3.35, bg: 3.40 },
  { item: "Metal stud 92mm x 2.7m", category: "Metal framing", qty: 120, unit: "/lm", sig: 4.10, ccf: 3.95, jewson: 4.20, bg: 4.25 },
  { item: "Metal stud 146mm x 3m", category: "Metal framing", qty: 80, unit: "/lm", sig: 5.40, ccf: 5.15, jewson: 5.50, bg: 0 },
  { item: "U-track 70mm", category: "Metal framing", qty: 220, unit: "/lm", sig: 2.40, ccf: 2.20, jewson: 2.55, bg: 2.50 },
  { item: "MF5 channel 3.6m", category: "Metal framing", qty: 320, unit: "/lm", sig: 2.10, ccf: 2.05, jewson: 2.20, bg: 2.18 },
  { item: "Acoustic batt 50mm", category: "Insulation", qty: 240, unit: "/m²", sig: 12.80, ccf: 0, jewson: 13.20, bg: 12.95 },
  { item: "Acoustic mineral wool 100mm", category: "Insulation", qty: 160, unit: "/m²", sig: 14.40, ccf: 13.80, jewson: 14.60, bg: 0 },
  { item: "Thistle MultiFinish 25kg", category: "Accessories", qty: 18, unit: "/bag", sig: 8.20, ccf: 7.95, jewson: 8.40, bg: 8.30 },
  { item: "Drywall screws 25mm 1000pk", category: "Accessories", qty: 12, unit: "/box", sig: 9.80, ccf: 9.40, jewson: 10.10, bg: 9.95 },
  { item: "Angle bead 2.4m galv", category: "Accessories", qty: 220, unit: "/lm", sig: 1.45, ccf: 1.38, jewson: 1.52, bg: 1.48 },
  { item: "Firestopping collars 110mm", category: "Fire protection", qty: 22, unit: "/no", sig: 38, ccf: 36, jewson: 39, bg: 0 },
  { item: "Intumescent sealant 310ml", category: "Fire protection", qty: 24, unit: "/tube", sig: 8.40, ccf: 8.10, jewson: 8.60, bg: 0 },
  { item: "Tegular tile 600x600 mineral fibre", category: "Accessories", qty: 220, unit: "/m²", sig: 14.80, ccf: 14.20, jewson: 14.95, bg: 0 },
];

// ====================== INVOICES ======================
export type InvoiceStatus = "matched" | "flagged" | "disputed";
export const invoices: { id: string; supplier: string; date: string; total: number; status: InvoiceStatus; variance: number }[] = [
  { id: "INV-1042", supplier: "SIG", date: "14/04/2026", total: 4280.50, status: "matched", variance: 0 },
  { id: "INV-1043", supplier: "CCF", date: "14/04/2026", total: 2960.00, status: "matched", variance: 0 },
  { id: "INV-1044", supplier: "Jewson", date: "15/04/2026", total: 1825.20, status: "matched", variance: 0 },
  { id: "INV-1045", supplier: "MTech Electrical", date: "15/04/2026", total: 1720.00, status: "flagged", variance: 129 },
  { id: "INV-1046", supplier: "British Gypsum", date: "16/04/2026", total: 3210.00, status: "matched", variance: 0 },
  { id: "INV-1047", supplier: "CCF", date: "16/04/2026", total: 1495.50, status: "matched", variance: 0 },
  { id: "INV-1048", supplier: "SIG", date: "17/04/2026", total: 2780.00, status: "flagged", variance: 320 },
  { id: "INV-1049", supplier: "Knauf", date: "17/04/2026", total: 4120.40, status: "matched", variance: 0 },
  { id: "INV-1050", supplier: "Jewson", date: "18/04/2026", total: 980.00, status: "flagged", variance: 145 },
  { id: "INV-1051", supplier: "SIG", date: "18/04/2026", total: 6240.00, status: "matched", variance: 0 },
  { id: "INV-1052", supplier: "CCF", date: "19/04/2026", total: 2150.00, status: "matched", variance: 0 },
  { id: "INV-1053", supplier: "Heritage Joinery", date: "19/04/2026", total: 4480.00, status: "disputed", variance: 1200 },
];

export const invoiceLines: Record<string, { supplier: string; date: string; total: number; variance: number; note: string; lines: { invoice: string; po: string; boq: string; match: boolean }[] }> = {
  "INV-1045": {
    supplier: "MTech Electrical",
    date: "15/04/2026",
    total: 1720.00,
    variance: 129,
    note: "3 hours not in signed dayworks log — query with supplier",
    lines: [
      { invoice: "Electrical first fix labour — 40h @ £43", po: "37h @ £43", boq: "L3 electrical first fix — £1,800 allowance", match: false },
      { invoice: "Cable tray brackets — 24 no @ £4.20", po: "24 no @ £4.20", boq: "24 no in BoQ", match: true },
    ],
  },
  "INV-1048": {
    supplier: "SIG",
    date: "17/04/2026",
    total: 2780.00,
    variance: 320,
    note: "Quantity discrepancy — 8 extra sheets billed beyond PO",
    lines: [
      { invoice: "FireLine 15mm — 88 sht @ £9.40", po: "80 sht @ £9.40", boq: "80 sht (allowance)", match: false },
      { invoice: "Drywall screws — 6 box @ £9.80", po: "6 box @ £9.80", boq: "6 box", match: true },
      { invoice: "Delivery charge", po: "—", boq: "—", match: true },
    ],
  },
  "INV-1050": {
    supplier: "Jewson",
    date: "18/04/2026",
    total: 980.00,
    variance: 145,
    note: "Unit price £0.20 higher than agreed call-off rate",
    lines: [
      { invoice: "Tegular tile 600x600 — 60 m² @ £15.00", po: "60 m² @ £14.80", boq: "60 m² in BoQ", match: false },
    ],
  },
  "INV-1053": {
    supplier: "Heritage Joinery",
    date: "19/04/2026",
    total: 4480.00,
    variance: 1200,
    note: "Major variance — 4 extra days claimed, no signed dayworks tickets attached",
    lines: [
      { invoice: "Joinery dayworks — 6 days @ £520", po: "2 days @ £520", boq: "Provisional sum £2,000", match: false },
      { invoice: "Materials — ironmongery", po: "—", boq: "Included in main contract", match: false },
    ],
  },
};

// ====================== FINANCIAL ======================
export const financialBoq = [
  { line: "100mm partition L3", est: 18450, buyer: 18120, actual: 19690, varPct: 6.7 },
  { line: "70mm partition L2", est: 14200, buyer: 13980, actual: 14110, varPct: -0.6 },
  { line: "MF Ceiling L2", est: 9650, buyer: 9550, actual: 10120, varPct: 4.9 },
  { line: "Boarding L4", est: 8200, buyer: 8100, actual: 8050, varPct: -1.8 },
  { line: "Tape & joint", est: 5400, buyer: 5300, actual: 5520, varPct: 2.2 },
  { line: "Fire stopping L3", est: 4800, buyer: 4700, actual: 5100, varPct: 6.3 },
  { line: "Skim coat L1", est: 3200, buyer: 3150, actual: 3120, varPct: -2.5 },
  { line: "Suspended ceiling L1", est: 6400, buyer: 6280, actual: 6310, varPct: -1.4 },
  { line: "Acoustic batt L3", est: 3072, buyer: 2950, actual: 2980, varPct: -3.0 },
  { line: "Door linings FD30", est: 3190, buyer: 3036, actual: 3120, varPct: -2.2 },
];

export const monthlyPnl = [
  { month: "Jan", revenue: 84000, cost: 70000, margin: 14000 },
  { month: "Feb", revenue: 142000, cost: 116440, margin: 25560 },
  { month: "Mar", revenue: 268000, cost: 222000, margin: 46000 },
  { month: "Apr", revenue: 184000, cost: 158000, margin: 26000 },
];

export const marginAlerts = [
  { id: 1, title: "Level 3 partitions leaking £1,240", detail: "SIG 12.5mm board price up 4% — not passed on to client" },
  { id: 2, title: "Ceiling grid overage — 8 sheets extra", detail: "Investigate L2 ceiling allowance vs actual usage" },
  { id: 3, title: "Labour over on firestopping", detail: "4h over BoQ allowance — flag with foreman" },
];

// ====================== DAILY SITE REPORTS ======================
export const dailyReportHistory = [
  { date: "21/04/2026", weather: "Cloudy 14°C", operatives: 14, incidents: 0 },
  { date: "18/04/2026", weather: "Rain 11°C", operatives: 12, incidents: 1 },
  { date: "17/04/2026", weather: "Cloudy 13°C", operatives: 14, incidents: 0 },
  { date: "16/04/2026", weather: "Sunny 16°C", operatives: 14, incidents: 0 },
];

// ====================== INTEGRATIONS ======================
export const integrations = [
  { name: "Xero", category: "Accounting", connected: true, lastSync: "5 minutes ago", stats: { pos: 24, invoices: 18, errors: 2 } },
  { name: "QuickBooks", category: "Accounting", connected: false },
  { name: "Sage 50", category: "Accounting", connected: false },
  { name: "Asta Powerproject", category: "Programme", connected: true, lastSync: "1 hour ago" },
  { name: "MS Project", category: "Programme", connected: false },
  { name: "Procore", category: "Main Contractor", connected: false, note: "For main contractors who mandate Procore" },
  { name: "Slack", category: "Comms", connected: false },
  { name: "Microsoft Teams", category: "Comms", connected: false },
];
