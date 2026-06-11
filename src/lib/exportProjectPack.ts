import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project } from "./mockData";
import { fmtMoney, financialKpi, pnlSummary, invoices, invoiceKpi } from "./mockData";
import type { ProjectData } from "./projectData";
import { getProjectVariations } from "./variations";
import { getGrns } from "./grnRegistry";

/**
 * Builds a PDF "project pack" — a single-document summary covering project
 * meta, financial KPIs, P&L, custom systems / BoQ, supplier picks, and
 * invoice reconciliation status. Triggers a browser download.
 */
export function exportProjectPack(project: Project, data: ProjectData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ---- Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Quantix Prime — Project Pack", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date().toLocaleString("en-GB")}`,
    margin,
    52,
  );
  y = 90;

  // ---- Project meta
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(project.name, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(project.subtitle, margin, y);
  y += 18;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [241, 245, 249], textColor: 30 },
    body: [
      ["Main contractor", project.mainContractor],
      ["Contract value", fmtMoney(project.contractValue)],
      ["Target margin", `${project.margin}%`],
      ["Progress", `${project.progress}%`],
      ["Health", project.health],
      ["Start", project.startDate],
      ["End", project.endDate],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Financial snapshot
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("Financial snapshot (MTD)", margin, y);
  y += 8;
  autoTable(doc, {
    startY: y + 4,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 5 },
    head: [["Metric", "Value", "Note"]],
    body: [
      ["Revenue", fmtMoney(financialKpi.revenueMtd), `vs target £${(financialKpi.revenueTarget / 1000).toFixed(0)}k`],
      ["COGS", fmtMoney(financialKpi.cogsMtd), `${financialKpi.cogsRevenuePct}% of revenue`],
      ["Gross margin", `${financialKpi.marginPct}%`, fmtMoney(financialKpi.margin)],
      ["Net profit", fmtMoney(pnlSummary.netProfit), `${pnlSummary.netPct}%`],
      ["Cash runway", `${financialKpi.cashRunway} mo`, fmtMoney(financialKpi.cashCurrent)],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Custom systems
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Systems on this project (${data.systems.length})`, margin, y);
  y += 8;
  if (data.systems.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("No systems added yet — use the Calculator to add systems.", margin, y + 14);
    y += 28;
  } else {
    autoTable(doc, {
      startY: y + 4,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4 },
      head: [["System", "L (m)", "H (m)", "Area (m²)", "Waste %", "Board"]],
      body: data.systems.map((s) => [
        s.systemCode,
        s.lengthM.toFixed(2),
        s.heightM.toFixed(2),
        s.areaM2.toFixed(2),
        `${s.wastePct}%`,
        s.boardSize,
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  // ---- BoQ lines
  if (data.boqLines.length > 0) {
    if (y > 700) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`BoQ lines (${data.boqLines.length})`, margin, y);
    autoTable(doc, {
      startY: y + 12,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 4 },
      head: [["Material", "Qty", "Unit", "Selected supplier"]],
      body: data.boqLines.map((l) => [
        l.material,
        l.qty.toFixed(2),
        l.unit,
        data.supplierChoices[l.material] ?? l.selectedSupplier ?? "—",
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  // ---- Invoice reconciliation
  if (y > 680) { doc.addPage(); y = margin; }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("Invoice reconciliation", margin, y);
  autoTable(doc, {
    startY: y + 12,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    head: [["Total", "Auto-matched", "Flagged", "Disputed"]],
    body: [[
      String(invoiceKpi.total),
      `${invoiceKpi.autoMatched} (${Math.round((invoiceKpi.autoMatched / invoiceKpi.total) * 100)}%)`,
      `${invoiceKpi.flagged} · £${invoiceKpi.flaggedVariance.toLocaleString()}`,
      String(invoiceKpi.disputed),
    ]],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y + 8,
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 4 },
    head: [["Invoice", "Supplier", "PO", "Invoiced", "Expected", "Variance", "State"]],
    body: invoices.map((inv) => [
      inv.id,
      inv.supplier,
      inv.poRef,
      `£${inv.invoiced.toLocaleString()}`,
      `£${inv.expected.toLocaleString()}`,
      inv.variance === 0 ? "£0" : `+£${inv.variance.toLocaleString()}`,
      inv.state,
    ]),
  });

  // ---- Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Quantix Prime · ${project.name} · Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  const safe = project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`project-pack-${safe}.pdf`);
}