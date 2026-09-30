import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { SampleRefusedAction } from "@/components/sample/SampleUI";
import { SAMPLE_INVOICE } from "@/lib/sampleProjectData";
export function SampleInvoiceIssue() { const i=SAMPLE_INVOICE; return <Card className="border-[var(--amber-500)]/30"><CardHead title="Open dispute · Meridian" subtitle={`${i.id} · ${i.poRef} · ${i.callOffRef}`} /><div className="space-y-4 p-5"><div className="flex items-start gap-3 rounded-md bg-[var(--amber-500)]/10 p-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-500)]"/><div><p className="text-[13px] font-semibold">Quantity and rate mismatch</p><p className="mt-1 text-[12px] text-[var(--ink-700)]">240 sheets billed · 180 delivered · £14.90/sheet billed · £14.10/sheet quoted.</p><p className="mt-1 text-[11px] text-[var(--ink-500)]">Status OPEN · Saved. Example project — no email sent.</p></div></div><SampleRefusedAction><Button size="sm" variant="outline"><ShieldCheck className="mr-1.5 h-3.5 w-3.5"/>Verify credit note</Button></SampleRefusedAction></div></Card> }
