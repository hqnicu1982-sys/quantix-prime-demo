import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHead } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
export function SampleDeliveryStory() { const rows = [
  { ref:"CO-0001", supplier:"Castlegate Drylining Supplies", scope:"W2 boards + studs · North zone", state:"Delivered in full", detail:"GRN signed by Dan Mercer · invoice approved", tone:"success" as const, icon:<CheckCircle2 className="h-4 w-4"/> },
  { ref:"CO-0002", supplier:"Meridian Building Materials", scope:"W3 FireLine + APR · corridors", state:"Short delivery", detail:"240 FireLine ordered · 180 delivered · signed GRN records 60-sheet shortfall", tone:"warning" as const, icon:<AlertTriangle className="h-4 w-4"/> },
  { ref:"CO-0003", supplier:"Northway Interiors Supply", scope:"W5 SoundBloc 15 · core", state:"Draft", detail:"Awaiting approval", tone:"neutral" as const, icon:<Clock className="h-4 w-4"/> },
]; return <Card><CardHead title="Delivery story" subtitle="Call-off → delivery → GRN → invoice" /><div className="divide-y divide-[var(--ink-200)]">{rows.map(r => <div key={r.ref} className="flex flex-wrap items-start gap-3 px-5 py-4"><span className="mt-0.5 text-[var(--ink-500)]">{r.icon}</span><div className="min-w-0 flex-1"><p className="font-mono-num text-[12px] font-bold">{r.ref} · {r.supplier}</p><p className="mt-0.5 text-[12.5px]">{r.scope}</p><p className="mt-1 text-[11px] text-[var(--ink-500)]">{r.detail}</p></div><StatusBadge tone={r.tone} dot>{r.state}</StatusBadge></div>)}</div></Card> }
