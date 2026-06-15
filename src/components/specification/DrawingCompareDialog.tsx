import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { isPreviewable, type DrawingRevision } from "@/lib/drawingRegistry";

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
      {rev.changeNotes && (
        <div className="border-t border-[var(--ink-200)] bg-card px-3 py-2 text-[11px]">
          <span className="font-semibold text-[var(--ink-700)]">Notes:</span> <span className="text-[var(--ink-500)]">{rev.changeNotes}</span>
        </div>
      )}
    </div>
  );
}

export function DrawingCompareDialog({
  open, onOpenChange, tender, current,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tender?: DrawingRevision;
  current?: DrawingRevision;
}) {
  const [showAreas, setShowAreas] = useState(true);
  const areas = current?.affectedAreas ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="border-b border-[var(--ink-200)] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[14px]">
              Compare with tender · {tender?.drawingNumber ?? current?.drawingNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {areas.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowAreas((v) => !v)}>
                  {showAreas ? "Hide" : "Show"} affected areas
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
          {showAreas && areas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {areas.map((a) => (
                <span key={a} className="rounded bg-[var(--amber-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">
                  {a}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>
        <div className="grid flex-1 min-h-0 grid-cols-2 gap-3 p-3">
          <Pane label="Tender baseline" badge="Tender" rev={tender} />
          <Pane label="Selected revision" badge={current?.isTender ? "Tender" : "Revision"} rev={current} />
        </div>
      </DialogContent>
    </Dialog>
  );
}