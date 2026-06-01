// ============================================================================
// Programme file parsers — convert XML / CSV / PDF exports into MspBundle.
// All parsers run client-side. Output shape matches MspBundle so the rest of
// the planner sync flow (mapping, apply, profit forecast) stays unchanged.
// ============================================================================

import type { MspBundle, MspTaskRow } from "./msProjectImport";

function isoFromAny(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  // Already ISO (yyyy-mm-dd or yyyy-mm-ddThh:mm:ss)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    let yyyy = dmy[3];
    if (yyyy.length === 2) yyyy = (parseInt(yyyy, 10) > 50 ? "19" : "20") + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  // Fallback: Date parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function daysBetweenIso(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (isNaN(da) || isNaN(db)) return 1;
  return Math.max(1, Math.round((db - da) / 86_400_000) + 1);
}

function parseDurationDays(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/([\d.]+)\s*(d|day|days|h|hr|hour|w|week|weeks|edays?)/i);
  if (!m) {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("w")) return n * 5;
  if (unit.startsWith("h")) return Math.max(1, n / 8);
  return n;
}

function parseWorkHours(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/([\d.]+)\s*(h|hr|hour|d|day)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "h").toLowerCase();
  if (unit.startsWith("d")) return n * 8;
  return n;
}

// ---------------------------------------------------------------------------
// MS Project XML (.xml export from File → Save As → XML)
// ---------------------------------------------------------------------------
export function parseMspXml(text: string, fileName: string): MspBundle {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("XML invalid — verifică exportul MS Project.");

  const taskNodes = Array.from(doc.getElementsByTagName("Task"));
  const rows: MspTaskRow[] = [];
  let idx = 0;
  for (const node of taskNodes) {
    const name = node.getElementsByTagName("Name")[0]?.textContent?.trim();
    const start = isoFromAny(node.getElementsByTagName("Start")[0]?.textContent);
    const finish = isoFromAny(node.getElementsByTagName("Finish")[0]?.textContent);
    if (!name || !start || !finish) continue;
    // MSP Duration is ISO 8601 (PT320H0M0S) — extract hours
    const durRaw = node.getElementsByTagName("Duration")[0]?.textContent ?? "";
    const workRaw = node.getElementsByTagName("Work")[0]?.textContent ?? "";
    const durHoursMatch = durRaw.match(/PT(\d+)H/);
    const workHoursMatch = workRaw.match(/PT(\d+)H/);
    const durationDays = durHoursMatch
      ? Math.max(1, Math.round(parseInt(durHoursMatch[1], 10) / 8))
      : daysBetweenIso(start, finish);
    const workHours = workHoursMatch ? parseInt(workHoursMatch[1], 10) : durationDays * 8;
    const uid = parseInt(node.getElementsByTagName("UID")[0]?.textContent ?? "0", 10) || 1000 + idx;
    const outline = node.getElementsByTagName("OutlineNumber")[0]?.textContent ?? `1.${idx + 1}`;
    const pct = parseFloat(node.getElementsByTagName("PercentComplete")[0]?.textContent ?? "0") || 0;
    rows.push({
      uid,
      outline,
      name,
      start,
      finish,
      durationDays,
      workHours,
      resourceNames: "",
      pctComplete: pct,
    });
    idx += 1;
  }
  if (rows.length === 0) throw new Error("Nu am găsit task-uri în XML.");
  return {
    fileName,
    baselineName: "Imported from MS Project XML",
    exportedAt: new Date().toISOString(),
    rows,
  };
}

// ---------------------------------------------------------------------------
// CSV — columns: Name, Start, Finish, Duration (optional), Work (optional),
// Resource (optional). Delimiter is auto-detected (comma / semicolon / tab).
// ---------------------------------------------------------------------------
function detectDelimiter(line: string): string {
  const counts = { ",": 0, ";": 0, "\t": 0 } as Record<string, number>;
  for (const ch of line) if (ch in counts) counts[ch] += 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ",";
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseCsv(text: string, fileName: string): MspBundle {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV gol sau fără date.");
  const delim = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delim).map((h) => h.toLowerCase());
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };
  const nameI = idx("name", "task", "activity");
  const startI = idx("start");
  const finishI = idx("finish", "end");
  const durI = idx("duration");
  const workI = idx("work", "hours", "effort");
  const resI = idx("resource", "crew", "team");
  if (nameI === -1 || startI === -1 || finishI === -1) {
    throw new Error("CSV lipsește coloana Name, Start sau Finish.");
  }

  const rows: MspTaskRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim);
    const name = cells[nameI];
    const start = isoFromAny(cells[startI]);
    const finish = isoFromAny(cells[finishI]);
    if (!name || !start || !finish) continue;
    const durationDays =
      durI !== -1 ? parseDurationDays(cells[durI]) ?? daysBetweenIso(start, finish) : daysBetweenIso(start, finish);
    const workHours =
      workI !== -1 ? parseWorkHours(cells[workI]) ?? durationDays * 8 : durationDays * 8;
    rows.push({
      uid: 2000 + i,
      outline: String(i),
      name,
      start,
      finish,
      durationDays,
      workHours,
      resourceNames: resI !== -1 ? cells[resI] ?? "" : "",
      pctComplete: 0,
    });
  }
  if (rows.length === 0) throw new Error("Nu am găsit rânduri valide în CSV.");
  return {
    fileName,
    baselineName: "Imported from CSV",
    exportedAt: new Date().toISOString(),
    rows,
  };
}

