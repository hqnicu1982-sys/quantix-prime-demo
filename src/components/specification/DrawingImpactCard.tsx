import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { GitCompare, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardHead } from "@/components/Primitives";
import { useDrawings } from "@/lib/drawingRegistry";
import { useProjectData } from "@/lib/projectData";
import { useAwardBaseline } from "@/lib/awardBaseline";

const fmtMoney = (n: number) =>
  `£${Math.round(n).toLocaleString("en-GB")}`;

/**
 * Surfaces pending revisions that are linked to systems / BoQ lines, with an
 * exposure £ figure derived from the affected BoQ rows. Used in Variations &
 * Costed BoQ to warn that tender pricing may be outdated.
 */
export function DrawingImpactCard({
  projectId,
  mode = "variations",
}: {
  projectId: string;
  mode?: "variations" | "boq";
}) {
  const state = useDrawings(projectId);
  const data = useProjectData(projectId);
  const baseline = useAwardBaseline(projectId);
  // A drawing is "in the contract set (C0)" if any of its revisions were part
  // of the frozen tender baseline. A pending revision against such a drawing
  // is a post-award change and must be flagged as Superseded-vs-C0.
  const contractDrawingNumbers = useMemo(() => {
    if (!baseline) return new Set<string>();
    const ids = new Set(baseline.drawingRevisionIds);
    const numbers = new Set<string>();
    for (const r of state.revisions) if (ids.has(r.id)) numbers.add(r.drawingNumber);
    return numbers;
  }, [baseline, state.revisions]);

  const rows = useMemo(() => {
    return state.revisions
      .filter((r) => r.status === "pending")
      .filter((r) => (r.affectedSystemIds?.length ?? 0) > 0 || (r.affectedBoqLineIds?.length ?? 0) > 0)
      .map((r) => {
        const systems = (r.affectedSystemIds ?? [])
          .map((id) => data.systems.find((s) => s.id === id))
          .filter(Boolean) as { id: string; systemName: string }[];
        const lineIds = new Set<string>(r.affectedBoqLineIds ?? []);
        // Fold in lines from selected systems so exposure isn't undercounted.
        for (const s of systems) {
          for (const l of data.boqLines.filter((bl) => bl.systemId === s.id)) {
            lineIds.add(l.id);
          }
        }
        const exposure = Array.from(lineIds).reduce((sum, lid) => {
          const l = data.boqLines.find((x) => x.id === lid);
          return sum + (l ? l.qty * (l.ratePerUnit ?? 0) : 0);
        }, 0);
        const postAward =
          !!baseline &&
          r.uploadedAt > baseline.frozenAt &&
          contractDrawingNumbers.has(r.drawingNumber);
        return {
          id: r.id,
          drawingNumber: r.drawingNumber,
          revisionCode: r.revisionCode,
          notes: r.changeNotes,
          systemLabel: systems.map((s) => s.systemName).join(" · ") || "Linked BoQ lines",
          lineCount: lineIds.size,
          exposure,
          postAward,
        };
      });
  }, [state.revisions, data.systems, data.boqLines, baseline, contractDrawingNumbers]);

  if (rows.length === 0) return null;

  const totalExposure = rows.reduce((s, r) => s + r.exposure, 0);
  const postAwardCount = rows.filter((r) => r.postAward).length;

  return (
    <Card className="border-[var(--amber-500)]/40 bg-[var(--amber-500)]/[0.04]">
      <CardHead
        title={`${rows.length} pending drawing revision${rows.length === 1 ? "" : "s"} affect priced scope`}
        subtitle={
          [
            totalExposure > 0
              ? `Estimated exposure ${fmtMoney(totalExposure)} across ${rows.reduce((s, r) => s + r.lineCount, 0)} BoQ line${rows.reduce((s, r) => s + r.lineCount, 0) === 1 ? "" : "s"}`
              : "Linked systems carry no priced lines yet — exposure unknown",
            postAwardCount > 0 ? `${postAwardCount} supersede the C0 contract set` : null,
          ].filter(Boolean).join(" · ")
        }
        right={
          <Link
            to="/projects/$projectId/specification"
            params={{ projectId }}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--amber-500)]/40 bg-[var(--amber-500)]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[var(--amber-500)] hover:bg-[var(--amber-500)]/20"
          >
            <GitCompare className="h-3.5 w-3.5" /> Review revisions
          </Link>
        }
      />
      <ul className="divide-y divide-[var(--ink-200)]">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--amber-500)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">
                {r.drawingNumber} · {r.revisionCode}
                {r.postAward && (
                  <span
                    className="ml-2 inline-flex items-center gap-1 rounded bg-[var(--red-500)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--red-500)]"
                    title="Uploaded after the tender was awarded — supersedes the C0 contract drawing"
                  >
                    <ShieldAlert className="h-3 w-3" /> Post-award vs C0
                  </span>
                )}
                <span className="ml-2 font-normal text-[var(--ink-500)]">→ {r.systemLabel}</span>
              </p>
              {r.notes && (
                <p className="truncate text-[11px] text-[var(--ink-500)]">{r.notes}</p>
              )}
            </div>
            <span className="rounded bg-[var(--amber-500)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--amber-500)]">
              {r.exposure > 0 ? `${fmtMoney(r.exposure)} exposure` : `${r.lineCount} line${r.lineCount === 1 ? "" : "s"}`}
            </span>
          </li>
        ))}
      </ul>
      {mode === "boq" && (
        <p className="border-t border-[var(--ink-200)] px-5 py-2 text-[11px] text-[var(--ink-500)]">
          Open the Specification tab to compare each revision against the priced tender drawing.
        </p>
      )}
    </Card>
  );
}