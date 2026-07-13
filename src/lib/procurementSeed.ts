import { addCallOff, type ProjectBoqLine, type ProjectData } from "./projectData";

// ============================================================================
// Seed suggested (draft) call-offs from the frozen BoQ at award time.
// Groups lines by selected supplier so procurement has a starting stack.
// Lines with no supplier are collected under "Unassigned" so the QS still
// sees them on the Materials tab.
// ============================================================================

export type SeededCallOff = { supplier: string; lineIds: string[] };

export function planSuggestedCallOffs(data: ProjectData): SeededCallOff[] {
  const groups = new Map<string, string[]>();
  for (const line of data.boqLines) {
    const supplier = pickSupplier(line, data);
    const arr = groups.get(supplier) ?? [];
    arr.push(line.id);
    groups.set(supplier, arr);
  }
  return Array.from(groups.entries())
    .map(([supplier, lineIds]) => ({ supplier, lineIds }))
    .sort((a, b) => a.supplier.localeCompare(b.supplier));
}

function pickSupplier(line: ProjectBoqLine, data: ProjectData): string {
  return line.selectedSupplier
    || data.supplierChoices[line.material]
    || "Unassigned";
}

export function seedSuggestedCallOffs(projectId: string, data: ProjectData): number {
  const plan = planSuggestedCallOffs(data);
  let count = 0;
  for (const g of plan) {
    if (g.supplier === "Unassigned") continue;   // skip until QS picks a supplier
    if (g.lineIds.length === 0) continue;
    addCallOff(projectId, { supplier: g.supplier, lineIds: g.lineIds, status: "draft" });
    count += 1;
  }
  return count;
}