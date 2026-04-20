// Quantix Prime — mock data for Hotel Fitzrovia project

export const project = {
  name: "Hotel Fitzrovia",
  contractValue: "£2.1M",
  mainContractor: "Kier Construction",
  startDate: "12/02/2025",
  endDate: "30/09/2025",
};

export type Status = "READY" | "AT_RISK" | "BLOCKED" | "OVERDUE";

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
};

export const roadblocks = [
  { id: 1, title: "Ceiling grid Level 2 — SIG delivery slipped 3 days", severity: "AT_RISK" as Status },
  { id: 2, title: "Fire-rated board shortage — no PO raised", severity: "BLOCKED" as Status },
  { id: 3, title: "Electrical first fix — waiting on MC clearance", severity: "AT_RISK" as Status },
];

export const marginTrend = [
  { week: "W1", margin: 18.0 },
  { week: "W2", margin: 17.4 },
  { week: "W3", margin: 16.9 },
  { week: "W4", margin: 16.2 },
  { week: "W5", margin: 15.8 },
  { week: "W6", margin: 15.1 },
  { week: "W7", margin: 14.6 },
  { week: "W8", margin: 14.2 },
];

export const commercialActions = [
  { id: 1, title: "4 invoices need review", detail: "£890 variance flagged" },
  { id: 2, title: "SIG board price up 4%", detail: "Compare with CCF alternative" },
  { id: 3, title: "Labour over budget on Level 3", detail: "+£420 vs BoQ allowance" },
];

export type Task = {
  id: number;
  title: string;
  crew: string;
  operatives: number;
  duration: string;
  day: number; // 0-4 Mon-Fri
  span: number;
  status: Status;
  constraints: { materials: boolean; labour: boolean; preceding: boolean; permits: boolean };
};

