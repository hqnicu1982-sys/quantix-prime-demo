import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plug, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  connectIntegration,
  updateIntegrationSettings,
  disconnectIntegration,
  SYNC_FREQUENCIES,
  type IntegrationConnection,
  type SyncFrequency,
} from "@/lib/integrationConnections";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-[var(--ink-700)]">{label}</Label>
      {children}
      {hint && <p className="text-[10.5px] text-[var(--ink-500)]">{hint}</p>}
    </div>
  );
}

const SCOPE_HINTS: Record<string, string> = {
  Accounting:          "Read POs, write invoices, sync supplier ledger",
  Programme:           "Read tasks, two-way sync of programme dates",
  "Main contractor":   "Push daily reports, RFIs and variations",
  Collaboration:       "Send notifications to channels you select",
};

function maskKey(k: string) {
  const trimmed = k.trim();
  if (trimmed.length < 8) return trimmed;
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

// ── Connect ─────────────────────────────────────────────────────────────────
export function ConnectIntegrationDialog({
  id, name, category, open, onOpenChange,
}: {
  id: string; name: string; category: string;
  open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [account, setAccount] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [scope, setScope] = useState(SCOPE_HINTS[category] ?? "Read & write");
  const [frequency, setFrequency] = useState<SyncFrequency>("hourly");
  const [notify, setNotify] = useState(true);

  const submit = () => {
    if (!account.trim()) { toast.error("Add the account or workspace name"); return; }
    if (!apiKey.trim() || apiKey.trim().length < 8) { toast.error("Paste a valid API key (min 8 chars)"); return; }
    connectIntegration({
      id,
      account: account.trim(),
      apiKey: maskKey(apiKey),
      scope,
      frequency,
      notifyOnError: notify,
    });
    toast.success(`${name} connected`, { description: `${account.trim()} · ${SYNC_FREQUENCIES.find((f) => f.code === frequency)?.label}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plug className="h-4 w-4 text-[var(--accent-500)]" /> Connect {name}</DialogTitle>
          <DialogDescription>Quantix Prime will use these credentials to sync {category.toLowerCase()} data. You can disconnect any time from settings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Account / workspace" hint="e.g. company name on the provider side">
            <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={category === "Collaboration" ? "acme-construction.slack.com" : "Acme Construction Ltd"} className="h-9 text-[12px]" />
          </Field>
          <Field label="API key / OAuth token" hint="Stored encrypted. Only the last 4 chars shown after save.">
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_live_…" className="h-9 text-[12px] font-mono-num" type="password" />
          </Field>
          <Field label="Scope">
            <Input value={scope} onChange={(e) => setScope(e.target.value)} className="h-9 text-[12px]" />
          </Field>
          <Field label="Sync frequency">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as SyncFrequency)}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYNC_FREQUENCIES.map((f) => <SelectItem key={f.code} value={f.code} className="text-[12px]">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
            <span>Email me when a sync fails</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><Plug className="mr-1 h-3 w-3" /> Connect {name}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Settings + Disconnect ──────────────────────────────────────────────────
export function IntegrationSettingsDialog({
  conn, name, open, onOpenChange,
}: {
  conn: IntegrationConnection; name: string;
  open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [account, setAccount] = useState(conn.account);
  const [scope, setScope] = useState(conn.scope);
  const [frequency, setFrequency] = useState<SyncFrequency>(conn.frequency);
  const [notify, setNotify] = useState(conn.notifyOnError);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const save = () => {
    updateIntegrationSettings(conn.id, { account, scope, frequency, notifyOnError: notify });
    toast.success(`${name} settings saved`);
    onOpenChange(false);
  };
  const disconnect = () => {
    disconnectIntegration(conn.id);
    toast.success(`${name} disconnected`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-[var(--accent-500)]" /> {name} settings</DialogTitle>
          <DialogDescription>Connected by {conn.connectedBy} · {conn.syncs} successful syncs · API key {conn.apiKey}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Account / workspace">
            <Input value={account} onChange={(e) => setAccount(e.target.value)} className="h-9 text-[12px]" />
          </Field>
          <Field label="Scope">
            <Input value={scope} onChange={(e) => setScope(e.target.value)} className="h-9 text-[12px]" />
          </Field>
          <Field label="Sync frequency">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as SyncFrequency)}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYNC_FREQUENCIES.map((f) => <SelectItem key={f.code} value={f.code} className="text-[12px]">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
            <span>Email me when a sync fails</span>
          </label>

          {confirmDisconnect ? (
            <div className="flex items-start gap-2 rounded-md border border-[var(--red-500)]/30 bg-[var(--red-500)]/5 p-3 text-[12px]">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--red-500)]" />
              <div className="flex-1">
                <p className="font-semibold">Disconnect {name}?</p>
                <p className="text-[var(--ink-700)]">Sync stops immediately. Historical data stays in Quantix Prime.</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
                  <Button size="sm" variant="destructive" onClick={disconnect}>Yes, disconnect</Button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDisconnect(true)} className="text-[11.5px] text-[var(--red-500)] hover:underline">
              Disconnect {name}
            </button>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={save}>Save settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
