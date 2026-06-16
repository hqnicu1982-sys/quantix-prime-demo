import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DRAWING_DISCIPLINES, DRAWING_NUMBER_REGEX, REVISION_CODE_REGEX,
  bulkAddRevisions, fileToDataUrl, formatBytes, getDrawings,
  type DrawingDiscipline, type AddRevisionInput,
} from "@/lib/drawingRegistry";
import { useCurrentUser } from "@/lib/currentUser";

type Row = {
  file: File;
  drawingNumber: string;
  revisionCode: string;
  discipline: DrawingDiscipline;
};

// Try to parse "<DRAWING>-<REV>.<ext>" or with separators.
const FILE_REGEX = /^([A-Z]{1,3}-\d{2,4}[A-Z]?)[ _-]+([A-Z]?\d{1,4}|[A-Z]{1,2}\d{0,3})\.[a-z0-9]+$/i;

function parseFile(name: string): { drawingNumber: string; revisionCode: string } {
  const m = name.match(FILE_REGEX);
  if (!m) return { drawingNumber: "", revisionCode: "" };
  return { drawingNumber: m[1].toUpperCase(), revisionCode: m[2].toUpperCase() };
}

export function BulkUploadDrawingsDialog({
  projectId, open, onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const state = getDrawings(projectId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [globalNotes, setGlobalNotes] = useState("");
  const [busy, setBusy] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added: Row[] = Array.from(files).map((f) => {
      const p = parseFile(f.name);
      return { file: f, drawingNumber: p.drawingNumber, revisionCode: p.revisionCode, discipline: "Architect" };
    });
    setRows((cur) => [...cur, ...added]);
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((cur) => cur.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows((cur) => cur.filter((_, j) => i !== j));
  }
  function reset() {
    setRows([]); setGlobalNotes("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const unmapped = rows.filter((r) => !DRAWING_NUMBER_REGEX.test(r.drawingNumber) || !REVISION_CODE_REGEX.test(r.revisionCode));
  const mapped = rows.filter((r) => !unmapped.includes(r));

  async function handleSubmit() {
    if (mapped.length === 0) { toast.error("No valid rows to upload"); return; }
    if (state.tenderLocked && !globalNotes.trim()) {
      toast.error("Change notes are required for post-tender uploads");
      return;
    }
    setBusy(true);
    const inputs: AddRevisionInput[] = [];
    for (const row of mapped) {
      const dataUrl = await fileToDataUrl(row.file);
      inputs.push({
        drawingNumber: row.drawingNumber,
        revisionCode: row.revisionCode,
        isTender: !state.tenderLocked,
        fileName: row.file.name,
        fileSize: row.file.size,
        mimeType: row.file.type || "application/octet-stream",
        dataUrl,
        discipline: row.discipline,
        changeNotes: globalNotes.trim() || undefined,
        uploadedBy: me.name,
      });
    }
    const result = bulkAddRevisions(projectId, inputs);
    setBusy(false);
    toast.success(`${result.added.length} added${result.errors.length ? ` · ${result.errors.length} skipped` : ""}`, {
      description: result.errors.length
        ? result.errors.map((e) => `${e.input.drawingNumber}/${e.input.revisionCode}: ${e.error}`).join(" · ")
        : undefined,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--accent-500)]" /> Bulk upload drawings
          </DialogTitle>
          <DialogDescription>
            Drop multiple files at once. Names matching <code className="font-mono-num">A-201-T1.pdf</code> auto-map.
            Anything else needs manual fields below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-4 text-[12.5px] hover:bg-[var(--ink-50)]"
          >
            <Upload className="h-4 w-4 text-[var(--ink-500)]" />
            <span className="font-semibold">Click to add files</span>
            <span className="text-[var(--ink-500)]">· PDF, DWG, PNG, JPG</span>
          </button>
          <input
            ref={fileRef} type="file" className="hidden" multiple
            accept=".pdf,.dwg,.png,.jpg,.jpeg,.webp"
            onChange={(e) => addFiles(e.target.files)}
          />

          {rows.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-md border border-[var(--ink-200)] divide-y divide-[var(--ink-200)]">
              {rows.map((r, i) => {
                const needsAttention = unmapped.includes(r);
                return (
                  <div key={i} className={`grid grid-cols-[1fr_110px_90px_120px_24px] items-center gap-2 px-2 py-1.5 ${needsAttention ? "bg-[var(--amber-500)]/5" : ""}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold">{r.file.name}</p>
                      <p className="text-[10.5px] text-[var(--ink-500)]">{formatBytes(r.file.size)}</p>
                    </div>
                    <Input value={r.drawingNumber} onChange={(e) => updateRow(i, { drawingNumber: e.target.value.toUpperCase() })} placeholder="A-201" className="h-7 text-[11.5px]" />
                    <Input value={r.revisionCode} onChange={(e) => updateRow(i, { revisionCode: e.target.value.toUpperCase() })} placeholder={state.tenderLocked ? "C1" : "T1"} maxLength={6} className="h-7 text-[11.5px]" />
                    <Select value={r.discipline} onValueChange={(v) => updateRow(i, { discipline: v as DrawingDiscipline })}>
                      <SelectTrigger className="h-7 text-[11.5px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{DRAWING_DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <button type="button" onClick={() => removeRow(i)} className="text-[var(--ink-500)] hover:text-[var(--red-500)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {unmapped.length > 0 && (
            <div className="flex gap-2 rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 p-2 text-[11px] text-[var(--ink-700)]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--amber-500)] mt-0.5" />
              {unmapped.length} file{unmapped.length === 1 ? "" : "s"} need manual drawing number / revision before upload.
            </div>
          )}

          {state.tenderLocked && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-notes">Change notes (applied to all) *</Label>
              <Textarea id="bulk-notes" rows={2} value={globalNotes} onChange={(e) => setGlobalNotes(e.target.value)} placeholder="What changed in this batch?" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={busy || mapped.length === 0}>
            {busy ? "Uploading…" : `Upload ${mapped.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}