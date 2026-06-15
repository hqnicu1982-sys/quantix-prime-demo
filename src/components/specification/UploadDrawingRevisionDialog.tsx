import { useMemo, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DRAWING_DISCIPLINES, DRAWING_NUMBER_REGEX, MAX_FILE_BYTES,
  addRevision, fileToDataUrl, formatBytes, getDrawings, groupByDrawing,
  type DrawingDiscipline,
} from "@/lib/drawingRegistry";
import { useCurrentUser } from "@/lib/currentUser";

export function UploadDrawingRevisionDialog({
  projectId, open, onOpenChange, defaultDrawingNumber,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDrawingNumber?: string;
}) {
  const me = useCurrentUser();
  const state = getDrawings(projectId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drawingNumber, setDrawingNumber] = useState(defaultDrawingNumber ?? "");
  const [revisionCode, setRevisionCode] = useState("");
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState<DrawingDiscipline>("Architect");
  const [isTender, setIsTender] = useState(!state.tenderLocked);
  const [changeNotes, setChangeNotes] = useState("");
  const [areasInput, setAreasInput] = useState("");
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => groupByDrawing(state), [state]);
  const matchingGroup = groups.find((g) => g.drawingNumber === drawingNumber.trim().toUpperCase());

  function reset() {
    setFile(null); setDrawingNumber(defaultDrawingNumber ?? ""); setRevisionCode("");
    setTitle(""); setDiscipline("Architect"); setIsTender(!state.tenderLocked);
    setChangeNotes(""); setAreasInput("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function close(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (!file) { toast.error("Pick a file"); return; }
    const dn = drawingNumber.trim().toUpperCase();
    if (!DRAWING_NUMBER_REGEX.test(dn)) {
      toast.error("Drawing number must look like A-201 or MEP-1004A");
      return;
    }
    if (!revisionCode.trim()) { toast.error("Revision code is required"); return; }
    if (state.tenderLocked && !changeNotes.trim()) {
      toast.error("Change notes are required for post-tender revisions");
      return;
    }
    setBusy(true);
    const dataUrl = await fileToDataUrl(file);
    const areas = areasInput.split(",").map((s) => s.trim()).filter(Boolean);
    const r = addRevision(projectId, {
      drawingNumber: dn,
      revisionCode: revisionCode.trim(),
      isTender: state.tenderLocked ? false : isTender,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      dataUrl,
      title: title.trim() || undefined,
      discipline,
      changeNotes: changeNotes.trim() || undefined,
      affectedAreas: areas.length ? areas : undefined,
      uploadedBy: me.name,
    });
    setBusy(false);
    if (!r.ok) {
      const msg: Record<typeof r.error, string> = {
        "too-large": `File exceeds ${formatBytes(MAX_FILE_BYTES)}`,
        "limit-reached": "Project revision limit reached",
        "tender-locked": "Tender set is locked — uploads cannot be marked tender",
        "invalid-number": "Invalid drawing number format",
        "duplicate-revision": `Revision ${revisionCode} already exists for ${dn}`,
        "post-tender-needs-notes": "Change notes are required for post-tender revisions",
      };
      toast.error(msg[r.error]);
      return;
    }
    toast.success(state.tenderLocked
      ? `${dn} · ${revisionCode} submitted — awaiting approval`
      : `${dn} · ${revisionCode} added to tender set`);
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--accent-500)]" />
            {state.tenderLocked ? "Upload drawing revision" : "Upload tender drawing"}
          </DialogTitle>
          <DialogDescription>
            {state.tenderLocked
              ? "Tender set is locked. New revisions enter review before becoming current."
              : "Add a drawing to the tender baseline. Issue the tender set to lock these."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-5 text-center hover:bg-[var(--ink-50)]"
          >
            {file ? (
              <>
                <FileText className="h-5 w-5 text-[var(--ink-700)]" />
                <p className="text-[12.5px] font-semibold">{file.name}</p>
                <p className="text-[11px] text-[var(--ink-500)]">{formatBytes(file.size)}</p>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-[var(--ink-500)]" />
                <p className="text-[12.5px] font-semibold">Click to choose a file</p>
                <p className="text-[11px] text-[var(--ink-500)]">PDF, DWG, PNG, JPG · up to {formatBytes(MAX_FILE_BYTES)}</p>
              </>
            )}
          </button>
          <input
            ref={fileRef} type="file" className="hidden"
            accept=".pdf,.dwg,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="drawing-no">Drawing number*</Label>
              <Input id="drawing-no" placeholder="A-201" value={drawingNumber}
                     onChange={(e) => setDrawingNumber(e.target.value.toUpperCase())} />
              {matchingGroup && (
                <p className="text-[10.5px] text-[var(--accent-500)]">
                  Adding revision to existing drawing · current {matchingGroup.current?.revisionCode ?? "—"}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revision">Revision code*</Label>
              <Input id="revision" placeholder={state.tenderLocked ? "C1" : "T1"} maxLength={6}
                     value={revisionCode} onChange={(e) => setRevisionCode(e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Level 04 GA" value={title}
                     onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Discipline</Label>
              <Select value={discipline} onValueChange={(v) => setDiscipline(v as DrawingDiscipline)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DRAWING_DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!state.tenderLocked && (
            <label className="flex items-start gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-3 cursor-pointer">
              <Checkbox checked={isTender} onCheckedChange={(v) => setIsTender(!!v)} className="mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[12px] font-semibold">Include in tender baseline</p>
                <p className="text-[11px] text-[var(--ink-500)]">
                  Tender revisions become read-only once the set is issued.
                </p>
              </div>
            </label>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Change notes {state.tenderLocked && <span className="text-[var(--red-500)]">*</span>}
            </Label>
            <Textarea id="notes" rows={3}
              placeholder={state.tenderLocked
                ? "What changed vs the previous revision? Affected systems / rooms?"
                : "Optional — context for this baseline drawing."}
              value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="areas">Affected areas (comma-separated)</Label>
            <Input id="areas" placeholder="L4 corridor, Bedrooms 4.12–4.18"
                   value={areasInput} onChange={(e) => setAreasInput(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => close(false)} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={busy || !file}>
            {busy ? "Uploading…" : (state.tenderLocked ? "Submit for review" : "Upload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}