import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { financialBoq, monthlyPnl, marginAlerts } from "@/lib/mockData";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financial")({
  head: () => ({ meta: [{ title: "Financial Dashboard — Quantix Prime" }] }),
  component: Financial,
});

function Financial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-sm text-muted-foreground">Estimator → Buyer → Actual cost variance</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">3-way cost comparison per BoQ line</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">BoQ line</th>
                <th className="px-3 py-2.5 text-right">Estimator</th>
                <th className="px-3 py-2.5 text-right">Buyer</th>
                <th className="px-3 py-2.5 text-right">Actual</th>
                <th className="px-3 py-2.5 text-right">Var £</th>
                <th className="px-3 py-2.5 text-right">Var %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {financialBoq.map((r) => {
                const varAbs = r.actual - r.est;
                const over = varAbs > 0;
                return (
                  <tr key={r.line}>
                    <td className="px-4 py-3 font-medium">{r.line}</td>
                    <td className="px-3 py-3 text-right tabular-nums">£{r.est.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">£{r.buyer.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">£{r.actual.toLocaleString()}</td>
                    <td className={cn("px-3 py-3 text-right tabular-nums font-semibold", over ? "text-danger" : "text-success")}>
                      {over ? "+" : "−"}£{Math.abs(varAbs).toLocaleString()}
                    </td>
                    <td className={cn("px-3 py-3 text-right tabular-nums font-semibold", over ? "text-danger" : "text-success")}>
                      {over ? "+" : ""}{r.varPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Monthly P&L</h2>
        <p className="text-xs text-muted-foreground">Revenue · Cost · Margin</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPnl} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" fill="var(--color-accent)" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="var(--color-primary)" name="Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margin" fill="var(--color-success)" name="Margin" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <h2 className="font-semibold">Margin drift alerts</h2>
        </div>
        <ul className="space-y-2.5">
          {marginAlerts.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <button className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline">
                Investigate <ArrowRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
