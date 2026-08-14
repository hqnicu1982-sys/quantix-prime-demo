import ExcelJS from "exceljs";
import { DELAY_CAUSE_LABEL } from "./progressLog";
import type { ReportPayload } from "./progressReportPdf";

const HEADER_FILL = "FF0F172A";

function styleHeader(row: ExcelJS.Row) {
  row.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle" };
  row.height = 20;
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: { header: string; key: string; width: number }[],
  rows: Record<string, unknown>[],
) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns;
  styleHeader(ws.getRow(1));
  rows.forEach((r) => ws.addRow(r));
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    row.font = { name: "Arial", size: 10 };
    row.alignment = { vertical: "top", wrapText: true };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}

export async function exportProgressReportXlsx(p: ReportPayload) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Quantix Prime";
  wb.created = p.generatedAt;

  // ---- Summary
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 22 }, { width: 110 }];
  s.addRow(["Progress & Delay Report"]).font = { name: "Arial", bold: true, size: 14 };
  s.addRow([]);
  const meta: [string, string][] = [
    ["Project", p.projectName],
    ["Client", p.projectClient ?? "—"],
    ["Period", p.periodLabel],
    ["Prepared by", p.preparedBy],
    ["Generated", p.generatedAt.toLocaleString("en-GB")],
  ];
  meta.forEach(([k, v]) => {
    const r = s.addRow([k, v]);
    r.getCell(1).font = { name: "Arial", bold: true, size: 10 };
    r.getCell(2).font = { name: "Arial", size: 10 };
  });
  s.addRow([]);
  s.addRow(["Executive summary"]).font = { name: "Arial", bold: true, size: 12 };
  p.summary.forEach((para) => {
    const r = s.addRow(["", para]);
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    r.height = 60;
  });
  if (p.commentary.trim()) {
    s.addRow([]);
    s.addRow(["Commentary / mitigation"]).font = { name: "Arial", bold: true, size: 12 };
    const r = s.addRow(["", p.commentary]);
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    r.height = 60;
  }

  // ---- Progress
  const prog = addSheet(
    wb,
    "Progress",
    [
      { header: "Ref", key: "ref", width: 10 },
      { header: "Activity", key: "title", width: 34 },
      { header: "Location", key: "loc", width: 16 },
      { header: "Crew", key: "crew", width: 20 },
      { header: "Planned start", key: "ps", width: 14 },
      { header: "Planned finish", key: "pe", width: 14 },
      { header: "Current start", key: "cs", width: 14 },
      { header: "Current finish", key: "ce", width: 14 },
      { header: "% complete", key: "pc", width: 12 },
      { header: "% due", key: "pd", width: 10 },
      { header: "Variance (days)", key: "var", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ],
    p.rows.map((r) => ({
      ref: r.taskId,
      title: r.title,
      loc: r.level,
      crew: r.crew,
      ps: new Date(r.plannedStart),
      pe: new Date(r.plannedEnd),
      cs: new Date(r.currentStart),
      ce: new Date(r.currentEnd),
      pc: r.progress / 100,
      pd: r.expected / 100,
      var: r.varianceDays,
      status: r.status,
    })),
  );
  ["E", "F", "G", "H"].forEach((c) => (prog.getColumn(c).numFmt = "dd/mm/yyyy"));
  ["I", "J"].forEach((c) => (prog.getColumn(c).numFmt = "0%"));
  prog.getColumn("K").numFmt = "0;(0);-";

  // ---- Delays
  const del = addSheet(
    wb,
    "Delays",
    [
      { header: "Ref", key: "ref", width: 10 },
      { header: "Activity", key: "title", width: 34 },
      { header: "Original start", key: "os", width: 14 },
      { header: "Original finish", key: "oe", width: 14 },
      { header: "Revised start", key: "rs", width: 14 },
      { header: "Revised finish", key: "re", width: 14 },
      { header: "Days lost", key: "days", width: 11 },
      { header: "Cause", key: "cause", width: 22 },
      { header: "Reason recorded", key: "why", width: 70 },
      { header: "Recorded by", key: "by", width: 18 },
    ],
    p.delays.map((d) => ({
      ref: d.taskId,
      title: d.taskTitle,
      os: new Date(d.originalStart),
      oe: new Date(d.originalEnd),
      rs: new Date(d.currentStart),
      re: new Date(d.currentEnd),
      days: d.daysLost,
      cause: DELAY_CAUSE_LABEL[d.cause],
      why: d.explanation,
      by: d.recordedBy,
    })),
  );
  ["C", "D", "E", "F"].forEach((c) => (del.getColumn(c).numFmt = "dd/mm/yyyy"));
  del.getColumn("G").numFmt = "0;(0);-";

  // ---- Blockers
  addSheet(
    wb,
    "Blockers",
    [
      { header: "Ref", key: "ref", width: 10 },
      { header: "Activity", key: "title", width: 34 },
      { header: "Type", key: "type", width: 16 },
      { header: "Constraint", key: "note", width: 50 },
      { header: "Owner", key: "owner", width: 22 },
      { header: "Action required", key: "action", width: 46 },
    ],
    p.blockers.map((b) => ({
      ref: b.taskId,
      title: b.taskTitle,
      type: b.type,
      note: b.note,
      owner: b.owner,
      action: b.action,
    })),
  );

  // ---- Comments
  const com = addSheet(
    wb,
    "Comments",
    [
      { header: "Date", key: "date", width: 14 },
      { header: "Ref", key: "ref", width: 10 },
      { header: "Activity", key: "title", width: 32 },
      { header: "Type", key: "kind", width: 12 },
      { header: "Recorded by", key: "by", width: 18 },
      { header: "Entry", key: "entry", width: 80 },
    ],
    p.comments.map((c) => ({
      date: new Date(c.at),
      ref: c.taskId,
      title: c.taskTitle,
      kind: c.kind,
      by: c.author,
      entry: c.reason ?? `${c.from ?? ""} → ${c.to ?? ""}`,
    })),
  );
  com.getColumn("A").numFmt = "dd/mm/yyyy";

  // ---- Look ahead
  const la = addSheet(
    wb,
    "Look-ahead",
    [
      { header: "Ref", key: "ref", width: 10 },
      { header: "Activity", key: "title", width: 34 },
      { header: "Start", key: "start", width: 14 },
      { header: "Crew", key: "crew", width: 20 },
      { header: "Clear to start", key: "ready", width: 14 },
      { header: "Note", key: "note", width: 70 },
    ],
    p.lookAhead.map((l) => ({
      ref: l.id,
      title: l.title,
      start: new Date(l.start),
      crew: l.crew,
      ready: l.ready ? "Yes" : "No",
      note: l.note,
    })),
  );
  la.getColumn("C").numFmt = "dd/mm/yyyy";

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `progress-report-${p.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${p.generatedAt.toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
