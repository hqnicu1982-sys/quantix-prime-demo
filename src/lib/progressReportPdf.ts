import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DELAY_CAUSE_LABEL, type DelayRow, type ProgressEvent, type ProgressRow } from "./progressLog";
import type { BlockerRow } from "./progressNarrative";

export type ReportPayload = {
  projectName: string;
  projectClient?: string;
  periodLabel: string;
  preparedBy: string;
  generatedAt: Date;
  summary: string[];
  rows: ProgressRow[];
  delays: DelayRow[];
  blockers: BlockerRow[];
  comments: ProgressEvent[];
  lookAhead: { id: string; title: string; start: string; crew: string; ready: boolean; note: string }[];
  commentary: string;
};

const INK = [15, 23, 42] as const;

export function exportProgressReportPdf(p: ReportPayload) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, pageW, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Progress & Delay Report", margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(p.projectName, margin, 54);
  doc.text(
    `${p.periodLabel} · Prepared by ${p.preparedBy} · ${p.generatedAt.toLocaleDateString("en-GB")}`,
    margin,
    70,
  );

  let y = 108;
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Executive summary", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  for (const para of p.summary) {
    const lines = doc.splitTextToSize(para, pageW - margin * 2);
    if (y + lines.length * 12 > 780) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 12 + 8;
  }

  if (p.commentary.trim()) {
    doc.setFont("helvetica", "bold");
    doc.text("Commentary / mitigation", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(p.commentary, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 8;
  }

  const section = (title: string) => {
    const cur = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    const startY = cur ? cur.finalY + 26 : y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (startY > 760) {
      doc.addPage();
      doc.text(title, margin, margin);
      return margin + 10;
    }
    doc.text(title, margin, startY);
    return startY + 10;
  };

  const head = { fillColor: [15, 23, 42] as [number, number, number], textColor: 255, fontSize: 8.5 };
  const body = { fontSize: 8, cellPadding: 4 };

  autoTable(doc, {
    startY: section("2. Progress against programme"),
    head: [["Ref", "Activity", "Location", "Crew", "Planned", "Current", "% done", "% due", "Var (d)", "Status"]],
    body: p.rows.map((r) => [
      r.taskId,
      r.title,
      r.level,
      r.crew,
      `${r.plannedStart} → ${r.plannedEnd}`,
      `${r.currentStart} → ${r.currentEnd}`,
      `${r.progress}%`,
      `${r.expected}%`,
      r.varianceDays === 0 ? "—" : r.varianceDays > 0 ? `+${r.varianceDays}` : String(r.varianceDays),
      r.status,
    ]),
    headStyles: head,
    styles: body,
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: section("3. Delay register"),
    head: [["Ref", "Activity", "Original", "Revised", "Days", "Cause", "Reason recorded"]],
    body: p.delays.length
      ? p.delays.map((d) => [
          d.taskId,
          d.taskTitle,
          `${d.originalStart} → ${d.originalEnd}`,
          `${d.currentStart} → ${d.currentEnd}`,
          String(d.daysLost),
          DELAY_CAUSE_LABEL[d.cause],
          d.explanation,
        ])
      : [["—", "No date changes recorded in this period.", "", "", "", "", ""]],
    headStyles: head,
    styles: body,
    columnStyles: { 6: { cellWidth: 150 } },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: section("4. Constraint / blocker register"),
    head: [["Ref", "Activity", "Type", "Constraint", "Owner", "Action required"]],
    body: p.blockers.length
      ? p.blockers.map((b) => [b.taskId, b.taskTitle, b.type, b.note, b.owner, b.action])
      : [["—", "No open constraints at the date of this report.", "", "", "", ""]],
    headStyles: head,
    styles: body,
    columnStyles: { 3: { cellWidth: 130 }, 5: { cellWidth: 120 } },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: section("5. Two-week look ahead"),
    head: [["Ref", "Activity", "Start", "Crew", "Clear to start", "Note"]],
    body: p.lookAhead.length
      ? p.lookAhead.map((l) => [l.id, l.title, l.start, l.crew, l.ready ? "Yes" : "No", l.note])
      : [["—", "No activities scheduled to start in the next two weeks.", "", "", "", ""]],
    headStyles: head,
    styles: body,
    columnStyles: { 5: { cellWidth: 170 } },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: section("6. Site comment log"),
    head: [["Date", "Ref", "Activity", "Recorded by", "Comment"]],
    body: p.comments.length
      ? p.comments.map((c) => [
          new Date(c.at).toLocaleDateString("en-GB"),
          c.taskId,
          c.taskTitle,
          c.author,
          c.reason ?? `${c.from ?? ""} → ${c.to ?? ""}`,
        ])
      : [["—", "", "No comments recorded in this period.", "", ""]],
    headStyles: head,
    styles: body,
    columnStyles: { 4: { cellWidth: 210 } },
    margin: { left: margin, right: margin },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(
      `${p.projectName} · Progress & Delay Report · ${p.generatedAt.toLocaleDateString("en-GB")}`,
      margin,
      820,
    );
    doc.text(`Page ${i} of ${pages}`, pageW - margin, 820, { align: "right" });
  }

  doc.save(
    `progress-report-${p.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.generatedAt
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}
