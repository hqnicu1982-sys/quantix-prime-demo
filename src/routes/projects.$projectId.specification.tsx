import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHead, Kpi } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, AlertTriangle, Layers, Paperclip, Upload, Trash2 } from "lucide-react";
import { fitzroviaSystems, fmtMoney } from "@/lib/mockData";
import { useCan } from "@/lib/permissions";
import { SystemDetailsDialog } from "@/components/specification/SystemDetailsDialog";
import { useAllSystemDetails } from "@/lib/systemDetails";
import { UploadSpecDocDialog } from "@/components/specification/UploadSpecDocDialog";
import { useProjectDocs, removeProjectDoc, formatBytes, tagTone } from "@/lib/projectDocuments";
import { DrawingRevisionsCard } from "@/components/specification/DrawingRevisionsCard";
import { DrawingAuditLog } from "@/components/specification/DrawingAuditLog";
import { useDrawings, groupByDrawing } from "@/lib/drawingRegistry";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId/specification")({ component: SpecificationPage });

const requirements = [
  { area: "Bedrooms (L4–L6, 248 rooms)", spec: "GypWall CLASSIC C-48/70 · 60 min fire · 43 Rw dB", status: "approved" as const },
  { area: "Corridors (L4–L6)", spec: "GypWall ROBUST · impact SD2 · 60 min fire", status: "approved" as const },
  { area: "Lift & service shafts", spec: "Knauf ShaftWall S-CW · 120 min fire · 52 Rw dB", status: "review" as const },
  { area: "Ceilings (all guest areas)", spec: "CasoLine MF · 30 min · 37 Rw dB", status: "approved" as const },
  { area: "Plant room partitions", spec: "GypWall QUIET 92/146 · 63 Rw dB", status: "approved" as const },
];