export const weeklyTasks: Task[] = [
  { id: 1, title: "Partitions L3 — Grid 1-5", crew: "Crew A", operatives: 4, duration: "2 days", day: 0, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 2, title: "MF Ceiling L2 — Zone B", crew: "Crew B", operatives: 3, duration: "3 days", day: 0, span: 3, status: "AT_RISK", constraints: { materials: false, labour: true, preceding: true, permits: true } },
  { id: 3, title: "Boarding L4 — Corridor", crew: "Crew C", operatives: 3, duration: "2 days", day: 2, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 4, title: "Fire stopping L2", crew: "Crew D", operatives: 2, duration: "1 day", day: 3, span: 1, status: "BLOCKED", constraints: { materials: false, labour: true, preceding: false, permits: true } },
  { id: 5, title: "Skim coat L1 lobby", crew: "Crew A", operatives: 2, duration: "1 day", day: 2, span: 1, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 6, title: "Bulkheads L3", crew: "Crew B", operatives: 2, duration: "2 days", day: 3, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 7, title: "Tape & joint L4", crew: "Crew C", operatives: 3, duration: "2 days", day: 0, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 8, title: "Riser cupboards L2", crew: "Crew D", operatives: 2, duration: "1 day", day: 4, span: 1, status: "AT_RISK", constraints: { materials: true, labour: true, preceding: true, permits: false } },
  { id: 9, title: "Acoustic batt insulation L3", crew: "Crew A", operatives: 2, duration: "1 day", day: 4, span: 1, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 10, title: "Track set out L5", crew: "Crew E", operatives: 2, duration: "1 day", day: 1, span: 1, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 11, title: "Wet area boarding L2", crew: "Crew B", operatives: 3, duration: "2 days", day: 3, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 12, title: "Door linings L3", crew: "Crew C", operatives: 2, duration: "1 day", day: 4, span: 1, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 13, title: "Suspended ceiling L1", crew: "Crew D", operatives: 3, duration: "2 days", day: 1, span: 2, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
  { id: 14, title: "MF perimeter L4", crew: "Crew E", operatives: 2, duration: "1 day", day: 2, span: 1, status: "READY", constraints: { materials: true, labour: true, preceding: true, permits: true } },
];

export const operatives = [
  { id: 1, name: "James Whittaker", role: "Charge hand", crew: "Crew A", clockIn: "07:02" },
  { id: 2, name: "Liam O'Connor", role: "Dryliner", crew: "Crew A", clockIn: "07:05" },
  { id: 3, name: "Daniel Pereira", role: "Dryliner", crew: "Crew A", clockIn: "07:01" },
  { id: 4, name: "Marcus Johnson", role: "Charge hand", crew: "Crew B", clockIn: "06:58" },
  { id: 5, name: "Sean Murphy", role: "Ceiling fixer", crew: "Crew B", clockIn: "07:10" },
  { id: 6, name: "Andrei Popescu", role: "Dryliner", crew: "Crew C", clockIn: "07:00" },
  { id: 7, name: "Tomasz Kowalski", role: "Tape & joint", crew: "Crew C", clockIn: "07:03" },
  { id: 8, name: "David Hughes", role: "Labourer", crew: "Crew D", clockIn: "07:15" },
];

export const labourVsBoq = [
  { task: "Partitions L3", hours: 48, allowance: 52, variance: -120 },
  { task: "Ceilings L2", hours: 36, allowance: 28, variance: 240 },
  { task: "Boarding L4", hours: 22, allowance: 24, variance: -60 },
  { task: "Tape & joint L4", hours: 18, allowance: 20, variance: -50 },
  { task: "Skim L1 lobby", hours: 9, allowance: 8, variance: 30 },
];

export const boqItems = [
  "100mm partition L3 — £45/m²",
  "70mm partition L2 — £42/m²",
  "MF ceiling L2 — £38/m²",
  "Boarding L4 — £18/m²",
  "Tape & joint — £9/m²",
  "Fire stopping — £24/lm",
];

export const materialReadiness = [
  { task: "Ceiling grid Level 2", start: "21/04/2025", materials: ["MF5 channel", "Primary channel", "Bracket"], po: "raised", delivery: "late", status: "AT_RISK" as Status },
  { task: "Fire rated board L2 risers", start: "22/04/2025", materials: ["Gyproc FireLine 15mm"], po: "none", delivery: "—", status: "BLOCKED" as Status },
  { task: "Partitions L3 Grid 1-5", start: "21/04/2025", materials: ["70mm stud", "12.5mm wallboard", "Acoustic batt"], po: "raised", delivery: "confirmed", status: "READY" as Status },
  { task: "Boarding L4 Corridor", start: "23/04/2025", materials: ["12.5mm wallboard", "Drywall screws"], po: "raised", delivery: "confirmed", status: "READY" as Status },
  { task: "Skim coat L1 lobby", start: "23/04/2025", materials: ["Thistle MultiFinish"], po: "raised", delivery: "confirmed", status: "READY" as Status },
  { task: "Bulkheads L3", start: "24/04/2025", materials: ["Angle bead", "12.5mm wallboard"], po: "pending", delivery: "expected", status: "AT_RISK" as Status },
  { task: "Wet area boarding L2", start: "24/04/2025", materials: ["Aquapanel 12.5mm"], po: "raised", delivery: "confirmed", status: "READY" as Status },
  { task: "Door linings L3", start: "25/04/2025", materials: ["MDF lining sets"], po: "raised", delivery: "confirmed", status: "READY" as Status },
  { task: "Suspended ceiling L1", start: "22/04/2025", materials: ["Tegular tiles 600x600", "T-grid 24mm"], po: "raised", delivery: "confirmed", status: "READY" as Status },
];

export const priceComparison = [
  { item: "Plasterboard 12.5mm 1200x2400", unit: "/sht", sig: 5.85, ccf: 5.62, jewson: 5.94, bg: 6.10 },
  { item: "Gyproc FireLine 15mm 1200x2400", unit: "/sht", sig: 11.20, ccf: 10.85, jewson: 11.55, bg: 11.40 },
  { item: "Metal stud 70mm x 3m", unit: "/lm", sig: 3.45, ccf: 3.30, jewson: 3.55, bg: 3.60 },
  { item: "Metal stud 92mm x 3m", unit: "/lm", sig: 4.10, ccf: 3.95, jewson: 4.20, bg: 4.25 },
  { item: "Acoustic batt 50mm", unit: "/m²", sig: 6.40, ccf: 6.20, jewson: 6.55, bg: 6.50 },
  { item: "Aquapanel 12.5mm", unit: "/sht", sig: 18.40, ccf: 17.95, jewson: 18.80, bg: 18.60 },
  { item: "Thistle MultiFinish 25kg", unit: "/bag", sig: 8.20, ccf: 7.95, jewson: 8.40, bg: 8.30 },
  { item: "MF5 channel 3.6m", unit: "/lm", sig: 2.10, ccf: 2.05, jewson: 2.20, bg: 2.18 },
  { item: "Drywall screws 25mm 1000pk", unit: "/box", sig: 9.80, ccf: 9.40, jewson: 10.10, bg: 9.95 },
  { item: "Angle bead 2.4m galv", unit: "/lm", sig: 1.45, ccf: 1.38, jewson: 1.52, bg: 1.48 },
];

export const invoices = [
  { id: "INV-1042", supplier: "SIG", date: "14/04/2025", total: 4280.50, status: "matched" as const, variance: 0 },
  { id: "INV-1043", supplier: "CCF", date: "14/04/2025", total: 2960.00, status: "matched" as const, variance: 0 },
  { id: "INV-1044", supplier: "Jewson", date: "15/04/2025", total: 1825.20, status: "matched" as const, variance: 0 },
  { id: "INV-1045", supplier: "SIG", date: "15/04/2025", total: 5640.80, status: "flagged" as const, variance: 280 },
  { id: "INV-1046", supplier: "British Gypsum", date: "16/04/2025", total: 3210.00, status: "matched" as const, variance: 0 },
  { id: "INV-1047", supplier: "CCF", date: "16/04/2025", total: 1495.50, status: "matched" as const, variance: 0 },
  { id: "INV-1048", supplier: "SIG", date: "17/04/2025", total: 2780.00, status: "flagged" as const, variance: 320 },
  { id: "INV-1049", supplier: "Knauf", date: "17/04/2025", total: 4120.40, status: "matched" as const, variance: 0 },
  { id: "INV-1050", supplier: "Jewson", date: "18/04/2025", total: 980.00, status: "flagged" as const, variance: 145 },
  { id: "INV-1051", supplier: "SIG", date: "18/04/2025", total: 6240.00, status: "matched" as const, variance: 0 },
  { id: "INV-1052", supplier: "CCF", date: "19/04/2025", total: 2150.00, status: "matched" as const, variance: 0 },
  { id: "INV-1053", supplier: "SIG Dayworks", date: "19/04/2025", total: 1280.00, status: "flagged" as const, variance: 145 },
];

export const invoiceLines = {
  "INV-1045": {
    supplier: "SIG",
    date: "15/04/2025",
    total: 5640.80,
    variance: 280,
    note: "Quantity over PO — 3 extra hours billed vs dayworks log",
    lines: [
      { invoice: "Plasterboard 12.5mm — 240 sht @ £5.85", po: "240 sht @ £5.85", boq: "240 sht (allowance)", match: true },
      { invoice: "Metal stud 70mm — 180 lm @ £3.45", po: "180 lm @ £3.45", boq: "180 lm (allowance)", match: true },
      { invoice: "Dayworks labour — 11h @ £42", po: "8h @ £42", boq: "8h logged", match: false },
    ],
  },
};

export const financialBoq = [
  { line: "Partitions L3 100mm", est: 18450, buyer: 18120, actual: 19690, varPct: 6.7 },
  { line: "Partitions L2 70mm", est: 14200, buyer: 13980, actual: 14110, varPct: -0.6 },
  { line: "MF Ceiling L2", est: 9650, buyer: 9550, actual: 10120, varPct: 4.9 },
  { line: "Boarding L4", est: 8200, buyer: 8100, actual: 8050, varPct: -1.8 },
  { line: "Tape & joint", est: 5400, buyer: 5300, actual: 5520, varPct: 2.2 },
  { line: "Fire stopping", est: 4800, buyer: 4700, actual: 5100, varPct: 6.3 },
  { line: "Skim coat L1", est: 3200, buyer: 3150, actual: 3120, varPct: -2.5 },
  { line: "Suspended ceiling L1", est: 6400, buyer: 6280, actual: 6310, varPct: -1.4 },
];

export const monthlyPnl = [
  { month: "Feb", revenue: 142000, cost: 116440, margin: 25560 },
  { month: "Mar", revenue: 268000, cost: 222000, margin: 46000 },
  { month: "Apr", revenue: 312000, cost: 267800, margin: 44200 },
  { month: "May", revenue: 295000, cost: 254000, margin: 41000 },
];

export const marginAlerts = [
  { id: 1, title: "Level 3 partitions leaking £1,240", detail: "SIG 12.5mm board price up 4% — not passed on to client" },
  { id: 2, title: "Ceilings L2 over labour by £420", detail: "Crew B took 36h vs 28h allowance" },
  { id: 3, title: "Dayworks variance INV-1045", detail: "11h billed vs 8h logged on site" },
];
