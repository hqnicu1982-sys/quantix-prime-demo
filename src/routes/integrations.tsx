import { createFileRoute } from "@tanstack/react-router";
import { Section, Card } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { integrations } from "@/lib/mockData";
import { Plug, RefreshCw, Settings as SettingsIcon, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Quantix Prime" }] }),
  component: GuardedIntegrations,
});

function GuardedIntegrations() {
  const allowed = useCan("view.integrations");
  if (!allowed) return <NoAccess cap="view.integrations" title="Integrations restricted" />;
  return <Integrations />;
}

function Integrations() {
  const cats = ["Accounting", "Programme", "Main contractor", "Collaboration"];
  return (
    <Section title="Integrations" subtitle="Connect Quantix Prime to the tools your business already uses">
      {cats.map((cat) => {
        const items = integrations.filter((i) => i.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((int) => (
                <Card key={int.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--ink-50)] text-[12px] font-bold text-[var(--ink-700)]">
                      {int.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    {int.connected && (
                      <StatusBadge tone="success"><Check className="h-2.5 w-2.5" /> Connected</StatusBadge>
                    )}
                  </div>
                  <p className="font-display mt-3 text-[15px] font-semibold">{int.name}</p>
                  {int.note && (
                    <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-[var(--ink-500)]">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />{int.note}
                    </p>
                  )}
                  {int.connected && int.lastSync && (
                    <p className="mt-1 text-[11px] text-[var(--ink-500)]">Last sync: {int.lastSync}</p>
                  )}
                  {int.connected && int.stats && (
                    <p className="mt-1 text-[11px] text-[var(--ink-500)]">{int.stats}</p>
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
                      <Button size="sm" className="w-full" onClick={() => toast.success(`Connecting to ${int.name}...`)}>
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
    </Section>
  );
}
