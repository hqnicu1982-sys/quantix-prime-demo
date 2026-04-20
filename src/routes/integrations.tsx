import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plug, Info, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { integrations } from "@/lib/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Quantix Prime" }] }),
  component: Integrations,
});

function Integrations() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">Connect Quantix Prime to the tools your business already uses</p>
      </div>

      {["Accounting", "Programme", "Main Contractor", "Comms"].map((cat) => {
        const items = integrations.filter((i) => i.category === cat);
        return (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((int) => (
                <Card key={int.name} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-xs font-bold">
                      {int.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    {int.connected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                        <Check className="h-2.5 w-2.5" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-semibold">{int.name}</p>
                  {int.note && (
                    <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-muted-foreground">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />{int.note}
                    </p>
                  )}
                  {int.connected && int.lastSync && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Last sync: {int.lastSync}</p>
                  )}
                  {int.connected && int.stats && (
                    <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                      <p>{int.stats.pos} POs synced</p>
                      <p>{int.stats.invoices} invoices synced</p>
                      <p className={cn(int.stats.errors > 0 && "text-warning-foreground font-medium")}>{int.stats.errors} errors</p>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {int.connected ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success(`${int.name} sync triggered`)}>
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />Sync
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toast.info(`${int.name} settings`)}>
                          <SettingsIcon className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => toast.success(`Connecting to ${int.name}...`, { description: "OAuth flow would start here" })}>
                        <Plug className="mr-1 h-3.5 w-3.5" />Connect
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
