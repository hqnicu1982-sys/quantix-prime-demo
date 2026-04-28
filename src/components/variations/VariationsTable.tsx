import { useState } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { VariationStatusBadge } from "./VariationStatusBadge";
import { VariationDetailDialog } from "./VariationDetailDialog";
import type { ProjectVariation, VariationStatus } from "@/lib/variations";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtMoney = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const raisedByLabel: Record<string, string> = {
  client: "Client",
  contractor: "Main contractor",
  designer: "Designer",
  site: "Site team",
};

const STATUS_FILTERS: { value: "all" | VariationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function VariationsTable({
  projectId,
  variations,
}: {
  projectId: string;
  variations: ProjectVariation[];
}) {
  const [filter, setFilter] = useState<"all" | VariationStatus>("all");
  const [selected, setSelected] = useState<ProjectVariation | null>(null);

  const filtered = filter === "all" ? variations : variations.filter((v) => v.status === filter);

  return (
    <Card>
      <CardHead
        title="Variations register"
        subtitle={`${variations.length} total · ${variations.filter((v) => v.status === "submitted").length} awaiting client`}
        right={
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => {
              const count = f.value === "all" ? variations.length : variations.filter((v) => v.status === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded px-2 py-1 text-[11.5px] font-medium transition-colors",
                    filter === f.value
                      ? "bg-[var(--ink-900)] text-white"
                      : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--ink-50)]",
                  )}
                >
                  {f.label} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        }
      />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <Inbox className="h-8 w-8 text-[var(--ink-200)]" />
          <p className="text-[13px] font-medium text-[var(--ink-700)]">No variations</p>
          <p className="text-[12px] text-[var(--ink-500)]">
            {filter === "all"
              ? "Click “New variation” to log a client/contractor change."
              : `No variations with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--ink-50)]/50 text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="px-4 py-2.5 text-left">VO</th>
                <th className="px-4 py-2.5 text-left">Title</th>
                <th className="px-4 py-2.5 text-left">Raised by</th>
                <th className="px-4 py-2.5 text-left">Date</th>
                <th className="px-4 py-2.5 text-right">Cost impact</th>
                <th className="px-4 py-2.5 text-right">Time</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className="cursor-pointer hover:bg-[var(--ink-50)]/40"
                >
                  <td className="px-4 py-3 font-mono text-[11.5px] font-semibold text-[var(--ink-700)]">{v.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--ink-900)]">{v.title}</p>
                    {v.changes.length > 0 && (
                      <p className="mt-0.5 truncate text-[11.5px] text-[var(--ink-500)]">
                        {v.changes.length} change{v.changes.length > 1 ? "s" : ""} · {v.changes[0].description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-700)]">{raisedByLabel[v.raisedBy] ?? v.raisedBy}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-500)] tabular-nums">{v.raisedDate}</td>
                  <td className={cn(
                    "px-4 py-3 text-right font-semibold tabular-nums",
                    v.costImpact < 0 ? "text-[var(--red-500)]" : "text-[var(--ink-900)]",
                  )}>
                    {fmtMoney(v.status === "approved" && v.approvedValue !== undefined ? v.approvedValue : v.costImpact)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] tabular-nums text-[var(--ink-700)]">
                    {v.timeImpactDays > 0 ? "+" : ""}{v.timeImpactDays}d
                  </td>
                  <td className="px-4 py-3"><VariationStatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-right"><ChevronRight className="inline h-4 w-4 text-[var(--ink-500)]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <VariationDetailDialog
        projectId={projectId}
        variation={selected}
        open={!!selected}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
      />
    </Card>
  );
}