function SpecificationPage() {
  const { projectId } = Route.useParams();
  const canSeeMoney = useCan("view.financials.lite");
  const canEdit = useCan("edit.specification");
  const allDetails = useAllSystemDetails(projectId);
  const docs = useProjectDocs(projectId);
  const drawings = useDrawings(projectId);
  const drawingGroups = groupByDrawing(drawings);
  const pendingDrawings = drawings.revisions.filter((r) => r.status === "pending").length;
  const affectingDrawings = drawings.revisions.filter(
    (r) => r.status === "pending" && ((r.affectedBoqLineIds?.length ?? 0) > 0 || (r.affectedSystemIds?.length ?? 0) > 0),
  ).length;
  const [selected, setSelected] = useState<typeof fitzroviaSystems[number] | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Spec documents" value={`${docs.length}`} delta={`${docs.filter(d => !d.seed).length} uploaded by team`} tone="info" />
        <Kpi
          label="Drawings"
          value={`${drawingGroups.length}`}
          delta={
            drawings.tenderLocked
              ? pendingDrawings > 0
                ? `${pendingDrawings} pending${affectingDrawings > 0 ? ` · ${affectingDrawings} affect BoQ` : ""}`
                : "Tender baseline locked"
              : "Tender not issued yet"
          }
          tone={pendingDrawings > 0 ? "warning" : drawings.tenderLocked ? "success" : "info"}
        />
        <Kpi label="Systems specified" value={`${fitzroviaSystems.length}`} delta="2 awaiting BG approval" tone="warning" />
        <Kpi label="Spec coverage" value="92%" delta="8% pending shaft details" tone="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DrawingRevisionsCard projectId={projectId} />

          <DrawingAuditLog projectId={projectId} />

          <Card>
            <CardHead
              title="Specification documents"
              subtitle="Drawings, NBS specs, performance schedules"
              right={
                <div className="flex gap-2">
                  {canEdit && (
                    <Button size="sm" onClick={() => setUploadOpen(true)}>
                      <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
                    </Button>
                  )}
                  <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Export pack</Button>
                </div>
              }
            />
            <div className="divide-y divide-[var(--ink-200)]">
              {docs.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                  <FileText className="h-6 w-6 text-[var(--ink-500)]" />
                  <p className="text-[13px] font-semibold">No documents yet</p>
                  <p className="text-[11.5px] text-[var(--ink-500)]">
                    {canEdit ? "Upload drawings, specs and reports to share with the team." : "No specification documents have been uploaded yet."}
                  </p>
                </div>
              )}
              {docs.map((d) => {
                const tone = tagTone(d.tag);
                const toneClass =
                  tone === "danger"  ? "bg-[var(--red-500)]/10 text-[var(--red-500)]"
                  : tone === "info"  ? "bg-[var(--accent-500)]/10 text-[var(--accent-500)]"
                  : tone === "success" ? "bg-[var(--green-600)]/10 text-[var(--green-600)]"
                  : tone === "warning" ? "bg-[var(--amber-500)]/10 text-[var(--amber-500)]"
                  : "bg-[var(--ink-50)] text-[var(--ink-500)]";
                const date = new Date(d.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--ink-50)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ink-50)]">
                      <FileText className="h-4 w-4 text-[var(--ink-500)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{d.fileName}</p>
                      <p className="text-[11px] text-[var(--ink-500)]">
                        {formatBytes(d.fileSize)} · uploaded {date} · {d.uploadedBy}
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${toneClass}`}>{d.tag}</span>
                    {d.dataUrl ? (
                      <a
                        href={d.dataUrl}
                        download={d.fileName}
                        className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
                        aria-label="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="rounded px-1.5 py-0.5 text-[10px] text-[var(--ink-500)]" title="Sample document — re-upload to enable download">sample</span>
                    )}
                    {canEdit && !d.seed && (
                      <button
                        onClick={() => {
                          if (!confirm(`Delete "${d.fileName}"?`)) return;
                          removeProjectDoc(projectId, d.id);
                          toast.success("Document removed");
                        }}
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
          </Card>

          <Card>
            <CardHead title="Specified systems by area" subtitle="Mapped from architect drawings & NBS spec" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Area</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Specified system</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-200)]">
                  {requirements.map((r) => (
                    <tr key={r.area} className="hover:bg-[var(--ink-50)]">
                      <td className="px-4 py-3 font-semibold text-[var(--ink-900)]">{r.area}</td>
                      <td className="px-4 py-3 text-[var(--ink-700)]">{r.spec}</td>
                      <td className="px-4 py-3">
                        {r.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--green-600)]">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--amber-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">
                            <AlertTriangle className="h-3 w-3" /> In review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead title="Performance summary" />
            <div className="space-y-3 p-5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Max fire rating</span>
                <span className="font-semibold text-[var(--red-500)]">120 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Max acoustic</span>
                <span className="font-semibold">63 Rw dB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Tallest partition</span>
                <span className="font-semibold">8.1 m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Total wall area</span>
                <span className="font-semibold">3,590 m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-500)]">Total ceiling area</span>
                <span className="font-semibold">4,120 m²</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHead title="Specified systems" />
            <div className="space-y-3 p-5">
              {fitzroviaSystems.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSelected(s)}
                  className="flex w-full items-start gap-3 rounded-md p-1.5 -m-1.5 text-left transition hover:bg-[var(--ink-50)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/30"
                >
                  <Layers className="mt-0.5 h-4 w-4 text-[var(--accent-500)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-semibold">{s.name}</p>
                      {(allDetails[s.name]?.attachments.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-500)]">
                          <Paperclip className="h-2.5 w-2.5" />
                          {allDetails[s.name].attachments.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ink-500)]">
                      {s.area}
                      {canSeeMoney && <> · {fmtMoney(s.value, { compact: true })}</>}
                    </p>
                  </div>
                </button>
              ))}
              <p className="pt-1 text-[10.5px] text-[var(--ink-500)]">
                Tap a system to view details, attach datasheets or add site notes.
              </p>
            </div>
          </Card>
        </div>
      </div>
      {selected && (
        <SystemDetailsDialog
          projectId={projectId}
          systemKey={selected.name}
          systemMeta={{ area: selected.area, value: selected.value }}
          open={!!selected}
          onOpenChange={(o) => { if (!o) setSelected(null); }}
          canSeeMoney={canSeeMoney}
        />
      )}
      <UploadSpecDocDialog projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
