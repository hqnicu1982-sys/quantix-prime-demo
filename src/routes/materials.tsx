import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ChevronDown, ChevronRight, Check, X, Clock } from "lucide-react";
import { materialReadiness, type MaterialItem, type Status } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { useProject } from "@/lib/ProjectContext";
import { EmptyProjectState } from "@/components/EmptyProjectState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Material Readiness — Quantix Prime" }] }),
  component: MaterialsWrapper,
});

const rowTone: Record<Status, string> = {
  READY: "",
  AT_RISK: "bg-warning/5",
  BLOCKED: "bg-danger/5",
  OVERDUE: "bg-danger/10",
};

const poBadge = (po: string) => {
  if (po === "raised") return "border-success/30 bg-success/10 text-success";
  if (po === "pending") return "border-warning/30 bg-warning/10 text-warning-foreground";
  return "border-danger/30 bg-danger/10 text-danger";
};
const dlBadge = (d: string) => {
  if (d === "confirmed") return "border-success/30 bg-success/10 text-success";
  if (d === "expected") return "border-accent/30 bg-accent/10 text-accent";
  if (d === "late") return "border-warning/30 bg-warning/10 text-warning-foreground";
  return "border-danger/30 bg-danger/10 text-danger";
};

function MaterialDetail({ m }: { m: MaterialItem }) {
  const ok = m.poStatus === "raised" && m.deliveryStatus === "confirmed";
  return (
    <li className="flex items-start justify-between gap-3 py-2 text-xs">
      <div className="flex items-start gap-2">
        {ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-foreground" />}
        <div>
          <p className="font-medium text-foreground">{m.name}</p>
          <p className="text-muted-foreground">{m.qty}{m.poDate && ` · PO raised ${m.poDate}`}{m.deliveryDate && ` · delivery ${m.deliveryDate}`}</p>
        </div>
      </div>
    </li>
  );
}

function MaterialsWrapper() {
  const { current } = useProject();
  if (!current.hasFullData) return <EmptyProjectState screen="material readiness" />;
  return <Materials />;
}

function Materials() {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = filter === "all" ? materialReadiness : materialReadiness.filter((m) => m.status === filter);
  const atRisk = materialReadiness.filter((m) => m.status !== "READY").length;
  const ready = materialReadiness.filter((m) => m.status === "READY").length;
  const overdue = materialReadiness.filter((m) => m.status === "OVERDUE").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Material Readiness</h1>
        <p className="text-sm text-muted-foreground">3-week look-ahead · all systems</p>
      </div>

      <button onClick={() => toast.info(`${atRisk} tasks need attention`, { description: "Filter table to AT_RISK to investigate" })} className="flex w-full items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-left transition-colors hover:bg-warning/15">
        <AlertTriangle className="h-5 w-5 text-warning-foreground" aria-hidden />
        <p className="flex-1 text-sm font-medium">{atRisk} tasks at risk of material delay — click to resolve</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total tasks</p><p className="mt-1 text-2xl font-bold">{materialReadiness.length}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ready</p><p className="mt-1 text-2xl font-bold text-success">{ready}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">At risk / Blocked</p><p className="mt-1 text-2xl font-bold text-warning-foreground">{atRisk - overdue}</p></Card>
        <Card className="p-3.5"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Overdue</p><p className="mt-1 text-2xl font-bold text-danger">{overdue}</p></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="AT_RISK">At risk</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="3w">
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1w">This week</SelectItem>
            <SelectItem value="2w">Next 2 weeks</SelectItem>
            <SelectItem value="3w">Next 3 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Task</th>
                <th className="px-3 py-2.5">Start</th>
                <th className="px-3 py-2.5">System</th>
                <th className="px-3 py-2.5">PO</th>
                <th className="px-3 py-2.5">Delivery</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((m) => {
                const open = expanded === m.id;
                return (
                  <>
                    <tr key={m.id} className={cn(rowTone[m.status], "transition-colors hover:bg-secondary/30")}>
                      <td className="px-3 py-3">
                        <button onClick={() => setExpanded(open ? null : m.id)} aria-label="Expand">
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                        </button>
                      </td>
                      <td className="px-3 py-3 font-medium">{m.task}</td>
                      <td className="px-3 py-3 text-muted-foreground tabular-nums">{m.start}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{m.system}</td>
                      <td className="px-3 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", poBadge(m.po))}>{m.po}</span></td>
                      <td className="px-3 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", dlBadge(m.delivery))}>{m.delivery}</span></td>
                      <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-3 py-3">
                        {m.po === "none" ? <Button size="sm" onClick={() => toast.success("PO drafted", { description: "Sent to Sarah Williams for approval" })}>Raise PO</Button> : <Button size="sm" variant="ghost">View</Button>}
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${m.id}-detail`} className={rowTone[m.status]}>
                        <td colSpan={8} className="px-12 py-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Materials required</p>
                          <ul className="divide-y">
                            {m.materials.map((mat, i) => <MaterialDetail key={i} m={mat} />)}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
