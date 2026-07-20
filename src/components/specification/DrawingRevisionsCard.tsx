import { useMemo, useState } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  Upload, Lock, ChevronDown, ChevronRight, Download, CheckCircle2, XCircle, Trash2,
  GitCompare, History, AlertTriangle, CircleDot, Unlock, FileDown, Files, RotateCcw, Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDrawings, groupByDrawing, statusTone, formatBytes, approveRevision,
  rejectRevision, removeRevision, withdrawRevision,
  DRAWING_DISCIPLINES, type DrawingDiscipline, type DrawingRevision,
} from "@/lib/drawingRegistry";
import { downloadDrawingRegisterCsv } from "@/lib/drawingExport";
import { useCan } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";
import { UploadDrawingRevisionDialog } from "./UploadDrawingRevisionDialog";
import { IssueTenderSetDialog } from "./IssueTenderSetDialog";
import { DrawingCompareDialog } from "./DrawingCompareDialog";
import { BulkUploadDrawingsDialog } from "./BulkUploadDrawingsDialog";
import { UnlockTenderDialog } from "./UnlockTenderDialog";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(rev: DrawingRevision) {
  const tone = statusTone(rev.status);
  const cls =
    tone === "success"  ? "bg-[var(--green-600)]/10 text-[var(--green-600)]" :
    tone === "warning"  ? "bg-[var(--amber-500)]/10 text-[var(--amber-500)]" :
    tone === "danger"   ? "bg-[var(--red-500)]/10 text-[var(--red-500)]" :
                          "bg-[var(--ink-50)] text-[var(--ink-500)]";
  const label =
    rev.status === "current"    ? (rev.isTender ? "Tender · Current" : "Current") :
    rev.status === "pending"    ? "Pending review" :
    rev.status === "rejected"   ? "Rejected" :
                                  (rev.isTender ? "Tender" : "Superseded");
  return <span className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${cls}`}>{label}</span>;
}

export function DrawingRevisionsCard({ projectId }: { projectId: string }) {
  const me = useCurrentUser();
  const canUpload  = useCan("upload.drawings");
  const canApprove = useCan("approve.drawings");
  const canLock    = useCan("lock.tender");
  const canUnlock  = useCan("unlock.tender");
  const canBulk    = useCan("bulk.upload.drawings");
  const canExport  = useCan("export.drawings.register");
  const canWithdrawOwn = useCan("withdraw.drawings.own");
  const state = useDrawings(projectId);
  const groups = useMemo(() => groupByDrawing(state), [state]);

  const [uploadOpen, setUploadOpen]   = useState(false);
  const [issueOpen,  setIssueOpen]    = useState(false);
  const [bulkOpen,   setBulkOpen]     = useState(false);
  const [unlockOpen, setUnlockOpen]   = useState(false);
  const [expanded,   setExpanded]     = useState<Record<string, boolean>>({});
  const [compareFor, setCompareFor]   = useState<{ tender?: DrawingRevision; current?: DrawingRevision } | null>(null);
  const [filterPending, setFilterPending] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState<DrawingDiscipline | "All">("All");
  const isOperative = me.tier === "Operative";
  const [latestOnly, setLatestOnly] = useState(isOperative);

  const pendingCount = state.revisions.filter((r) => r.status === "pending").length;
  const displayed = groups
    .filter((g) => (filterPending ? g.pendingCount > 0 : true))
    .filter((g) => (disciplineFilter === "All" ? true : g.discipline === disciplineFilter));

  function handleApprove(rev: DrawingRevision) {
    approveRevision(projectId, rev.id, me.name);
    toast.success(`${rev.drawingNumber} · ${rev.revisionCode} approved — now current`);
  }
  function handleReject(rev: DrawingRevision) {
    const reason = window.prompt(`Reject ${rev.drawingNumber} · ${rev.revisionCode}\n\nReason:`);
    if (!reason) return;
    rejectRevision(projectId, rev.id, me.name, reason);
    toast.success("Revision rejected");
  }
  function handleWithdraw(rev: DrawingRevision) {
    if (!confirm(`Withdraw ${rev.drawingNumber} · ${rev.revisionCode}?`)) return;
    const r = withdrawRevision(projectId, rev.id, me.name);
    if (!r.ok) toast.error(r.error === "not-owner" ? "Only the original uploader can withdraw" : "Cannot withdraw this revision");
    else toast.success("Revision withdrawn");
  }
  function handleDelete(rev: DrawingRevision) {
    if (!confirm(`Delete revision ${rev.drawingNumber} · ${rev.revisionCode}?`)) return;
    const r = removeRevision(projectId, rev.id);
    if (!r.ok) toast.error("Tender revisions are locked and cannot be deleted");
    else toast.success("Revision removed");
  }
  function handleSupersededDownload(rev: DrawingRevision, currentCode?: string, e?: React.MouseEvent) {
    const ok = confirm(
      `You're downloading a superseded revision.\n\n${rev.drawingNumber} · ${rev.revisionCode}\nCurrent is ${currentCode ?? "—"}\n\nContinue?`,
    );
    if (!ok) { e?.preventDefault(); return; }
  }
  function handleExport() {
    downloadDrawingRegisterCsv(projectId, projectId);
    toast.success("Register exported");
  }

  return (
    <Card>
      <div id="drawing-revisions" />
      <CardHead
        title="Drawing revisions"
        subtitle={
          state.tenderLocked && state.tenderIssuedAt
            ? `Tender set issued ${fmtDate(state.tenderIssuedAt)}${state.tenderIssuedBy ? ` by ${state.tenderIssuedBy}` : ""}`
            : "Upload tender drawings, then issue the set to freeze the baseline."
        }
        right={
          <div className="flex flex-wrap gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => setFilterPending((v) => !v)}
                className={`rounded px-2 py-1 text-[11px] font-semibold ${filterPending ? "bg-[var(--amber-500)] text-white" : "bg-[var(--amber-500)]/10 text-[var(--amber-500)]"}`}
              >
                {pendingCount} pending review
              </button>
            )}
            {canExport && state.revisions.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleExport} title="Export register CSV">
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            )}
            {canLock && !state.tenderLocked && (
              <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}>
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Issue tender set
              </Button>
            )}
            {canBulk && (
              <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                <Files className="mr-1.5 h-3.5 w-3.5" /> Bulk upload
              </Button>
            )}
            {canUpload && (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {state.tenderLocked ? "Upload revision" : "Upload drawing"}
              </Button>
            )}
          </div>
        }
      />

      {state.tenderLocked && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink-200)] bg-[var(--green-600)]/5 px-5 py-2">
          <CircleDot className="h-3.5 w-3.5 text-[var(--green-600)]" />
          <p className="flex-1 text-[11.5px] text-[var(--ink-700)]">
            <span className="font-semibold">Tender baseline frozen.</span>
            {" "}Use <em>Compare</em> on a new revision to check what changed vs the priced tender drawings.
          </p>
          {canUnlock && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setUnlockOpen(true)}>
              <Unlock className="mr-1 h-3 w-3" /> Unlock
            </Button>
          )}
        </div>
      )}

      {(state.tenderUnlockHistory?.length ?? 0) > 0 && !state.tenderLocked && (
        <div className="flex items-center gap-2 border-b border-[var(--ink-200)] bg-[var(--amber-500)]/10 px-5 py-2 text-[11.5px] text-[var(--ink-700)]">
          <Unlock className="h-3.5 w-3.5 text-[var(--amber-500)]" />
          <span><span className="font-semibold">Tender unlocked</span> {fmtDate(state.tenderUnlockHistory![0].at)} by {state.tenderUnlockHistory![0].by} · {state.tenderUnlockHistory![0].reason}</span>
        </div>
      )}

      {state.revisions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink-200)] px-5 py-2">
          <Filter className="h-3 w-3 text-[var(--ink-500)]" />
          {(["All", ...DRAWING_DISCIPLINES] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDisciplineFilter(d)}
              className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                disciplineFilter === d
                  ? "bg-[var(--ink-900)] text-white"
                  : "bg-[var(--ink-50)] text-[var(--ink-500)] hover:bg-[var(--ink-100)]"
              }`}
            >
              {d}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--ink-500)] cursor-pointer">
            <input type="checkbox" checked={latestOnly} onChange={(e) => setLatestOnly(e.target.checked)} />
            Latest only
          </label>
        </div>
      )}

      <div className="divide-y divide-[var(--ink-200)]">
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <History className="h-6 w-6 text-[var(--ink-500)]" />
            <p className="text-[13px] font-semibold">No drawings yet</p>
            <p className="text-[11.5px] text-[var(--ink-500)] max-w-sm">
              {canUpload
                ? "Upload tender drawings (T1 / T2…), issue the set to lock the baseline, then keep adding revisions over time."
                : "Tender drawings will appear here once uploaded by the project team."}
            </p>
          </div>
        )}

        {displayed.map((g) => {
          const isOpen = !latestOnly && (expanded[g.drawingNumber] ?? false);
          const hideExpander = latestOnly;
          return (
            <div key={g.drawingNumber}>
              <button
                onClick={() => setExpanded((m) => ({ ...m, [g.drawingNumber]: !isOpen }))}
                disabled={hideExpander}
                className="flex w-full items-center gap-3 px-5 py-3 hover:bg-[var(--ink-50)] text-left"
              >
                {hideExpander
                  ? <span className="h-3.5 w-3.5" />
                  : (isOpen ? <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-500)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--ink-500)]" />)
                }
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--ink-900)]">{g.drawingNumber}</p>
                    {g.title && <p className="truncate text-[12px] text-[var(--ink-700)]">· {g.title}</p>}
                    <span className="rounded bg-[var(--ink-50)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-500)]">{g.discipline}</span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-500)]">
                    Current: <span className="font-semibold text-[var(--ink-700)]">{g.current?.revisionCode ?? "—"}</span>
                    {" · "}Tender: <span className="font-semibold text-[var(--ink-700)]">{g.tender?.revisionCode ?? "—"}</span>
                    {" · "}{g.history.length} revision{g.history.length === 1 ? "" : "s"}
                  </p>
                </div>
                {g.pendingCount > 0 && (
                  <span className="rounded bg-[var(--amber-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--amber-500)]">
                    {g.pendingCount} pending
                  </span>
                )}
                {g.tender && g.current && g.current.id !== g.tender.id && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setCompareFor({ tender: g.tender, current: g.current }); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setCompareFor({ tender: g.tender, current: g.current }); } }}
                    className="inline-flex items-center gap-1 rounded border border-[var(--ink-200)] px-2 py-1 text-[11px] font-semibold hover:bg-[var(--ink-50)]"
                  >
                    <GitCompare className="h-3 w-3" /> Compare
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t border-[var(--ink-200)] bg-[var(--ink-50)]/30 px-5 py-3">
                  <ol className="space-y-2">
                    {g.history.map((rev) => (
                      <li key={rev.id} className={`rounded-md border bg-card p-3 ${rev.status === "superseded" ? "border-[var(--red-500)]/30" : "border-[var(--ink-200)]"}`}>
                        {rev.status === "superseded" && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded bg-[var(--red-500)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--red-500)]">
                            <AlertTriangle className="h-3 w-3" /> Superseded — current is {g.current?.revisionCode ?? "—"}
                          </div>
                        )}
                        {rev.status === "withdrawn" && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded bg-[var(--ink-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                            <RotateCcw className="h-3 w-3" /> Withdrawn by uploader
                          </div>
                        )}
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[12.5px] font-semibold">{rev.revisionCode}</p>
                              {statusBadge(rev)}
                              {rev.isTender && rev.status !== "current" && (
                                <span className="rounded bg-[var(--accent-500)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--accent-500)]">Tender baseline</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">
                              {fmtDate(rev.uploadedAt)} · {rev.uploadedBy} · {rev.fileName} ({formatBytes(rev.fileSize)})
                            </p>
                            {rev.changeNotes && (
                              <p className="mt-1 text-[11.5px] text-[var(--ink-700)]">
                                <span className="font-semibold">Notes:</span> {rev.changeNotes}
                              </p>
                            )}
                            {rev.affectedAreas && rev.affectedAreas.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {rev.affectedAreas.map((a) => (
                                  <span key={a} className="rounded bg-[var(--amber-500)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--amber-500)]">{a}</span>
                                ))}
                              </div>
                            )}
                            {rev.status === "rejected" && rev.rejectedReason && (
                              <p className="mt-1 text-[11px] text-[var(--red-500)]">
                                <AlertTriangle className="mr-1 inline h-3 w-3" />
                                Rejected by {rev.rejectedBy}: {rev.rejectedReason}
                              </p>
                            )}
                            {rev.approvedBy && rev.status === "current" && !rev.isTender && (
                              <p className="mt-1 text-[11px] text-[var(--green-600)]">
                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                Approved by {rev.approvedBy}{rev.approvedAt ? ` · ${fmtDate(rev.approvedAt)}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {rev.dataUrl ? (
                              <a
                                href={rev.dataUrl}
                                download={rev.fileName}
                                onClick={(e) => rev.status === "superseded" && handleSupersededDownload(rev, g.current?.revisionCode, e)}
                                className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Download">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="rounded px-1.5 py-0.5 text-[10px] text-[var(--ink-500)]" title="Sample">sample</span>
                            )}
                            {g.tender && g.tender.id !== rev.id && (
                              <button
                                onClick={() => setCompareFor({ tender: g.tender, current: rev })}
                                className="rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" title="Compare with tender">
                                <GitCompare className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canApprove && rev.status === "pending" && (
                              <>
                                <button onClick={() => handleApprove(rev)}
                                        className="inline-flex items-center gap-1 rounded bg-[var(--green-600)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--green-600)] hover:bg-[var(--green-600)]/20">
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </button>
                                <button onClick={() => handleReject(rev)}
                                        className="inline-flex items-center gap-1 rounded bg-[var(--red-500)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--red-500)] hover:bg-[var(--red-500)]/20">
                                  <XCircle className="h-3 w-3" /> Reject
                                </button>
                              </>
                            )}
                            {canWithdrawOwn && rev.status === "pending" && rev.uploadedBy === me.name && (
                              <button onClick={() => handleWithdraw(rev)}
                                      className="inline-flex items-center gap-1 rounded bg-[var(--ink-50)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-700)] hover:bg-[var(--ink-100)]">
                                <RotateCcw className="h-3 w-3" /> Withdraw
                              </button>
                            )}
                            {canUpload && !(state.tenderLocked && rev.isTender) && !rev.seed && (
                              <button onClick={() => handleDelete(rev)}
                                      className="rounded p-1.5 text-[var(--red-500)] hover:bg-[var(--red-500)]/10" aria-label="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <UploadDrawingRevisionDialog projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
      <IssueTenderSetDialog       projectId={projectId} open={issueOpen}  onOpenChange={setIssueOpen} />
      <BulkUploadDrawingsDialog   projectId={projectId} open={bulkOpen}   onOpenChange={setBulkOpen} />
      <UnlockTenderDialog         projectId={projectId} open={unlockOpen} onOpenChange={setUnlockOpen} />
      <DrawingCompareDialog
        open={!!compareFor}
        onOpenChange={(v) => { if (!v) setCompareFor(null); }}
        tender={compareFor?.tender}
        current={compareFor?.current}
        projectId={projectId}
      />
    </Card>
  );
}