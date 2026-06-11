import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHead, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ambiguousMatches, livePreview } from "@/lib/mockData";
import { usePriceListUploads, logPriceListUpload } from "@/lib/priceListRegistry";
import { useCurrentUser } from "@/lib/permissions";
import { CloudUpload, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/price-lists/upload")({ component: GuardedUpload });

function GuardedUpload() {
  const allowed = useCan("upload.prices");
  if (!allowed) return <NoAccess cap="upload.prices" title="Price list upload restricted" />;
  return <Upload />;
}

function Upload() {
  const uploads = usePriceListUploads();
  const user = useCurrentUser();

  function simulateUpload() {
    const samples = [
      { name: "CCF Full Catalogue April 2026.pdf", items: 82, matched: 78, review: 4 },
      { name: "Minster Price List May 2026.xlsx", items: 152, matched: 149, review: 3 },
      { name: "Travis Perkins Price Sheet.pdf", items: 48, matched: 29, review: 19 },
      { name: "Wolseley Plumbing Q2 2026.xlsx", items: 64, matched: 60, review: 4 },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const rec = logPriceListUpload({ ...pick, uploadedBy: user.name });
    toast.success("Upload indexed", {
      description: `${rec.items} items extracted · ${rec.matched} matched · ${rec.review} need review`,
    });
  }

  return (
    <Section
      title="Price List Upload"
      subtitle="Drop a supplier PDF or Excel. We extract items, match against your BoQ, flag ambiguous rows for review."
    >
      <Card>
        <div onClick={simulateUpload} className="m-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/50 p-12 text-center transition-colors hover:border-[var(--accent-500)] hover:bg-[var(--accent-500)]/5">
          <CloudUpload className="h-10 w-10 text-[var(--accent-500)]" />
          <p className="mt-3 text-[14px] font-semibold">Drop files or click to upload</p>
          <p className="mt-1 text-[12px] text-[var(--ink-500)]">Supported: PDF, XLSX, CSV, scanned images (OCR)</p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-[11px] text-[var(--ink-500)]">
            <Sparkles className="h-3 w-3 text-[var(--accent-500)]" />
            Example: CCF full catalogue April 2026.pdf — 82 items extracted in 18 seconds
          </p>
        </div>
      </Card>

      <Card>
        <CardHead title="Recent uploads" subtitle={`${uploads.length} indexed price lists`} />
        <div className="divide-y divide-[var(--ink-200)]">
          {uploads.length === 0 && (
            <div className="px-5 py-6 text-center text-[12px] text-[var(--ink-500)]">No uploads yet — drop a file above to get started.</div>
          )}
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{u.name}</p>
                <p className="text-[11.5px] text-[var(--ink-500)]">{u.date} · {u.items} items · {u.matched} matched · {u.review} review{u.uploadedBy ? ` · by ${u.uploadedBy}` : ""}</p>
              </div>
              <StatusBadge tone={u.status === "ok" ? "success" : "warning"} dot>
                {u.status === "ok" ? "Indexed" : "Needs review"}
              </StatusBadge>
              {u.review > 0 && <button onClick={() => toast(`Review ${u.review} items`, { description: `${u.name} · open ambiguous matches` })} className="text-[12px] font-medium text-[var(--accent-500)] hover:underline">Review {u.review}</button>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Live AI matching preview" subtitle="Minster Price List · in progress" />
          <div className="space-y-2 p-5">
            {livePreview.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-[var(--ink-200)] bg-white p-3 text-[12px]">
                <p className="font-mono-num min-w-0 flex-1 truncate text-[var(--ink-500)]">{p.raw}</p>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--ink-500)]" />
                <p className="min-w-0 flex-1 truncate font-medium">{p.matched}</p>
                <StatusBadge tone="success">{p.confidence}%</StatusBadge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Review panel" subtitle="3 items below 70% confidence" />
          <div className="space-y-3 p-5">
            {ambiguousMatches.map((m) => (
              <div key={m.id} className="rounded-md border border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Supplier text</p>
                <p className="font-mono-num mt-1 text-[12.5px] font-semibold">{m.raw}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {m.options.map((o, i) => (
                    <button key={i} onClick={() => toast.success("Match confirmed", { description: `${m.raw} → ${o.match}` })} className="rounded-md border border-[var(--ink-200)] bg-white p-3 text-left hover:border-[var(--accent-500)]">
                      <p className="text-[12px] font-medium">{o.match}</p>
                      <p className="mt-1 text-[11px] text-[var(--ink-500)]">Confidence: <span className="font-mono-num font-semibold">{o.confidence}%</span></p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast("Marked as no match", { description: m.raw })}>Neither</Button>
                  <Button size="sm" variant="outline" onClick={() => toast("Manual link", { description: "Pick a BoQ item to link to" })}>Link manually</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
