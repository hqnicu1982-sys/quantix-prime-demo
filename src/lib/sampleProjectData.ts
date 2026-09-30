import type { ProjectBoqLine, ProjectCallOff, ProjectData, ProjectSystem } from "./projectData";
import type { PlannerTask } from "./planner";
import type { ProjectVariation } from "./variations";
import type { PaymentCycleStore, PaymentApplication, PaymentLine } from "./paymentCycle";

export const SAMPLE_ID = "sample-harbour-yard";
export const DAY = 86_400_000;

export function sampleIso(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_SYSTEMS: ProjectSystem[] = [
  { id: "sample-w1", addedAt: Date.now() - 42 * DAY, systemCode: "A206013", systemName: "W1 · Stores", lengthM: 50, heightM: 3, areaM2: 150, wastePct: 7, boardSize: "2400×1200", notes: "1 × Gyproc WallBoard 12.5 each side · 30 min · 36 Rw dB" },
  { id: "sample-w2", addedAt: Date.now() - 42 * DAY, systemCode: "A206228", systemName: "W2 · Offices (North, South)", lengthM: 260, heightM: 3, areaM2: 780, wastePct: 7, boardSize: "2400×1200", notes: "1 × Gyproc SoundBloc 12.5 each side · 50 mm Isover APR 1200 · 30 min · 47 Rw dB" },
  { id: "sample-w3", addedAt: Date.now() - 42 * DAY, systemCode: "A206141", systemName: "W3 · Corridors", lengthM: 140, heightM: 3, areaM2: 420, wastePct: 7, boardSize: "2400×1200", notes: "1 × Gyproc FireLine 15 each side · 50 mm APR 1200 · 60 min · 44 Rw dB" },
  { id: "sample-w4", addedAt: Date.now() - 42 * DAY, systemCode: "A206015 (A)", systemName: "W4 · Reception feature wall", lengthM: 27.5, heightM: 4, areaM2: 110, wastePct: 7, boardSize: "2400×1200", notes: "2 × Gyproc WallBoard 12.5 each side · 30 min · 45 Rw dB" },
  { id: "sample-w5", addedAt: Date.now() - 42 * DAY, systemCode: "A206167", systemName: "W5 · Core / riser", lengthM: 85.3, heightM: 3.4, areaM2: 290, wastePct: 7, boardSize: "2400×1200", notes: "2 × Gyproc SoundBloc 15 each side · 90 min · 51 Rw dB" },
];

const line = (id: string, systemId: string, material: string, qty: number, unit: string, ratePerUnit: number, selectedSupplier: string): ProjectBoqLine => ({ id, systemId, material, qty, unit, ratePerUnit, selectedSupplier, leadTimeDays: 3 });
export const SAMPLE_BOQ_LINES: ProjectBoqLine[] = [
  line("sample-l01", "sample-w1", "Gyproc WallBoard 12.5 TE 2400×1200", 284, "sheet", 8.85, "Northway Interiors Supply"),
  line("sample-l02", "sample-w2", "Gyproc SoundBloc 12.5 TE 2400×1200", 596, "sheet", 12.95, "Castlegate Drylining Supplies"),
  line("sample-l03", "sample-w3", "Gyproc FireLine 15 TE 2400×1200", 321, "sheet", 14.10, "Meridian Building Materials"),
  line("sample-l04", "sample-w5", "Gyproc SoundBloc 15 TE 2400×1200", 444, "sheet", 15.60, "Northway Interiors Supply"),
  line("sample-l05", "sample-w2", "Gypframe 70 S 50 C stud 3000", 829, "length", 4.15, "Castlegate Drylining Supplies"),
  line("sample-l06", "sample-w5", "Gypframe 70 S 50 C stud 3600", 158, "length", 5.05, "Castlegate Drylining Supplies"),
  line("sample-l07", "sample-w4", "Gypframe 70 S 50 C stud 4200", 52, "length", 5.95, "Castlegate Drylining Supplies"),
  line("sample-l08", "sample-w1", "Gypframe 72 DC 60 channel 3600", 331, "length", 9.85, "Meridian Building Materials"),
  line("sample-l09", "sample-w3", "Isover APR 1200 50 mm (15.6 m² pack)", 82, "pack", 34.90, "Meridian Building Materials"),
  line("sample-l10", "sample-w2", "Drywall screws 25 mm", 40740, "screw", 0.0052, "Castlegate Drylining Supplies"),
  line("sample-l11", "sample-w4", "Drywall screws 35 mm", 2772, "screw", 0.0064, "Castlegate Drylining Supplies"),
  line("sample-l12", "sample-w5", "Drywall screws 45 mm", 7308, "screw", 0.0083, "Castlegate Drylining Supplies"),
  line("sample-l13", "sample-w3", "Gyproc Joint Filler 12.5 kg", 142, "bag", 12.70, "Meridian Building Materials"),
  line("sample-l14", "sample-w2", "Paper joint tape 90 m", 54, "roll", 5.20, "Northway Interiors Supply"),
];

export type SampleQuoteLine = { material: string; qty: number; castlegate: string; meridian: string; northway: string; choice: "AUTO" | "MANUAL"; note?: string };
export const SAMPLE_QUOTES: SampleQuoteLine[] = [
  { material: SAMPLE_BOQ_LINES[0].material, qty: 284, castlegate: "£9.60", meridian: "£10.30", northway: "£8.85", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[1].material, qty: 596, castlegate: "£12.95", meridian: "£14.60", northway: "2700 only · £15.40", choice: "MANUAL", note: "Board length trap — Northway quoted 2700, not the specified 2400 length." },
  { material: SAMPLE_BOQ_LINES[2].material, qty: 321, castlegate: "£15.90", meridian: "£14.10", northway: "£15.40", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[3].material, qty: 444, castlegate: "£17.60", meridian: "£16.90", northway: "£15.60", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[4].material, qty: 829, castlegate: "£4.15", meridian: "£4.55", northway: "3600 only · £5.45", choice: "AUTO", note: "Stud length trap — Northway quoted 3600 for 3.0 m walls." },
  { material: SAMPLE_BOQ_LINES[5].material, qty: 158, castlegate: "£5.05", meridian: "£5.50", northway: "£5.45", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[6].material, qty: 52, castlegate: "£5.95", meridian: "£6.40", northway: "Not priced", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[7].material, qty: 331, castlegate: "£11.30", meridian: "£9.85", northway: "£11.60", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[8].material, qty: 82, castlegate: "£38.20", meridian: "£34.90", northway: "£37.40", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[9].material, qty: 40740, castlegate: "£5.20/1000", meridian: "£2.90/500", northway: "£5.45/1000", choice: "AUTO", note: "Pack-size trap — Meridian screws are priced in packs of 500." },
  { material: SAMPLE_BOQ_LINES[10].material, qty: 2772, castlegate: "£6.40/1000", meridian: "£3.60/500", northway: "£6.60/1000", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[11].material, qty: 7308, castlegate: "£8.30/1000", meridian: "£4.60/500", northway: "£8.50/1000", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[12].material, qty: 142, castlegate: "£13.90", meridian: "£12.70", northway: "£13.60", choice: "AUTO" },
  { material: SAMPLE_BOQ_LINES[13].material, qty: 54, castlegate: "£5.40", meridian: "£5.60", northway: "£5.20", choice: "AUTO" },
];
export const SAMPLE_QUOTE_TOTALS = { castlegate: 37347.45, meridian: 37186.60, northway: 37354, bestMix: 34736.90, saving: 2449.70, savingPct: 6.6, split: { castlegate: 12564.65, meridian: 12451.65, northway: 9720.60 } };

export const SAMPLE_CALLOFFS: ProjectCallOff[] = [
  { id: "CO-0001", createdAt: Date.now() - 28 * DAY, supplier: "Castlegate Drylining Supplies", lineIds: ["sample-l02", "sample-l05"], status: "delivered" },
  { id: "CO-0002", createdAt: Date.now() - 12 * DAY, supplier: "Meridian Building Materials", lineIds: ["sample-l03", "sample-l09"], status: "sent" },
  { id: "CO-0003", createdAt: Date.now() - 3 * DAY, supplier: "Northway Interiors Supply", lineIds: ["sample-l04"], status: "draft" },
];

export const SAMPLE_PROJECT_DATA: ProjectData = {
  systems: SAMPLE_SYSTEMS,
  boqLines: SAMPLE_BOQ_LINES,
  callOffs: SAMPLE_CALLOFFS,
  supplierChoices: Object.fromEntries(SAMPLE_BOQ_LINES.map((l) => [l.material, l.selectedSupplier ?? ""])),
};

export function samplePlannerTasks(): PlannerTask[] {
  const now = Date.now();
  const task = (id: string, title: string, level: string, area: string, start: number, end: number, progress: number, status: PlannerTask["status"], dependsOn: string[], calloffIds: string[] = [], notes?: string, isMilestone?: boolean): PlannerTask => ({ id, projectId: SAMPLE_ID, title, level, area, start: sampleIso(start), end: sampleIso(end), progress, status, boqLineIds: [], calloffIds, dependsOn, notes, isMilestone, plannedHours: isMilestone ? 0 : 160, createdAt: now - 42 * DAY, updatedAt: now });
  return [
    task("T-001", "W1 Stores", "Level 2", "Stores", -38, -24, 100, "done", []),
    task("T-002", "W2 Offices — North", "Level 2", "North zone", -32, -12, 78, "on-track", [], ["CO-0001"]),
    task("T-003", "W2 Offices — South", "Level 3", "South zone", -11, 8, 28, "on-track", ["T-002"], ["CO-0001"]),
    task("T-004", "W3 Corridors", "Levels 2–3", "Corridors", -18, 2, 45, "behind", [], ["CO-0002"], "Behind — CO-0002 FireLine shortfall: 180 of 240 sheets delivered."),
    task("T-005", "W4 Reception feature wall", "Level 2", "Reception", 3, 16, 0, "scheduled", ["T-004"]),
    task("T-006", "W5 Core / riser", "Levels 2–3", "Core", 7, 28, 0, "blocked", [], ["CO-0003"], "Awaiting approval of CO-0003."),
    task("T-007", "Taping and jointing", "Levels 2–3", "All boarded walls", -10, 24, 20, "on-track", [], [], "SS link — starts 2 days after boarding."),
    task("T-008", "Level 2 partitions boarded", "Level 2", "Milestone", -2, -2, 100, "done", ["T-001", "T-002", "T-004"], [], undefined, true),
    task("T-009", "Level 3 partitions boarded", "Level 3", "Milestone", 30, 30, 0, "scheduled", ["T-003", "T-004", "T-006"], [], undefined, true),
  ];
}

export function sampleVariations(): ProjectVariation[] {
  const now = Date.now();
  return [
    { id: "VAR-001", title: "Extra meeting-room partition", reason: "Instructed extra 18 m² W2 partition; signed instruction received.", raisedBy: "client", raisedDate: sampleIso(-16), status: "approved", changes: [{ id: "sample-var-1", op: "add_system", description: "18 m² of W2 A206228", qty: 18, unit: "m²", ratePerUnit: 60, lineTotal: 1080 }], costImpact: 1080, timeImpactDays: 1, approvedValue: 1080, approvedDate: sampleIso(-14), attachments: [{ name: "VAR-001-signed-instruction.pdf" }], createdAt: now - 16 * DAY, updatedAt: now - 14 * DAY },
    { id: "VAR-002", title: "Extra cupboard wall at core", reason: "Approximately 10 m² of W1 completed on site; instruction not signed.", raisedBy: "site", raisedDate: sampleIso(-5), status: "submitted", changes: [{ id: "sample-var-2", op: "add_system", description: "10 m² of W1 A206013", qty: 10, unit: "m²", ratePerUnit: 60, lineTotal: 600 }], costImpact: 600, timeImpactDays: 0, attachments: [], createdAt: now - 5 * DAY, updatedAt: now - 5 * DAY },
  ];
}

export function samplePaymentCycle(): PaymentCycleStore {
  const now = Date.now();
  const lines1: PaymentLine[] = [{ id: "sample-pay-l1", category: "measured_work", description: "Levels 2–3 partitions completed to first valuation", gross: 29484.54 }];
  const app1: PaymentApplication = { id: "sample-app-1", projectId: SAMPLE_ID, appNumber: "App 1", periodEnd: sampleIso(-28), submittedAt: sampleIso(-27), dueDateForNotice: sampleIso(-23), finalDateForPayment: sampleIso(-14), lines: lines1, retentionPct: 3, previouslyCertified: 0, grossTotal: 29484.54, retentionHeld: 884.54, netCumulative: 28600, netThisApplication: 28600, status: "certified", noticeId: "sample-pn-1", certificateId: "sample-cert-1", notes: "Certified £28,600 after 3% retention.", createdAt: now - 28 * DAY, updatedAt: now - 21 * DAY };
  const lines2: PaymentLine[] = [{ id: "sample-pay-l2", category: "measured_work", description: "Progress to 42% across Levels 2–3", gross: 44800 }, { id: "sample-pay-l3", category: "variations", description: "VAR-001 signed variation", gross: 1080 }];
  const gross2 = 45880; const held2 = +(gross2 * .03).toFixed(2); const net2 = +(gross2 - held2).toFixed(2);
  const app2: PaymentApplication = { id: "sample-app-2", projectId: SAMPLE_ID, appNumber: "App 2", periodEnd: sampleIso(-2), submittedAt: sampleIso(-2), dueDateForNotice: sampleIso(3), finalDateForPayment: sampleIso(12), lines: lines2, retentionPct: 3, previouslyCertified: 28600, grossTotal: gross2, retentionHeld: held2, netCumulative: net2, netThisApplication: +(net2 - 28600).toFixed(2), status: "submitted", notes: "Submitted — awaiting certificate.", createdAt: now - 2 * DAY, updatedAt: now - 2 * DAY };
  return { applications: [app2, app1], notices: [{ id: "sample-pn-1", applicationId: app1.id, issuedAt: sampleIso(-23), certifiedAmount: 28600 }], payLess: [], certificates: [{ id: "sample-cert-1", applicationId: app1.id, certificateNumber: "CERT-001", finalAmount: 28600, issuedAt: sampleIso(-21) }] };
}
