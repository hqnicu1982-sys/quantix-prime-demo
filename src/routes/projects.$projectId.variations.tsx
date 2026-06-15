import { createFileRoute } from "@tanstack/react-router";
import { Kpi } from "@/components/Primitives";
import { useProjectVariations, summarize } from "@/lib/variations";
import { NewVariationDialog } from "@/components/variations/NewVariationDialog";
import { VariationsTable } from "@/components/variations/VariationsTable";
import { CostBreakdownPanel } from "@/components/variations/CostBreakdownPanel";
import { useProject } from "@/lib/ProjectContext";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { useDrawings } from "@/lib/drawingRegistry";
import { Link } from "@tanstack/react-router";
import { GitCompare } from "lucide-react";

export const Route = createFileRoute("/projects/$projectId/variations")({
  component: GuardedProjectVariations,
});

function GuardedProjectVariations() {
  const allowed = useCan("view.variations");
  if (!allowed) return <NoAccess cap="view.variations" title="Variations restricted" />;
  return <ProjectVariations />;
}

const fmtMoney = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

function ProjectVariations() {
  const { projectId } = Route.useParams();
  const variations = useProjectVariations(projectId);
  const s = summarize(variations);
  // baseline contract: read from current project
  const baseline = useBaseline(projectId);
  const net = baseline + s.approvedValue;
  const upliftPct = baseline > 0 ? (s.approvedValue / baseline) * 100 : 0;
  const drawings = useDrawings(projectId);
  const pendingDrawings = drawings.revisions.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5 pt-5">
      {pendingDrawings > 0 && (
        <Link
          to="/projects/$projectId/specification"
          params={{ projectId }}
          className="flex items-center gap-2 rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/10 px-4 py-2.5 text-[12px] text-[var(--ink-700)] hover:bg-[var(--amber-500)]/15"
        >
          <GitCompare className="h-4 w-4 shrink-0 text-[var(--amber-500)]" />
          <span>
            <span className="font-semibold">{pendingDrawings} drawing revision{pendingDrawings === 1 ? "" : "s"} pending review</span>
            {" "}— may affect tender pricing. Compare with tender baseline in Specification.
          </span>
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight">Variations register</h2>
          <p className="mt-0.5 text-[13px] text-[var(--ink-500)]">
            Client & contractor changes against the £{(baseline / 1_000_000).toFixed(2)}m baseline contract.
          </p>
        </div>
        <NewVariationDialog projectId={projectId} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Approved"
          value={fmtMoney(s.approvedValue)}
          delta={`${s.count.approved} VO${s.count.approved === 1 ? "" : "s"}`}
          tone="success"
        />
        <Kpi
          label="Pending"
          value={fmtMoney(s.pendingValue)}
          delta={`${s.count.draft + s.count.submitted} awaiting`}
          tone="warning"
        />
        <Kpi
          label="Net contract"
          value={fmtMoney(net)}
          delta={`Baseline ${fmtMoney(baseline)}`}
          tone="info"
        />
        <Kpi
          label="Uplift vs baseline"
          value={`${upliftPct >= 0 ? "+" : ""}${upliftPct.toFixed(2)}%`}
          delta={`${s.approvedDays >= 0 ? "+" : ""}${s.approvedDays}d schedule`}
          tone={upliftPct >= 0 ? "success" : "danger"}
          trend={upliftPct >= 0 ? "up" : "down"}
        />
      </div>

      <VariationsTable projectId={projectId} variations={variations} />

      <CostBreakdownPanel variations={variations} baseline={baseline} />
    </div>
  );
}

function useBaseline(projectId: string): number {
  const { all } = useProject();
  const p = all.find((x) => x.id === projectId);
  return p?.contractValue ?? 0;
}