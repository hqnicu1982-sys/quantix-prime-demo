import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { Briefcase, Layers, ShoppingCart } from "lucide-react";

/**
 * Compact banner that shows which project the current view is scoped to.
 * Helps the user see context after switching projects via the header switcher.
 */
export function ProjectBanner({ scope }: { scope?: string }) {
  const { current } = useProject();
  const data = useProjectData(current.id);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/60 px-3 py-2 text-[12px]">
      <div className="flex items-center gap-2">
        <Briefcase className="h-3.5 w-3.5 text-[var(--accent-500)]" />
        <span className="font-semibold text-[var(--ink-900)]">{current.name}</span>
        <span className="text-[var(--ink-500)]">· {current.mainContractor}</span>
        {scope && <span className="text-[var(--ink-500)]">· {scope}</span>}
      </div>
      <div className="flex items-center gap-3 text-[11.5px] text-[var(--ink-500)]">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3 w-3" /> {data.systems.length} systems
        </span>
        <span className="inline-flex items-center gap-1">
          <ShoppingCart className="h-3 w-3" /> {Object.keys(data.supplierChoices).length} supplier picks
        </span>
      </div>
    </div>
  );
}