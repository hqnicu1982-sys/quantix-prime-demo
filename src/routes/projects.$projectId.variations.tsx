import { createFileRoute } from "@tanstack/react-router";
import { Kpi } from "@/components/Primitives";
import { useProjectVariations, summarize } from "@/lib/variations";
import { NewVariationDialog } from "@/components/variations/NewVariationDialog";
import { VariationsTable } from "@/components/variations/VariationsTable";
import { CostBreakdownPanel } from "@/components/variations/CostBreakdownPanel";
import { useProject } from "@/lib/ProjectContext";

export const Route = createFileRoute("/projects/$projectId/variations")({
  component: ProjectVariations,
});

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

  return (
    <div className="space-y-5 pt-5">
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