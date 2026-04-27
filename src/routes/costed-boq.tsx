import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Section, Card, Kpi } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { costedBoqRows, costedBoqKpi, fmtMoney, type BoqRow } from "@/lib/mockData";
import { History, FileDown, Sparkles, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Check, Trash2, Calculator as CalcIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData, removeSystem } from "@/lib/projectData";
import { Link, useNavigate } from "@tanstack/react-router";

const searchSchema = z.object({
  tab:    fallback(z.enum(["all", "review", "missing", "savings"]), "all").default("all"),
  q:      fallback(z.string(), "").default(""),
  sort:   fallback(z.enum(["name", "qty", "rate", "saving"]), "saving").default("saving"),
  dir:    fallback(z.enum(["asc", "desc"]), "desc").default("desc"),
  page:   fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/costed-boq")({
  head: () => ({ meta: [{ title: "Costed BoQ — Quantix Prime" }] }),
  validateSearch: zodValidator(searchSchema),
  component: CostedBoq,
});

const TABS = [
  { id: "all" as const,     label: "All items" },
  { id: "review" as const,  label: "Needs review" },
  { id: "missing" as const, label: "Not priced" },
  { id: "savings" as const, label: "Best savings" },
];

const PAGE_SIZE = 20;

function CostedBoq() {
  const navigate = Route.useNavigate();
  const goto = useNavigate();
  const search = Route.useSearch();
  const { current } = useProject();
  const projectData = useProjectData(current.id);
  const set = (patch: Record<string, unknown>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }), replace: true });

  // Generate more rows from base data so 82 items feels real.
  const allRows = useMemo(() => generateRows(), []);

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let rows = allRows;
    if (search.tab === "review")  rows = rows.filter(r => r.best === "review");
    if (search.tab === "missing") rows = rows.filter(r => r.ccf === null || r.minster === null);
    if (search.tab === "savings") rows = rows.filter(r => r.saving > 0).sort((a, b) => b.saving - a.saving);
    if (search.q) {
      const q = search.q.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    const sorted = [...rows].sort((a, b) => {
      const dir = search.dir === "asc" ? 1 : -1;
      switch (search.sort) {
        case "name":   return a.name.localeCompare(b.name) * dir;
        case "qty":    return (a.qty - b.qty) * dir;
        case "rate":   return (a.rate - b.rate) * dir;
        case "saving": return (a.saving - b.saving) * dir;
        default:       return 0;
      }
    });
    return sorted;
  }, [allRows, search.tab, search.q, search.sort, search.dir]);

  const tabCounts = useMemo(() => ({
    all: allRows.length,
    review: allRows.filter(r => r.best === "review").length,
    missing: allRows.filter(r => r.ccf === null || r.minster === null).length,
    savings: allRows.filter(r => r.saving > 0).length,
  }), [allRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(search.page, totalPages);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleRow = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(prev => {
      const allOnPage = paged.every(r => prev.has(r.code));
      const next = new Set(prev);
      if (allOnPage) paged.forEach(r => next.delete(r.code));
      else paged.forEach(r => next.add(r.code));
      return next;
    });
  };

  // Modals
  const [drillRow, setDrillRow] = useState<BoqRow | null>(null);
  const [optimiseOpen, setOptimiseOpen] = useState(false);
  const [reviewRow, setReviewRow] = useState<BoqRow | null>(null);

  const sortHeader = (key: typeof search.sort, label: string, align: "left" | "right" = "right") => (
    <button
      onClick={() => set({ sort: key, dir: search.sort === key && search.dir === "desc" ? "asc" : "desc", page: 1 })}
      className={cn(
        "inline-flex items-center gap-1 hover:text-[var(--ink-900)]",
        align === "right" && "ml-auto",
      )}
    >
      {label}
      {search.sort === key
        ? (search.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)
        : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );

  const exportCsv = () => {
    const header = "Code,Item,Subtitle,Qty,Unit,BoQ Rate,CCF,Minster,Best,Saving";
    const body = filtered.map(r => [
      r.code,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.subtitle.replace(/"/g, '""')}"`,
      r.qty, r.unit, r.rate, r.ccf ?? "", r.minster ?? "", r.best, r.saving,
    ].join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `costed-boq-fitzrovia-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export downloaded", { description: a.download });
  };

  return (
    <Section
      title="Costed BoQ"
      subtitle={`${allRows.length} items · 2 active price lists (CCF + Minster) · ${tabCounts.review} need review · ${tabCounts.missing} not priced`}
      right={
        <>
          <Button variant="outline" size="sm" onClick={() => toast("Revisions", { description: "BoQ rev 3.2 · 4 prior revisions available" })}><History className="mr-1.5 h-3.5 w-3.5" />Revisions</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><FileDown className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
          <Button size="sm" onClick={() => setOptimiseOpen(true)}><Sparkles className="mr-1.5 h-3.5 w-3.5" />Optimise split</Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="BoQ estimated" value={fmtMoney(costedBoqKpi.estimated, { compact: true })} />
        <Kpi label="Priced if cheapest" value={fmtMoney(costedBoqKpi.cheapest, { compact: true })} delta={`–${fmtMoney(costedBoqKpi.totalSaving)} vs estimate`} tone="success" trend="down" />
        <Kpi label="Single supplier (CCF)" value={fmtMoney(costedBoqKpi.singleSupplier, { compact: true })} delta="+£28.2k" tone="warning" />
        <Kpi label="Items not priced" value={`${tabCounts.missing}`} delta={`${costedBoqKpi.coverage}% coverage`} tone="warning" />
      </div>

      {/* Custom systems added via Calculator for current project */}
      <CustomSystemsPanel projectId={current.id} projectName={current.name} systems={projectData.systems} lines={projectData.boqLines} />

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-md bg-[var(--ink-50)] p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => set({ tab: t.id, page: 1 })}
              className={cn(
                "rounded px-3 py-1.5 text-[12px] font-medium transition-colors",
                search.tab === t.id ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--ink-900)]",
              )}
            >
              {t.label} <span className="ml-1 text-[var(--ink-500)]">({tabCounts[t.id]})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-3 md:flex-initial">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-500)]" />
            <input
              value={search.q}
              onChange={(e) => set({ q: e.target.value, page: 1 })}
              placeholder="Search items…"
              className="w-full rounded-md border border-[var(--ink-200)] bg-white py-1.5 pl-8 pr-7 text-[12.5px] focus:border-[var(--accent-500)] focus:outline-none"
            />
            {search.q && (
              <button onClick={() => set({ q: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-500)] hover:text-[var(--ink-900)]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="hidden items-center gap-2 text-[12px] md:flex">
            <span className="text-[var(--ink-500)]">Suppliers:</span>
            <StatusBadge tone="success" dot>CCF</StatusBadge>
            <StatusBadge tone="info" dot>Minster</StatusBadge>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 px-3 py-2 text-[12.5px]">
          <span className="font-medium text-[var(--ink-900)]">
            {selected.size} item{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            <Button size="sm" onClick={() => {
              const picks = Object.keys(projectData.supplierChoices).length;
              toast.success(`${selected.size} draft call-offs created`, {
                description: picks > 0
                  ? `Using ${picks} agreed supplier${picks === 1 ? "" : "s"} for ${current.name}`
                  : `No supplier picks yet — defaults from Price Intelligence`,
              });
              setSelected(new Set());
              goto({ to: "/calloffs" });
            }}>Generate call-offs ({selected.size})</Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-[var(--ink-50)] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)] shadow-[0_1px_0_var(--ink-200)]">
              <tr>
                <th className="w-9 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && paged.every(r => selected.has(r.code))}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 accent-[var(--accent-500)]"
                  />
                </th>
                <th className="px-4 py-3">{sortHeader("name", "BoQ item", "left")}</th>
                <th className="px-3 py-3 text-right">{sortHeader("qty", "Qty")}</th>
                <th className="px-3 py-3 text-right">{sortHeader("rate", "BoQ rate")}</th>
                <th className="px-3 py-3 text-right bg-[var(--green-600)]/5">CCF</th>
                <th className="px-3 py-3 text-right bg-[var(--accent-500)]/5">Minster</th>
                <th className="px-3 py-3 text-center">Best</th>
                <th className="px-3 py-3 text-right">{sortHeader("saving", "Savings")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-200)]">
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--ink-500)]">No items match your filters.</td></tr>
              ) : (
                paged.map((r) => (
                  <BoqRowCell
                    key={r.code}
                    row={r}
                    selected={selected.has(r.code)}
                    onToggle={() => toggleRow(r.code)}
                    onOpen={() => setDrillRow(r)}
                    onReview={() => setReviewRow(r)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--ink-200)] bg-[var(--ink-50)] px-4 py-3 text-[12px]">
          <span className="text-[var(--ink-500)]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items ·{" "}
            <strong className="font-mono text-[13px] text-[var(--green-600)]">–{fmtMoney(filtered.reduce((a, r) => a + r.saving, 0))} potential saving</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Prev</Button>
            <span className="font-mono-num tabular-nums text-[var(--ink-700)]">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => set({ page: page + 1 })}>Next</Button>
          </div>
        </div>
      </Card>

      {/* Drill-down modal */}
      <Dialog open={!!drillRow} onOpenChange={(o) => !o && setDrillRow(null)}>
        <DialogContent className="max-w-xl">
          {drillRow && (
            <>
              <DialogHeader>
                <DialogTitle>{drillRow.name}</DialogTitle>
                <DialogDescription>{drillRow.code} · {drillRow.subtitle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Qty" value={`${drillRow.qty.toLocaleString()} ${drillRow.unit}`} />
                  <Stat label="BoQ rate" value={`£${drillRow.rate.toFixed(2)}`} />
                  <Stat label="Saving" value={drillRow.saving > 0 ? `–£${drillRow.saving.toLocaleString()}` : "—"} tone={drillRow.saving > 0 ? "success" : "neutral"} />
                </div>
                <div>
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Supplier prices</p>
                  <div className="space-y-1.5">
                    <PriceRow supplier="CCF" price={drillRow.ccf} best={drillRow.best === "ccf"} />
                    <PriceRow supplier="Minster" price={drillRow.minster} best={drillRow.best === "minster"} />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Mapping confidence</p>
                  <div className="rounded-md border border-[var(--ink-200)] p-3 text-[12px] text-[var(--ink-700)]">
                    {drillRow.best === "review"
                      ? <>Multiple price-list matches. Manual review needed before pricing this item.</>
                      : <>Auto-matched at <strong>92% confidence</strong> from supplier price list line.</>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDrillRow(null)}>Close</Button>
                {drillRow.best === "review" && <Button onClick={() => { setReviewRow(drillRow); setDrillRow(null); }}>Resolve review</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline review modal */}
      <Dialog open={!!reviewRow} onOpenChange={(o) => !o && setReviewRow(null)}>
        <DialogContent>
          {reviewRow && (
            <>
              <DialogHeader>
                <DialogTitle>Resolve price for {reviewRow.name}</DialogTitle>
                <DialogDescription>{reviewRow.reviewNote ?? "Pick the correct supplier price."}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-[13px]">
                <button
                  onClick={() => { toast.success("CCF price assigned", { description: `£${(reviewRow.minster ?? 0).toFixed(2)}/${reviewRow.unit}` }); setReviewRow(null); }}
                  className="flex w-full items-center justify-between rounded-md border border-[var(--ink-200)] px-3 py-2 hover:border-[var(--green-600)]"
                >
                  <span><strong>Glasroc F FireCase 20mm</strong><br /><span className="text-[11px] text-[var(--ink-500)]">68% match · CCF</span></span>
                  <span className="font-mono">£17.85</span>
                </button>
                <button
                  onClick={() => { toast.success("Alternative match assigned"); setReviewRow(null); }}
                  className="flex w-full items-center justify-between rounded-md border border-[var(--ink-200)] px-3 py-2 hover:border-[var(--green-600)]"
                >
                  <span><strong>Glasroc S Multi-Board 20mm</strong><br /><span className="text-[11px] text-[var(--ink-500)]">52% match · Minster</span></span>
                  <span className="font-mono">£19.20</span>
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewRow(null)}>Cancel</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Optimise split modal */}
      <Dialog open={optimiseOpen} onOpenChange={setOptimiseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Optimised supplier split</DialogTitle>
            <DialogDescription>
              Splitting items between CCF and Minster saves <strong className="text-[var(--green-600)]">{fmtMoney(costedBoqKpi.totalSaving)}</strong> vs single supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <SplitRow supplier="CCF" items={allRows.filter(r => r.best === "ccf").length} value={costedBoqKpi.cheapest * 0.45} />
            <SplitRow supplier="Minster" items={allRows.filter(r => r.best === "minster").length} value={costedBoqKpi.cheapest * 0.55} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptimiseOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Split applied", { description: "Best-supplier prices saved to BoQ" }); setOptimiseOpen(false); }}>
              <Check className="mr-1.5 h-3.5 w-3.5" />Apply split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

function BoqRowCell({ row, selected, onToggle, onOpen, onReview }: {
  row: BoqRow; selected: boolean; onToggle: () => void; onOpen: () => void; onReview: () => void;
}) {
  const isReview = row.best === "review";
  const ccfBest = row.best === "ccf";
  const minBest = row.best === "minster";

  return (
    <tr className={cn("hover:bg-[var(--ink-50)]/60", isReview && "bg-[var(--amber-500)]/5", selected && "bg-[var(--accent-500)]/5")}>
      <td className="px-3 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-3.5 w-3.5 accent-[var(--accent-500)]" onClick={(e) => e.stopPropagation()} />
      </td>
      <td className="cursor-pointer px-4 py-3" onClick={onOpen}>
        <div className="flex items-start gap-2">
          {isReview && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--amber-500)]" />}
          <div>
            <p className="font-medium text-[var(--ink-900)] hover:text-[var(--accent-500)]">{row.name}</p>
            <p className={cn("text-[11px]", isReview ? "text-[var(--amber-500)] font-medium" : "text-[var(--ink-500)]")}>{row.subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-[var(--ink-700)]">{row.qty.toLocaleString()} {row.unit}</td>
      <td className="px-3 py-3 text-right font-mono text-[12.5px] tabular-nums">£{row.rate.toFixed(2)}</td>
      <td className={cn(
        "px-3 py-3 text-right font-mono text-[12.5px] tabular-nums",
        ccfBest && "border-l-2 border-[var(--green-600)] bg-gradient-to-r from-[var(--green-600)]/10 to-transparent font-semibold text-[var(--green-600)]",
        row.ccf && row.minster && row.ccf > row.minster && !ccfBest && "bg-[var(--red-500)]/5 text-[var(--ink-500)]",
      )}>
        {row.ccf !== null ? `£${row.ccf.toFixed(2)}` : "—"}
      </td>
      <td className={cn(
        "px-3 py-3 text-right font-mono text-[12.5px] tabular-nums",
        minBest && "border-l-2 border-[var(--green-600)] bg-gradient-to-r from-[var(--green-600)]/10 to-transparent font-semibold text-[var(--green-600)]",
        row.ccf && row.minster && row.minster > row.ccf && !minBest && "bg-[var(--red-500)]/5 text-[var(--ink-500)]",
      )}>
        {row.minster !== null ? `£${row.minster.toFixed(2)}` : "—"}
      </td>
      <td className="px-3 py-3 text-center">
        {isReview
          ? <button onClick={onReview} className="rounded-md bg-[var(--amber-500)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--amber-500)] hover:bg-[var(--amber-500)]/25">Review →</button>
          : <StatusBadge tone={ccfBest ? "success" : "info"}>{ccfBest ? "CCF" : "Minster"}</StatusBadge>}
      </td>
      <td className="px-3 py-3 text-right font-mono text-[12.5px] font-semibold tabular-nums text-[var(--green-600)]">
        {row.saving > 0 ? `–£${row.saving.toLocaleString()}` : "—"}
      </td>
    </tr>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "neutral" }) {
  return (
    <div className="rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className={cn("font-mono mt-1 text-[14px] font-semibold tabular-nums", tone === "success" ? "text-[var(--green-600)]" : "text-[var(--ink-900)]")}>{value}</p>
    </div>
  );
}

function PriceRow({ supplier, price, best }: { supplier: string; price: number | null; best: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]",
      best ? "border-[var(--green-600)] bg-[var(--green-600)]/5" : "border-[var(--ink-200)]",
    )}>
      <span className="font-medium">{supplier} {best && <Check className="ml-1 inline h-3 w-3 text-[var(--green-600)]" />}</span>
      <span className="font-mono">{price !== null ? `£${price.toFixed(2)}` : "—"}</span>
    </div>
  );
}

function SplitRow({ supplier, items, value }: { supplier: string; items: number; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--ink-200)] px-3 py-2.5">
      <div>
        <p className="font-medium text-[var(--ink-900)]">{supplier}</p>
        <p className="text-[11px] text-[var(--ink-500)]">{items} item{items === 1 ? "" : "s"} routed here</p>
      </div>
      <p className="font-mono text-[14px] font-semibold tabular-nums">{fmtMoney(value)}</p>
    </div>
  );
}

// Generate 82 rows by repeating + perturbing the base 7 — keeps it realistic
function generateRows(): BoqRow[] {
  const base = costedBoqRows;
  const out: BoqRow[] = [];
  for (let i = 0; i < 82; i++) {
    const src = base[i % base.length];
    if (i < base.length) { out.push({ ...src }); continue; }
    const factor = 0.85 + ((i * 13) % 30) / 100;
    out.push({
      ...src,
      code: `BQ-${100 + i}`,
      name: `${src.name}${i % 3 === 0 ? " (variant " + Math.floor(i / 3) + ")" : ""}`,
      qty: Math.round(src.qty * factor),
      saving: Math.round(src.saving * factor),
    });
  }
  return out;
}

// ============================================================================
// CustomSystemsPanel — shows systems added from the Calculator for this project
// ============================================================================
function CustomSystemsPanel({
  projectId, projectName, systems, lines,
}: {
  projectId: string;
  projectName: string;
  systems: ReturnType<typeof useProjectData>["systems"];
  lines: ReturnType<typeof useProjectData>["boqLines"];
}) {
  if (systems.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 px-4 py-3 text-[12.5px] text-[var(--ink-500)]">
        <div className="flex flex-wrap items-center gap-2">
          <CalcIcon className="h-3.5 w-3.5 text-[var(--accent-500)]" />
          <span>
            No systems added from the Calculator for <strong className="text-[var(--ink-900)]">{projectName}</strong> yet.
          </span>
          <Link to="/calculator" className="ml-auto inline-flex items-center gap-1 rounded bg-[var(--accent-500)] px-2 py-1 text-[11.5px] font-semibold text-white hover:opacity-90">
            Open Calculator →
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalcIcon className="h-3.5 w-3.5 text-[var(--accent-500)]" />
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
            Systems for {projectName} · from Calculator
          </p>
          <span className="rounded-full bg-[var(--accent-500)]/20 px-2 py-0.5 text-[10.5px] font-bold text-[var(--accent-500)]">
            {systems.length}
          </span>
        </div>
        <Link to="/calculator" className="text-[11.5px] font-semibold text-[var(--accent-500)] hover:underline">
          + Add another
        </Link>
      </div>
      <div className="space-y-1.5">
        {systems.map((s) => {
          const sysLines = lines.filter((l) => l.systemId === s.id);
          return (
            <div key={s.id} className="rounded bg-white px-3 py-2 text-[12.5px] shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--ink-900)]">{s.systemName}</p>
                  <p className="truncate text-[11px] text-[var(--ink-500)]">
                    {s.systemCode} · {s.lengthM}×{s.heightM} m ({s.areaM2.toFixed(1)} m²) · {s.boardSize} · {s.wastePct}% waste
                  </p>
                </div>
                <span className="shrink-0 rounded bg-[var(--ink-50)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--ink-700)]">
                  {sysLines.length} lines
                </span>
                <button
                  onClick={() => {
                    removeSystem(projectId, s.id);
                    toast.success("System removed");
                  }}
                  className="rounded p-1 text-[var(--ink-500)] hover:bg-[var(--red-500)]/10 hover:text-[var(--red-500)]"
                  aria-label="Remove system"
                  title="Remove from BoQ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <details className="mt-1.5">
                <summary className="cursor-pointer text-[11px] text-[var(--ink-500)] hover:text-[var(--ink-900)]">
                  Show {sysLines.length} BoQ lines
                </summary>
                <table className="mt-1.5 w-full text-[11.5px]">
                  <tbody className="divide-y divide-[var(--ink-200)]">
                    {sysLines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1 pr-2 text-[var(--ink-700)]">{l.material}</td>
                        <td className="py-1 pl-2 text-right font-mono tabular-nums text-[var(--ink-900)]">
                          {l.qty.toLocaleString()} {l.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
