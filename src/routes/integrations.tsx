import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section, Card } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { integrations } from "@/lib/mockData";
import { Plug, RefreshCw, Settings as SettingsIcon, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import {
  useIntegrationConnections,
  syncIntegration,
  formatRelative,
  SYNC_FREQUENCIES,
} from "@/lib/integrationConnections";
import {
  ConnectIntegrationDialog,
  IntegrationSettingsDialog,
} from "@/components/integrations/IntegrationDialogs";

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
  const connections = useIntegrationConnections();
  const [connectFor, setConnectFor] = useState<{ id: string; name: string; category: string } | null>(null);
  const [settingsFor, setSettingsFor] = useState<{ id: string; name: string } | null>(null);

  return (
    <Section title="Integrations" subtitle="Connect Quantix Prime to the tools your business already uses">
      {cats.map((cat) => {
        const items = integrations.filter((i) => i.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((int) => {
                const live = connections.find((c) => c.id === int.id);
                // mock seed (Xero/Asta) is still treated as connected when no user connection exists
                const connected = !!live || int.connected;
                const lastSync = live ? formatRelative(live.lastSync ?? live.connectedAt) : int.lastSync;
                const account = live?.account;
                const freqLabel = live ? SYNC_FREQUENCIES.find((f) => f.code === live.frequency)?.label : undefined;

                return (
                  <Card key={int.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--ink-50)] text-[12px] font-bold text-[var(--ink-700)]">
                        {int.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      {connected && (
                        <StatusBadge tone="success"><Check className="h-2.5 w-2.5" /> Connected</StatusBadge>
                      )}
                    </div>
                    <p className="font-display mt-3 text-[15px] font-semibold">{int.name}</p>
                    {int.note && !live && (
                      <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-[var(--ink-500)]">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />{int.note}
                      </p>
                    )}
                    {account && (
                      <p className="mt-1 text-[11px] text-[var(--ink-500)]">{account}{freqLabel ? ` · ${freqLabel}` : ""}</p>
                    )}
                    {connected && lastSync && (
                      <p className="mt-1 text-[11px] text-[var(--ink-500)]">Last sync: {lastSync}</p>
                    )}
                    {!live && int.connected && int.stats && (
                      <p className="mt-1 text-[11px] text-[var(--ink-500)]">{int.stats}</p>
                    )}
                    {live && (live.syncs > 0 || live.errors > 0) && (
                      <p className="mt-1 text-[11px] text-[var(--ink-500)]">{live.syncs} syncs · {live.errors} errors</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {connected ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={!live}
                            title={!live ? "Connect with your own credentials to enable manual sync" : undefined}
                            onClick={() => {
                              syncIntegration(int.id);
                              toast.success(`${int.name} sync triggered`, { description: "Pulling the latest data now…" });
                            }}
                          >
                            <RefreshCw className="mr-1 h-3.5 w-3.5" />Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!live}
                            title={!live ? "Settings available after you connect your own account" : undefined}
                            onClick={() => live && setSettingsFor({ id: int.id, name: int.name })}
                          >
                            <SettingsIcon className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setConnectFor({ id: int.id, name: int.name, category: int.category })}
                        >
                          <Plug className="mr-1 h-3.5 w-3.5" />Connect
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {connectFor && (
        <ConnectIntegrationDialog
          id={connectFor.id}
          name={connectFor.name}
          category={connectFor.category}
          open={!!connectFor}
          onOpenChange={(v) => !v && setConnectFor(null)}
        />
      )}
      {settingsFor && (() => {
        const conn = connections.find((c) => c.id === settingsFor.id);
        if (!conn) return null;
        return (
          <IntegrationSettingsDialog
            conn={conn}
            name={settingsFor.name}
            open={!!settingsFor}
            onOpenChange={(v) => !v && setSettingsFor(null)}
          />
        );
      })()}
    </Section>
  );
}
