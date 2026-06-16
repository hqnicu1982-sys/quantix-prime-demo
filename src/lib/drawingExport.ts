import { getDrawings, groupByDrawing } from "@/lib/drawingRegistry";

// CSV export of the project's drawing register. Pure function, no DOM.
function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmt(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

export function buildDrawingRegisterCsv(projectId: string): string {
  const state = getDrawings(projectId);
  const groups = groupByDrawing(state);
  const headers = [
    "Drawing number", "Title", "Discipline",
    "Current revision", "Current status", "Current uploaded", "Current uploader",
    "Tender revision", "Tender uploaded",
    "Pending count", "Total revisions",
    "Last change notes", "Last affected areas",
  ];
  const rows = groups.map((g) => {
    const last = g.history[0];
    return [
      g.drawingNumber,
      g.title ?? "",
      g.discipline,
      g.current?.revisionCode ?? "",
      g.current?.status ?? "",
      fmt(g.current?.uploadedAt),
      g.current?.uploadedBy ?? "",
      g.tender?.revisionCode ?? "",
      fmt(g.tender?.uploadedAt),
      String(g.pendingCount),
      String(g.history.length),
      last?.changeNotes ?? "",
      (last?.affectedAreas ?? []).join("; "),
    ].map(escapeCsv).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadDrawingRegisterCsv(projectId: string, filenameBase: string) {
  if (typeof window === "undefined") return;
  const csv = buildDrawingRegisterCsv(projectId);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-drawings-register.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}