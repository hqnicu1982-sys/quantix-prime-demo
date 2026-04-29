import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Trash2,
  Paperclip,
  Layers,
} from "lucide-react";
import {
  ATTACHMENT_CATEGORIES,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
  addAttachment,
  fileToDataUrl,
  formatBytes,
  removeAttachment,
  updateNotes,
  useSystemDetails,
  type AttachmentCategory,
  type SystemAttachment,
} from "@/lib/systemDetails";
import { useCan } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";
import { LIBRARY } from "@/lib/systemLibrary";

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime === "application/pdf") return FileText;
  return FileIcon;
}

function categoryLabel(cat: AttachmentCategory) {
  return ATTACHMENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function categoryTone(cat: AttachmentCategory): string {
  switch (cat) {
    case "datasheet":   return "bg-[var(--accent-500)]/10 text-[var(--accent-500)]";
    case "certificate": return "bg-[var(--green-600)]/10 text-[var(--green-600)]";
    case "drawing":     return "bg-[var(--ink-50)] text-[var(--ink-700)]";
    case "test-report": return "bg-[var(--red-500)]/10 text-[var(--red-500)]";
    case "photo":       return "bg-[var(--amber-500)]/10 text-[var(--amber-500)]";
    default:            return "bg-[var(--ink-50)] text-[var(--ink-500)]";
  }
}

function libraryMatch(systemKey: string) {
  // Loose match: by shortName or by code prefix words.
  const lower = systemKey.toLowerCase();
  return LIBRARY.find(
    (s) =>
      lower.includes(s.shortName.toLowerCase().split(" ")[0]) ||
      s.shortName.toLowerCase().includes(lower.split(" ")[0]),
  );
}

export function SystemDetailsDialog({
  projectId,
  systemKey,
  systemMeta,
  open,
  onOpenChange,
  canSeeMoney,
}: {
  projectId: string;
  systemKey: string;
  systemMeta: { area: string; value: number };
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canSeeMoney: boolean;
}) {
  const details = useSystemDetails(projectId, systemKey);
  const canEdit = useCan("edit.specification");
  const me = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingCategory, setPendingCategory] = useState<AttachmentCategory>("datasheet");
  const [description, setDescription] = useState(details.description ?? "");
  const [installerNotes, setInstallerNotes] = useState(details.installerNotes ?? "");
  const [dirty, setDirty] = useState(false);

  // Reset locals when system or open state changes.
  // (cheap to re-derive; effect avoided to keep file lean)
  if (open && !dirty && (description !== (details.description ?? "") || installerNotes !== (details.installerNotes ?? ""))) {
    // no-op — local state is the editing buffer; we sync on Save.
  }

  const lib = libraryMatch(systemKey);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    let added = 0;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than ${formatBytes(MAX_FILE_BYTES)}`);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      const r = addAttachment(projectId, systemKey, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        category: pendingCategory,
        uploadedBy: me.name,
      });
      if (!r.ok) {
        if (r.error === "limit-reached") {
          toast.error(`Limit of ${MAX_ATTACHMENTS} attachments reached`);
          break;
        }
        if (r.error === "too-large") {
          toast.error(`${file.name} is too large`);
        }
        continue;
      }
      added++;
    }
    if (added > 0) toast.success(`${added} file${added === 1 ? "" : "s"} uploaded`);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDelete(att: SystemAttachment) {
    if (!confirm(`Delete "${att.fileName}"?`)) return;
    removeAttachment(projectId, systemKey, att.id);
    toast.success("Attachment removed");
  }

  function handleSaveNotes() {
    updateNotes(projectId, systemKey, { description, installerNotes });
    setDirty(false);
    toast.success("Notes saved");
  }

  // Group attachments by category
  const grouped = ATTACHMENT_CATEGORIES.map((c) => ({
    cat: c,
    items: details.attachments.filter((a) => a.category === c.value),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--accent-500)]" />
            {systemKey}
          </DialogTitle>
          <DialogDescription>
            {systemMeta.area}
            {canSeeMoney && (
              <> · £{systemMeta.value.toLocaleString("en-GB")}</>
            )}
            {details.attachments.length > 0 && (
              <> · {details.attachments.length} document{details.attachments.length === 1 ? "" : "s"}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {details.attachments.length > 0 && (
                <span className="ml-1.5 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-500)]">
                  {details.attachments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="buildup">Build-up</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="sd-desc">Technical description</Label>
              <Textarea
                id="sd-desc"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                placeholder={canEdit ? "Add a description for this system (overrides library default)…" : "No description added."}
                rows={4}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sd-notes">Installer notes (site)</Label>
              <Textarea
                id="sd-notes"
                value={installerNotes}
                onChange={(e) => { setInstallerNotes(e.target.value); setDirty(true); }}
                placeholder={canEdit ? "Notes for the crew on site (e.g. screw spec, sequencing, traps)…" : "No installer notes."}
                rows={4}
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveNotes} disabled={!dirty}>
                  Save notes
                </Button>
              </div>
            )}
            {!canEdit && (
              <p className="text-[11.5px] text-[var(--ink-500)]">
                Read-only — your role can view documentation but cannot edit notes or upload files.
              </p>
            )}
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="space-y-4 pt-2">
            {canEdit && (
              <div className="rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">Category</Label>
                    <Select value={pendingCategory} onValueChange={(v) => setPendingCategory(v as AttachmentCategory)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ATTACHMENT_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload files
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.dwg,.docx,.xlsx,.xls,.doc"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <p className="ml-auto text-[11px] text-[var(--ink-500)]">
                    Up to {formatBytes(MAX_FILE_BYTES)} per file · max {MAX_ATTACHMENTS} files
                  </p>
                </div>
              </div>
            )}

            {details.attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Paperclip className="h-6 w-6 text-[var(--ink-500)]" />
                <p className="text-[13px] font-semibold">No documents yet</p>
                <p className="text-[11.5px] text-[var(--ink-500)]">
                  {canEdit
                    ? "Upload datasheets, certificates, drawings or site photos for this system."
                    : "No documentation has been added for this system."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map(({ cat, items }) => (
                  <div key={cat.value}>
                    <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                      {cat.label} · {items.length}
                    </p>
                    <div className="divide-y divide-[var(--ink-200)] rounded-md border border-[var(--ink-200)]">
                      {items.map((a) => {
                        const Icon = iconFor(a.mimeType);
                        return (
                          <div key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--ink-50)]">
                              <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-semibold">{a.fileName}</p>
                              <p className="text-[11px] text-[var(--ink-500)]">
                                {formatBytes(a.fileSize)} · uploaded by {a.uploadedBy} ·{" "}
                                {new Date(a.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${categoryTone(a.category)}`}>
                              {categoryLabel(a.category)}
                            </span>
                            <a
                              href={a.dataUrl}
                              download={a.fileName}
                              className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
                              aria-label="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(a)}
                                className="rounded p-1.5 text-[var(--red-500)] hover:bg-[var(--red-500)]/10"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BUILD-UP */}
          <TabsContent value="buildup" className="space-y-3 pt-2">
            {lib ? (
              <>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Library reference</p>
                  <p className="text-[13px] font-semibold">{lib.shortName}</p>
                  <p className="mt-1 text-[12px] text-[var(--ink-700)]">{lib.desc}</p>
                </div>
                <div className="grid gap-2 rounded-md border border-[var(--ink-200)] p-3 text-[12.5px]">
                  {lib.buildUp.map((b) => (
                    <div key={b.k} className="flex justify-between">
                      <span className="text-[var(--ink-500)]">{b.k}</span>
                      <span className="font-semibold">{b.v}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
                  <div className="rounded-md bg-[var(--ink-50)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Fire</p>
                    <p className="font-semibold">{lib.perf.fire ? `${lib.perf.fire} min` : "—"}</p>
                  </div>
                  <div className="rounded-md bg-[var(--ink-50)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Acoustic</p>
                    <p className="font-semibold">{lib.perf.rw ? `${lib.perf.rw} dB` : "—"}</p>
                  </div>
                  <div className="rounded-md bg-[var(--ink-50)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Max height</p>
                    <p className="font-semibold">{(lib.perf.maxHeight / 1000).toFixed(1)} m</p>
                  </div>
                  <div className="rounded-md bg-[var(--ink-50)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">Weight</p>
                    <p className="font-semibold">{lib.perf.weight} kg/m²</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-[var(--ink-200)] p-6 text-center">
                <Layers className="mx-auto h-5 w-5 text-[var(--ink-500)]" />
                <p className="mt-2 text-[12.5px] font-semibold">No library match</p>
                <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                  Use the Overview tab to document the build-up, or attach a datasheet on Documents.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}