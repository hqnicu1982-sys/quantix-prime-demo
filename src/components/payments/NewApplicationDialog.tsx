import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  CATEGORY_LABELS,
  type PaymentLine,
  type PaymentLineCategory,
  createApplication,
  previouslyCertifiedTotal,
  recalcApplication,
} from "@/lib/paymentCycle";
import { fmtMoney } from "@/lib/mockData";

const lineSchema = z.object({
  category: z.enum(["preliminaries", "measured_work", "variations", "materials_on_site", "dayworks", "other"]),
  description: z.string().trim().min(1, "Description required").max(200),
  gross: z.number().finite(),
});

const formSchema = z.object({
  periodEnd: z.string().min(1, "Period end required"),
  retentionPct: z.number().min(0).max(10),
  previouslyCertified: z.number().min(0),
  notes: z.string().max(500).optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line"),
});

type DraftLine = Omit<PaymentLine, "id">;

export function NewApplicationDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [retentionPct, setRetentionPct] = useState(5);
  const [previouslyCertified, setPreviouslyCertified] = useState(() => previouslyCertifiedTotal(projectId));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { category: "measured_work", description: "", gross: 0 },
  ]);

  const totals = useMemo(
    () => recalcApplication({ lines: lines as PaymentLine[], retentionPct, previouslyCertified }),
    [lines, retentionPct, previouslyCertified],
  );

  const reset = () => {
    setPeriodEnd(today);
    setRetentionPct(5);
    setPreviouslyCertified(previouslyCertifiedTotal(projectId));
    setNotes("");
    setLines([{ category: "measured_work", description: "", gross: 0 }]);
  };

  const handleSubmit = (status: "draft" | "submitted") => {
    const parse = formSchema.safeParse({ periodEnd, retentionPct, previouslyCertified, notes, lines });
    if (!parse.success) {
      toast.error("Check the form", { description: parse.error.issues[0].message });
      return;
    }
    const app = createApplication({ projectId, ...parse.data, status });
    toast.success(status === "draft" ? "Application saved as draft" : "Application submitted", {
      description: `${app.appNumber} · ${fmtMoney(app.netThisApplication, { compact: true })} net${
        status === "submitted" ? ` · Notice due ${app.dueDateForNotice}` : ""
      }`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Payment Application</DialogTitle>
          <DialogDescription>
            Capture work done up to a valuation date. Net amount = (gross − retention) − previously certified.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="periodEnd">Valuation date</Label>
            <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="retention">Retention %</Label>
            <Input
              id="retention"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={retentionPct}
              onChange={(e) => setRetentionPct(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="prev">Previously certified £</Label>
            <Input
              id="prev"
              type="number"
              min={0}
              step={100}
              value={previouslyCertified}
              onChange={(e) => setPreviouslyCertified(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <Label>Line items (cumulative gross to date)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLines((ls) => [...ls, { category: "measured_work", description: "", gross: 0 }])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add line
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 rounded border border-[var(--ink-200)] p-2">
                <select
                  className="col-span-3 rounded border border-[var(--ink-200)] bg-white px-2 text-[12px]"
                  value={line.category}
                  onChange={(e) =>
                    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, category: e.target.value as PaymentLineCategory } : l)))
                  }
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <Input
                  className="col-span-6"
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, description: e.target.value } : l)))}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  step={50}
                  placeholder="£ gross"
                  value={line.gross}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, gross: Number(e.target.value) } : l)))}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="col-span-1 h-9 w-9 text-[var(--red-500)]"
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-[var(--ink-50)] p-3 text-[12.5px]">
          <div className="grid grid-cols-4 gap-2">
            <Totals label="Gross" value={totals.grossTotal} />
            <Totals label={`Retention (${retentionPct}%)`} value={-totals.retentionHeld} />
            <Totals label="Cumulative net" value={totals.netCumulative} />
            <Totals label="This application" value={totals.netThisApplication} bold />
          </div>
        </div>

        <div className="mt-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleSubmit("draft")}>Save as draft</Button>
          <Button onClick={() => handleSubmit("submitted")}>Submit application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Totals({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className={`font-mono-num text-[14px] ${bold ? "font-bold text-[var(--ink-900)]" : "text-[var(--ink-700)]"}`}>
        {fmtMoney(value)}
      </div>
    </div>
  );
}