// ---------------------------------------------------------------------------
// PDF — text-extract with pdfjs, then heuristic table parsing.
// Looks for lines that contain a date pair (start + finish) and treats the
// preceding text as the task name. Best-effort: scanned PDFs return [].
// ---------------------------------------------------------------------------
const DATE_REGEX = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;

export async function parsePdf(buffer: ArrayBuffer, fileName: string): Promise<MspBundle> {
  // Lazy-load pdfjs and disable the worker — runs inline (fine for one-off parse).
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // @ts-expect-error — disabling worker uses fake-worker mode
  pdfjs.GlobalWorkerOptions.workerSrc = "";
  const loadingTask = pdfjs.getDocument({ data: buffer, disableWorker: true, useWorkerFetch: false });
  const pdf = await loadingTask.promise;

  const allLines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Group items by Y position to reconstruct lines
    const byY: Record<string, { x: number; str: string }[]> = {};
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      (byY[y] ||= []).push({ x, str: item.str });
    }
    const yKeys = Object.keys(byY)
      .map(Number)
      .sort((a, b) => b - a);
    for (const y of yKeys) {
      const line = byY[y]
        .sort((a, b) => a.x - b.x)
        .map((c) => c.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) allLines.push(line);
    }
  }

  const rows: MspTaskRow[] = [];
  let idx = 0;
  for (const line of allLines) {
    const dates = line.match(DATE_REGEX);
    if (!dates || dates.length < 2) continue;
    const start = isoFromAny(dates[0]);
    const finish = isoFromAny(dates[1]);
    if (!start || !finish) continue;
    // Name = text before the first date, stripped of bullets / numbering
    const firstDateIdx = line.indexOf(dates[0]);
    let name = line.slice(0, firstDateIdx).trim();
    name = name.replace(/^[\d\.\)\s]*/, "").trim();
    if (name.length < 3) continue;
    // Try to grab work hours from the tail
    const tail = line.slice(firstDateIdx + dates[0].length);
    const workMatch = tail.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours|man[\s-]?hour)/i);
    const durMatch = tail.match(/(\d+(?:\.\d+)?)\s*(?:d|day|days)/i);
    const durationDays =
      durMatch ? parseFloat(durMatch[1]) : daysBetweenIso(start, finish);
    const workHours = workMatch ? parseFloat(workMatch[1]) : durationDays * 8;
    rows.push({
      uid: 3000 + idx,
      outline: String(idx + 1),
      name: name.slice(0, 160),
      start,
      finish,
      durationDays,
      workHours,
      resourceNames: "",
      pctComplete: 0,
    });
    idx += 1;
  }

  if (rows.length === 0) {
    throw new Error(
      "Nu am putut extrage task-uri din PDF (poate fi scanat sau fără tabel). Încearcă export XML/CSV.",
    );
  }
  return {
    fileName,
    baselineName: "Imported from PDF programme",
    exportedAt: new Date().toISOString(),
    rows,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export async function parseProgrammeFile(file: File): Promise<MspBundle> {
  const name = file.name;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "xml") {
    const text = await file.text();
    return parseMspXml(text, name);
  }
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const text = await file.text();
    return parseCsv(text, name);
  }
  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    return parsePdf(buffer, name);
  }
  if (ext === "mpp") {
    throw new Error(
      "Fișierele .mpp nu pot fi citite direct în browser. Deschide MS Project → File → Save As → XML și încarcă fișierul .xml.",
    );
  }
  if (ext === "xlsx" || ext === "xls") {
    throw new Error(
      "Excel nu este suportat încă. Exportă ca CSV (File → Save As → CSV) și încarcă-l aici.",
    );
  }
  throw new Error(`Format necunoscut: .${ext}. Acceptăm .xml, .csv, .pdf.`);
}