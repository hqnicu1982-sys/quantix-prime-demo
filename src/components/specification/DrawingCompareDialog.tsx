import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Download, AlertCircle, Info, Maximize2, Link2, Link2Off,
  Plus, Pencil, X, Check, CheckCircle2, ArrowRight, RotateCcw, ArrowUpRight,
} from "lucide-react";
import { isPreviewable, type DrawingRevision } from "@/lib/drawingRegistry";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  useQsReview, addFinding, updateFinding, removeFinding,
  markReviewedNoImpact, markReviewedWithVariation, reopenReview,
  findingTypeMeta, FINDING_TYPES,
  type FindingType, type QsFinding,
} from "@/lib/qsFindings";
import { useProjectData } from "@/lib/projectData";
import { useCurrentUser } from "@/lib/currentUser";
import { addVariation, getNextVoNumber } from "@/lib/variations";
import { cn } from "@/lib/utils";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Pane({ label, badge, rev }: { label: string; badge: string; rev?: DrawingRevision }) {
  if (!rev) {
    return (
      <div className="flex h-full flex-col rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-6 items-center justify-center text-center">
        <AlertCircle className="h-5 w-5 text-[var(--ink-500)]" />
        <p className="mt-2 text-[12px] font-semibold">{label}</p>
        <p className="text-[11px] text-[var(--ink-500)]">No revision available</p>
      </div>
    );
  }
  const canPreview = isPreviewable(rev.mimeType) && rev.dataUrl;
  return (
    <div className="flex h-full flex-col rounded-md border border-[var(--ink-200)] overflow-hidden bg-card">
      <div className="flex items-center justify-between border-b border-[var(--ink-200)] bg-[var(--ink-50)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
          <p className="truncate text-[12.5px] font-semibold">{badge} · {rev.drawingNumber} · {rev.revisionCode}</p>
          <p className="text-[10.5px] text-[var(--ink-500)]">{fmtDate(rev.uploadedAt)} · {rev.uploadedBy}</p>
        </div>
        {rev.dataUrl && (
          <a href={rev.dataUrl} download={rev.fileName}
             className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-200)]" aria-label="Download">
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <div className="relative flex-1 bg-[var(--ink-50)]">
        {canPreview ? (
          rev.mimeType === "application/pdf" ? (
            <iframe src={`${rev.dataUrl}#toolbar=0&view=Fit`} className="absolute inset-0 h-full w-full" title={rev.fileName} />
          ) : (
            <img src={rev.dataUrl} alt={rev.fileName} className="absolute inset-0 h-full w-full object-contain" />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
            <AlertCircle className="h-5 w-5 text-[var(--ink-500)]" />
            <p className="text-[12px] font-semibold">Preview not available</p>
            <p className="text-[11px] text-[var(--ink-500)]">
              {rev.seed ? "Sample document — re-upload to enable preview." : "DWG / unsupported format. Download to view in CAD."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DrawingCompareDialog({
  open, onOpenChange, tender, current, projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tender?: DrawingRevision;
  current?: DrawingRevision;
  projectId: string;
}) {
  const isMobile = useIsMobile();
  const [fit, setFit] = useState(true);
  const [synced, setSynced] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="border-b border-[var(--ink-200)] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[14px]">
              Compare with tender · {tender?.drawingNumber ?? current?.drawingNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={fit ? "default" : "outline"}
                size="sm"
                onClick={() => setFit((v) => !v)}
                title="Fit to pane"
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Fit
              </Button>
              <Button
                variant={synced ? "default" : "outline"}
                size="sm"
                onClick={() => setSynced((v) => !v)}
                title="Sync pan &amp; zoom across panes"
              >
                {synced
                  ? <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  : <Link2Off className="mr-1.5 h-3.5 w-3.5" />}
                Synced
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
          <div className="mt-2 flex items-start gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)] px-3 py-2 text-[11.5px] text-[var(--ink-700)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />
            <span>
              Quantix shows both drawings and every fact it has. Measuring the change is the QS's to make — it does not invent the quantity.
            </span>
          </div>
        </DialogHeader>
        {isMobile ? (
          <Tabs defaultValue="review" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="mx-3 mt-2 self-start">
              <TabsTrigger value="tender">Tender</TabsTrigger>
              <TabsTrigger value="revision">Revision</TabsTrigger>
              <TabsTrigger value="review">QS Review</TabsTrigger>
            </TabsList>
            <TabsContent value="tender" className="flex-1 min-h-0 p-3">
              <Pane label="Tender baseline" badge="Tender" rev={tender} />
            </TabsContent>
            <TabsContent value="revision" className="flex-1 min-h-0 p-3">
              <Pane label="Selected revision" badge={current?.isTender ? "Tender" : "Revision"} rev={current} />
            </TabsContent>
            <TabsContent value="review" className="flex-1 min-h-0 p-3">
              <QsReviewPanel projectId={projectId} tender={tender} current={current} onClose={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid flex-1 min-h-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
            <Pane label="Tender baseline" badge="Tender" rev={tender} />
            <Pane label="Selected revision" badge={current?.isTender ? "Tender" : "Revision"} rev={current} />
            <QsReviewPanel projectId={projectId} tender={tender} current={current} onClose={() => onOpenChange(false)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// QS Review panel
// ============================================================================

function typeChipCls(t: FindingType): string {
  const tone = findingTypeMeta(t).tone;
  switch (tone) {
    case "success": return "bg-[var(--green-600)]/10 text-[var(--green-600)] border-[var(--green-600)]/25";
    case "danger":  return "bg-[var(--red-500)]/10 text-[var(--red-500)] border-[var(--red-500)]/25";
    case "warning": return "bg-[var(--amber-500)]/10 text-[var(--amber-500)] border-[var(--amber-500)]/25";
    case "info":    return "bg-[var(--accent-500)]/10 text-[var(--accent-500)] border-[var(--accent-500)]/25";
    default:        return "bg-[var(--ink-50)] text-[var(--ink-700)] border-[var(--ink-200)]";
  }
}

function QsReviewPanel({
  projectId, tender, current, onClose,
}: {
  projectId: string;
  tender?: DrawingRevision;
  current?: DrawingRevision;
  onClose: () => void;
}) {
  const me = useCurrentUser();
  const review = useQsReview(projectId, current?.id ?? "");
  const projectData = useProjectData(projectId);
  const systemOptions = useMemo(
    () => Array.from(new Set(projectData.systems.map((s) => s.systemName))).sort(),
    [projectData.systems],
  );

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reviewed = review.status !== "open";
  const findings = review.findings;

  function handleNoImpact() {
    if (!current) return;
    markReviewedNoImpact(projectId, current.id, me.name);
    toast.success(`${current.drawingNumber} · ${current.revisionCode} marked reviewed — no impact`);
  }

  function handleSaveAndOpenVariation() {
    if (!current || findings.length === 0) return;
    const changes = findings.map((f) => ({
      id: `chg-${f.id}`,
      op: (f.type === "removed" ? "remove_line" :
           f.type === "added"   ? "add_line"    :
           f.type === "extent"  ? "adjust_qty"  :
                                  "modify_system") as
        "remove_line" | "add_line" | "adjust_qty" | "modify_system",
      description: findingSummary(f),
      qty: undefined,
      unit: undefined,
      ratePerUnit: undefined,
      lineTotal: 0,
    }));
    const voId = getNextVoNumber(projectId);
    addVariation(projectId, {
      id: voId,
      title: `Revision ${current.drawingNumber} · ${tender?.revisionCode ?? "?"} → ${current.revisionCode}`,
      reason: `Drawing revision assessed by QS — ${findings.length} finding${findings.length === 1 ? "" : "s"} recorded.`,
      raisedBy: "designer",
      raisedDate: new Date().toISOString().slice(0, 10),
      status: "draft",
      changes,
      timeImpactDays: 0,
      attachments: [{ name: `${current.drawingNumber}-${current.revisionCode}.pdf` }],
      source: "manual",
      triggeredByRevisionId: current.id,
      triggeredByDrawing: `${current.drawingNumber} · ${current.revisionCode}`,
    });
    markReviewedWithVariation(projectId, current.id, me.name, voId);
    toast.success(`${voId} opened with ${findings.length} finding${findings.length === 1 ? "" : "s"}`);
  }

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[var(--ink-200)] p-6 text-center text-[11px] text-[var(--ink-500)]">
        Select a revision to review.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-[var(--ink-200)] bg-card">
      {/* Header */}
      <div className="border-b border-[var(--ink-200)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)]">QS Review</p>
          {reviewed && (
            review.status === "reviewed-no-impact" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--green-600)]/25 bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]">
                <CheckCircle2 className="h-3 w-3" /> Reviewed · No impact
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-500)]/25 bg-[var(--accent-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--accent-500)]">
                <CheckCircle2 className="h-3 w-3" />
                Reviewed · {findings.length} finding{findings.length === 1 ? "" : "s"}
                {review.variationId && (
                  <Link
                    to="/projects/$projectId/variations"
                    params={{ projectId }}
                    onClick={onClose}
                    className="ml-0.5 inline-flex items-center gap-0.5 underline underline-offset-2"
                  >
                    → {review.variationId}
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </Link>
                )}
              </span>
            )
          )}
        </div>
        <p className="mt-1 text-[13px] font-semibold text-[var(--ink-900)]">
          Revision {tender?.revisionCode ?? "—"} → {current.revisionCode}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">
          {current.changeNotes?.trim() || "No uploader change notes."}
        </p>
      </div>

      {/* Findings list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {findings.length === 0 && !adding && (
          <div className="rounded-md border border-dashed border-[var(--ink-200)] p-4 text-center">
            <p className="text-[12px] font-semibold text-[var(--ink-700)]">No findings recorded yet.</p>
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">
              Compare the drawings and log what changed — additions, omissions, substitutions.
            </p>
          </div>
        )}

        {findings.map((f) =>
          editingId === f.id && !reviewed ? (
            <FindingForm
              key={f.id}
              systemOptions={systemOptions}
              initial={f}
              onCancel={() => setEditingId(null)}
              onSubmit={(patch) => {
                updateFinding(projectId, current.id, f.id, patch);
                setEditingId(null);
                toast.success("Finding updated");
              }}
            />
          ) : (
            <FindingCard
              key={f.id}
              finding={f}
              readOnly={reviewed}
              onEdit={() => setEditingId(f.id)}
              onRemove={() => {
                removeFinding(projectId, current.id, f.id);
                toast.success("Finding removed");
              }}
            />
          ),
        )}

        {adding && !reviewed && (
          <FindingForm
            systemOptions={systemOptions}
            onCancel={() => setAdding(false)}
            onSubmit={(payload) => {
              addFinding(projectId, current.id, payload);
              setAdding(false);
              toast.success("Finding added");
            }}
          />
        )}

        {!adding && !reviewed && (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--ink-300)] bg-transparent px-3 py-2 text-[12px] font-semibold text-[var(--ink-700)] hover:border-[var(--accent-500)]/50 hover:bg-[var(--accent-500)]/5 hover:text-[var(--accent-500)]"
          >
            <Plus className="h-3.5 w-3.5" /> Add finding
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--ink-200)] bg-[var(--ink-50)]/50 px-4 py-3">
        {reviewed ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => reopenReview(projectId, current.id)}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen review
          </Button>
        ) : (
          <div className="space-y-2">
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleNoImpact}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Mark reviewed — no impact
              </Button>
              <p className="mt-1 text-[10.5px] text-[var(--ink-500)]">
                Records that this revision was assessed and has no commercial effect.
              </p>
            </div>
            <div>
              <Button
                size="sm"
                className="w-full"
                disabled={findings.length === 0}
                onClick={handleSaveAndOpenVariation}
              >
                Save &amp; open variation ({findings.length})
              </Button>
              <p className="mt-1 text-[10.5px] text-[var(--ink-500)]">
                Findings become pre-filled variation lines.
              </p>
            </div>
            <p className="pt-1 text-center text-[10px] text-[var(--ink-500)]">
              Either action marks {current.revisionCode} as commercially reviewed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function findingSummary(f: QsFinding): string {
  const parts: string[] = [];
  const meta = findingTypeMeta(f.type);
  if (f.type === "substituted") {
    parts.push(`${meta.label}: ${f.systemFrom ?? "?"} → ${f.systemTo ?? "?"}`);
  } else {
    parts.push(`${meta.label}: ${f.system ?? "—"}`);
  }
  if (f.location) parts.push(f.location);
  if (f.qty)      parts.push(f.qty);
  if (f.note)     parts.push(f.note);
  return parts.join(" · ");
}

function FindingCard({
  finding, readOnly, onEdit, onRemove,
}: {
  finding: QsFinding;
  readOnly: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const meta = findingTypeMeta(finding.type);
  return (
    <div className="group rounded-md border border-[var(--ink-200)] bg-card p-2.5 hover:border-[var(--ink-300)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              typeChipCls(finding.type),
            )}>
              {meta.label}
            </span>
            <p className="text-[12.5px] font-semibold text-[var(--ink-900)]">
              {finding.type === "substituted" ? (
                <span className="inline-flex items-center gap-1">
                  {finding.systemFrom ?? "?"}
                  <ArrowRight className="h-3 w-3 text-[var(--ink-500)]" />
                  {finding.systemTo ?? "?"}
                </span>
              ) : (finding.system ?? "—")}
            </p>
          </div>
          {finding.location && (
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">{finding.location}</p>
          )}
          {finding.qty && (
            <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">{finding.qty}</p>
          )}
          {finding.note && (
            <p className="mt-1 text-[11px] text-[var(--ink-700)]">{finding.note}</p>
          )}
        </div>
        {!readOnly && (
          <div className="flex opacity-0 transition group-hover:opacity-100">
            <button
              onClick={onEdit}
              className="rounded p-1 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
              aria-label="Edit"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onRemove}
              className="rounded p-1 text-[var(--ink-500)] hover:bg-[var(--red-500)]/10 hover:text-[var(--red-500)]"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingForm({
  systemOptions, initial, onSubmit, onCancel,
}: {
  systemOptions: string[];
  initial?: QsFinding;
  onSubmit: (payload: Omit<QsFinding, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [type, setType]         = useState<FindingType>(initial?.type ?? "substituted");
  const [system, setSystem]     = useState(initial?.system ?? "");
  const [systemFrom, setFrom]   = useState(initial?.systemFrom ?? "");
  const [systemTo, setTo]       = useState(initial?.systemTo ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [qty, setQty]           = useState(initial?.qty ?? "");
  const [note, setNote]         = useState(initial?.note ?? "");

  const isSub = type === "substituted";
  const canSave = isSub
    ? systemFrom.trim().length > 0 && systemTo.trim().length > 0
    : system.trim().length > 0 || (type === "note" && note.trim().length > 0);
  const isKnown = (v: string) => systemOptions.includes(v.trim());

  function submit() {
    onSubmit({
      type,
      system:     isSub ? undefined : system.trim() || undefined,
      systemFrom: isSub ? systemFrom.trim() : undefined,
      systemTo:   isSub ? systemTo.trim()   : undefined,
      location:   location.trim() || undefined,
      qty:        qty.trim() || undefined,
      note:       note.trim() || undefined,
    });
  }

  return (
    <div className="space-y-2.5 rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/[0.03] p-3">
      {/* Segmented type control */}
      <div className="flex flex-wrap gap-1">
        {FINDING_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "rounded border px-2 py-1 text-[10.5px] font-semibold transition",
              type === t.value
                ? typeChipCls(t.value)
                : "border-[var(--ink-200)] bg-transparent text-[var(--ink-500)] hover:bg-[var(--ink-50)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* System pickers */}
      {isSub ? (
        <div className="grid grid-cols-2 gap-2">
          <SystemPicker label="From" value={systemFrom} onChange={setFrom} options={systemOptions} allowFree />
          <SystemPicker label="To"   value={systemTo}   onChange={setTo}   options={systemOptions} allowFree />
        </div>
      ) : (
        <SystemPicker
          label="System"
          value={system}
          onChange={setSystem}
          options={systemOptions}
          allowFree={type === "added" || type === "note"}
          hint={type === "added" && system && !isKnown(system) ? "Not in project yet — will be flagged" : undefined}
        />
      )}

      <LabeledInput label="Location / zone" value={location} onChange={setLocation} placeholder="e.g. Level 4 · Cinema" />

      <div>
        <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Estimated quantity
        </label>
        <div className="relative">
          <Input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="e.g. ~45"
            className="h-8 pr-10 text-[12px]"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--ink-500)]">m²</span>
        </div>
        <p className="mt-0.5 text-[10.5px] text-[var(--ink-500)]">Your estimate — nothing is auto-measured.</p>
      </div>

      <div>
        <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Note</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-[12px]" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={!canSave}>
          {initial ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  );
}

function LabeledInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-[12px]"
      />
    </div>
  );
}

function SystemPicker({
  label, value, onChange, options, allowFree, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allowFree?: boolean;
  hint?: string;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = q
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : options.slice(0, 6);
  return (
    <div className="relative">
      <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</label>
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={allowFree ? "Type or pick…" : "Pick a system"}
        className="h-8 text-[12px]"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-[var(--ink-200)] bg-card shadow-lg">
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setQ(o); onChange(o); setOpen(false); }}
                className="block w-full truncate px-2 py-1.5 text-left text-[12px] hover:bg-[var(--ink-50)]"
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hint && <p className="mt-0.5 text-[10.5px] text-[var(--amber-500)]">{hint}</p>}
    </div>
  );
}