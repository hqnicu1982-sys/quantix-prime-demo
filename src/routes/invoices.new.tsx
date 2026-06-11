import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceWorkflowStrip } from "@/components/invoices/InvoiceWorkflowStrip";
import { useState } from "react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { UploadCloud, Sparkles, AlertTriangle } from "lucide-react";
import { FormWizard } from "@/components/forms/FormWizard";

export const Route = createFileRoute("/invoices/new")({ component: Guarded });

function Guarded() {
  const allowed = useCan("sign.invoices");
  if (!allowed) return <NoAccess cap="sign.invoices" title="Only QS / Admin can upload invoices" />;
  return <NewInvoice />;
}

function NewInvoice() {
  const nav = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [supplier, setSupplier] = useState("CCF");
  const [ref, setRef] = useState("CCF-10825");
  const [amount, setAmount] = useState<number>(0);
  const [po, setPo] = useState("PO-00248");

  const handleSubmit = () => {
    toast.success("Invoice queued for 3-way match", {
      description: `${ref} · ${supplier} · £${amount.toLocaleString()} → engine running, you'll be notified if variance > tolerance`,
    });
    nav({ to: "/invoices" });
  };

  return (
    <FormWizard
      title="Upload invoice"
      subtitle="4-step wizard · OCR extracts lines and the engine matches them to a PO + GRN"
      workflowStrip={<InvoiceWorkflowStrip stage="received" compact />}
      submitLabel="Submit to match engine"
      onSubmit={handleSubmit}
      onCancel={() => nav({ to: "/invoices" })}
      steps={[
        {
          id: "upload",
          label: "Upload file",
          canAdvance: () => !!fileName,
          render: () => (
            <div className="space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--ink-200)] bg-[var(--ink-50)] p-8 text-center hover:border-[var(--accent-500)]">
                <UploadCloud className="h-6 w-6 text-[var(--ink-500)]" />
                <p className="text-[12.5px] font-semibold">Drop PDF / XLSX or click to browse</p>
                <p className="text-[11px] text-[var(--ink-500)]">PDF, XLSX, CSV — max 10 MB · we'll OCR multi-page invoices</p>
                <input type="file" accept=".pdf,.xlsx,.csv" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFileName(f.name); toast.success(`Parsed ${f.name}`, { description: "1 supplier · 1 line · £8,340" }); setAmount(8340); }
                }} />
              </label>
              {fileName && (
                <div className="flex items-center justify-between rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 px-3 py-2 text-[12px]">
                  <span className="font-semibold text-[var(--green-600)]"><Sparkles className="mr-1 inline h-3 w-3" /> {fileName}</span>
                  <span className="text-[var(--ink-500)]">Detected supplier: CCF · ref CCF-10825</span>
                </div>
              )}
            </div>
          ),
        },
        {
          id: "parse",
          label: "Confirm parsed data",
          canAdvance: () => !!supplier && !!ref && amount > 0,
          render: () => (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <select className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                  <option>CCF</option>
                  <option>Minster</option>
                  <option>Knauf Direct</option>
                  <option>British Gypsum</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Invoice reference</Label>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Issued date</Label>
                <Input type="date" defaultValue="2026-04-22" />
              </div>
              <div className="space-y-1.5">
                <Label>Gross amount (£)</Label>
                <Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Notes</Label>
                <textarea className="min-h-[64px] w-full rounded-md border border-[var(--ink-200)] bg-background px-3 py-2 text-[13px]" placeholder="OCR confidence 0.96 · review any odd line items here" />
              </div>
            </div>
          ),
        },
        {
          id: "match",
          label: "Link to PO",
          canAdvance: () => !!po,
          render: () => (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Match to PO</Label>
                <select className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]" value={po} onChange={(e) => setPo(e.target.value)}>
                  <option>PO-00248 · CCF · £7,093</option>
                  <option>PO-00247 · CCF · £7,252</option>
                  <option>PO-00245 · Minster · £5,124</option>
                </select>
                <p className="text-[10.5px] text-[var(--ink-500)]">Engine pre-selects the closest match. You can change it.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Match to GRN (optional)</Label>
                <select className="h-9 w-full rounded-md border border-[var(--ink-200)] bg-background px-3 text-[13px]">
                  <option>DEL-9921 · 1,850 m² boards (24 Apr)</option>
                  <option>Skip — match on PO only</option>
                </select>
              </div>
              <div className="md:col-span-2 rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-3 text-[12px]">
                <p className="font-semibold text-[var(--accent-500)]">Pre-flight variance</p>
                <p className="mt-1 text-[var(--ink-700)]">
                  Invoice <strong>£{amount.toLocaleString()}</strong> vs PO <strong>£7,093</strong> →
                  <strong className={amount - 7093 > 50 ? "ml-1 text-[var(--amber-500)]" : "ml-1 text-[var(--green-600)]"}>
                    {amount - 7093 === 0 ? "exact match" : `+£${(amount - 7093).toLocaleString()}`}
                  </strong>
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "submit",
          label: "Submit to match engine",
          render: () => (
            <div className="space-y-3">
              <div className="rounded-md border border-[var(--green-600)]/30 bg-[var(--green-600)]/5 p-4 text-[12.5px]">
                <p className="font-semibold text-[var(--green-600)]">Ready to submit</p>
                <p className="mt-1 text-[var(--ink-700)]">
                  On submit: invoice <strong>{ref}</strong> moves through Received → Parsed → 3-way match.
                  {amount - 7093 > 50 && " Variance above tolerance — will route to QS review."}
                </p>
              </div>
              {amount - 7093 > 1000 && (
                <div className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-3 text-[12px] text-[var(--ink-700)]">
                  <AlertTriangle className="mr-1 inline h-3 w-3 text-[var(--amber-500)]" /> Large variance — likely a rate uplift. QS will be notified immediately.
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}