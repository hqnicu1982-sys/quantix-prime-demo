import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { materialReadiness, type Status } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Material Readiness — Quantix Prime" }] }),
  component: Materials,
});

const rowTone: Record<Status, string> = {
  READY: "",
  AT_RISK: "bg-warning/5",
  BLOCKED: "bg-danger/5",
  OVERDUE: "bg-danger/5",
};

function Materials() {
  const atRisk = materialReadiness.filter((m) => m.status !== "READY").length;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Material Readiness</h1>
        <p className="text-sm text-muted-foreground">3-week look-ahead</p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-warning-foreground" />
        <p className="text-sm font-medium">
          {atRisk} tasks at risk of delay — click to resolve
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Task</th>
                <th className="px-4 py-2.5">Start</th>
                <th className="px-4 py-2.5">Materials</th>
                <th className="px-4 py-2.5">PO</th>
                <th className="px-4 py-2.5">Delivery</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materialReadiness.map((m, i) => (
                <tr key={i} className={cn(rowTone[m.status])}>
                  <td className="px-4 py-3 font-medium">{m.task}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.start}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.materials.join(", ")}</td>
                  <td className="px-4 py-3 capitalize">{m.po}</td>
                  <td className="px-4 py-3 capitalize">{m.delivery}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
