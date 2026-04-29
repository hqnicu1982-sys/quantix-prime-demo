import { createFileRoute } from "@tanstack/react-router";
import { Section, Kpi } from "@/components/Primitives";
import { ProjectBanner } from "@/components/ProjectBanner";
import { useProject } from "@/lib/ProjectContext";
import { useProjectVariations, summarize } from "@/lib/variations";
import { NewVariationDialog } from "@/components/variations/NewVariationDialog";
import { VariationsTable } from "@/components/variations/VariationsTable";
import { CostBreakdownPanel } from "@/components/variations/CostBreakdownPanel";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/variations")({ component: GuardedVariationsPage });

function GuardedVariationsPage() {
  const allowed = useCan("view.variations");
  if (!allowed) return <NoAccess cap="view.variations" title="Variations restricted" />;
  return <VariationsPage />;
}

const fmtMoney = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

function VariationsPage() {
  const { current } = useProject();
  const variations = useProjectVariations(current.id);
  const s = summarize(variations);
  const net = current.contractValue + s.approvedValue;
  const upliftPct = current.contractValue > 0 ? (s.approvedValue / current.contractValue) * 100 : 0;

  return (
    <Section
      title="Variations"
      subtitle="Track client/contractor changes against the baseline scope. Protect margin with full audit trail."
      right={<NewVariationDialog />}
    >
      <ProjectBanner scope="Variations" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Approved"
          value={fmtMoney(s.approvedValue)}
          delta={`${s.count.approved} VO${s.count.approved === 1 ? "" : "s"}`}
          tone="success"
        />
        <Kpi
          label="Pending (draft + submitted)"
          value={fmtMoney(s.pendingValue)}
          delta={`${s.count.draft + s.count.submitted} awaiting`}
          tone="warning"
        />
        <Kpi
          label="Net contract"
          value={fmtMoney(net)}
          delta={`Baseline ${fmtMoney(current.contractValue)}`}
          tone="info"
        />
        <Kpi
          label="Uplift vs contract"
          value={`${upliftPct >= 0 ? "+" : ""}${upliftPct.toFixed(1)}%`}
          delta={`+${s.approvedDays}d schedule`}
          tone={upliftPct >= 0 ? "success" : "danger"}
          trend={upliftPct >= 0 ? "up" : "down"}
        />
      </div>

      <VariationsTable projectId={current.id} variations={variations} />

      <CostBreakdownPanel variations={variations} baseline={current.contractValue} />
    </Section>
  );
}