import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import {
  PROJECT_DOC_TAGS,
  MAX_FILE_BYTES,
  addProjectDoc,
  fileToDataUrl,
  formatBytes,
  type ProjectDocTag,
} from "@/lib/projectDocuments";
import { useCurrentUser } from "@/lib/currentUser";

function defaultTagFor(name: string): ProjectDocTag {
  const n = name.toLowerCase();
  if (n.includes("fire")) return "Fire";
  if (n.includes("acoustic")) return "Acoustic";
  if (n.includes("nbs") || n.includes("spec")) return "Spec";
  if (n.includes("drawing") || n.includes("rev")) return "Architect";
  if (n.includes("schedule") || n.includes("performance")) return "Performance";
  return "Other";
}

export function UploadSpecDocDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [tag, setTag] = useState<ProjectDocTag>("Spec");
  const [busy, setBusy] = useState(false);

  function reset() {
    setFiles([]);
    setTag("Spec");
    if (fileRef.current) fileRef.current.value = "";
  }

  function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setFiles(arr);
    // Auto-suggest a tag from the first file name.
    setTag(defaultTagFor(arr[0].name));
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Pick at least one file");
      return;
    }
    setBusy(true);
    let added = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than ${formatBytes(MAX_FILE_BYTES)}`);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      const r = addProjectDoc(projectId, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        tag,
        uploadedBy: me.name,
      });
      if (!r.ok) {
        if (r.error === "limit-reached") {
          toast.error("Document limit reached");
          break;
        }
        continue;
      }
      added++;
    }
    setBusy(false);
    if (added > 0) {
      toast.success(`${added} document${added === 1 ? "" : "s"} uploaded`);
      reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--accent-500)]" />
            Upload specification documents
          </DialogTitle>
          <DialogDescription>
            Drawings, NBS specs, performance schedules, fire & acoustic reports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-6 text-center hover:bg-[var(--ink-50)]"
          >
            <Upload className="h-5 w-5 text-[var(--ink-500)]" />
            <p className="text-[12.5px] font-semibold">Click to choose files</p>
            <p className="text-[11px] text-[var(--ink-500)]">
              PDF, DOCX, XLSX, DWG, images · up to {formatBytes(MAX_FILE_BYTES)} each
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.dwg,.docx,.xlsx,.xls,.doc"
            onChange={(e) => pickFiles(e.target.files)}
          />

          {files.length > 0 && (
            <div className="rounded-md border border-[var(--ink-200)] divide-y divide-[var(--ink-200)]">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                  <p className="min-w-0 flex-1 truncate text-[12px] font-semibold">{f.name}</p>
                  <span className="text-[11px] text-[var(--ink-500)]">{formatBytes(f.size)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={tag} onValueChange={(v) => setTag(v as ProjectDocTag)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_DOC_TAGS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[var(--ink-500)]">
              Applied to all files in this upload — you can re-upload later with a different tag.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={handleUpload} disabled={busy || files.length === 0}>
            {busy ? "Uploading…" : `Upload ${files.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}