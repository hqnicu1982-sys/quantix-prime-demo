import { useState } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronRight, Upload, CheckCircle2, XCircle, Lock, Unlock,
  Trash2, RotateCcw, Layers,
} from "lucide-react";
import { useDrawingAudit, type DrawingAuditKind } from "@/lib/drawingRegistry";

const ICON: Record<DrawingAuditKind, typeof Upload> = {
  upload:        Upload,
  approve:       CheckCircle2,
  reject:        XCircle,
  withdraw:      RotateCcw,
  supersede:     Layers,
  "lock-tender": Lock,
  "unlock-tender": Unlock,
  delete:        Trash2,
  "bulk-upload": Upload,
};

const LABEL: Record<DrawingAuditKind, string> = {
  upload: "Uploaded",
  approve: "Approved",
  reject: "Rejected",
  withdraw: "Withdrawn",
  supersede: "Superseded",
  "lock-tender": "Tender locked",
  "unlock-tender": "Tender unlocked",
  delete: "Deleted",
  "bulk-upload": "Bulk upload",
};

function fmt(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function DrawingAuditLog({ projectId }: { projectId: string }) {
  const entries = useDrawingAudit(projectId);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? entries.filter((e) =>
        (e.drawingNumber ?? "").toUpperCase().includes(filter.toUpperCase()) ||
        (e.actor ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : entries;

  if (entries.length === 0) return null;

  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-[var(--ink-50)]"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-500)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--ink-500)]" />}
          <span className="text-[13px] font-semibold">Drawing audit log</span>
          <span className="rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ink-500)]">{entries.length}</span>
        </div>
        <span className="text-[11.5px] text-[var(--ink-500)]">Every change is recorded</span>
      </button>
      {open && (
        <div className="border-t border-[var(--ink-200)]">
          <div className="flex items-center gap-2 px-5 py-2 border-b border-[var(--ink-200)] bg-[var(--ink-50)]/40">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by drawing number or actor…"
              className="h-7 flex-1 rounded border border-[var(--ink-200)] bg-card px-2 text-[11.5px]"
            />
            {filter && (
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setFilter("")}>Clear</Button>
            )}
          </div>
          <ol className="max-h-72 overflow-y-auto divide-y divide-[var(--ink-200)] text-[12px]">
            {filtered.length === 0 && (
              <li className="px-5 py-3 text-[var(--ink-500)]">No matches.</li>
            )}
            {filtered.map((e) => {
              const Icon = ICON[e.kind];
              return (
                <li key={e.id} className="grid grid-cols-[28px_140px_120px_1fr] items-baseline gap-3 px-5 py-2">
                  <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                  <span className="text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">{fmt(e.ts)}</span>
                  <span className="font-semibold">
                    {LABEL[e.kind]}
                    {e.drawingNumber && <span className="ml-1 font-mono-num text-[11px] text-[var(--ink-700)]">{e.drawingNumber}{e.revisionCode ? `·${e.revisionCode}` : ""}</span>}
                  </span>
                  <span className="text-[var(--ink-700)]">
                    {e.actor}
                    {e.detail && <span className="ml-1 text-[var(--ink-500)]">— {e.detail}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}