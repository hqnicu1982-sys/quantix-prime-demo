import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, Check, ClipboardList, FileSpreadsheet, FolderKanban,
  GitBranch, LineChart, Receipt, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import shotDashboard from "@/assets/howto/shot-dashboard.png";
import shotProjects from "@/assets/howto/shot-projects.png";
import shotBoq from "@/assets/howto/shot-boq.png";
import shotDaily from "@/assets/howto/shot-daily.png";
import shotVariations from "@/assets/howto/shot-variations.png";
import shotPayments from "@/assets/howto/shot-payments.png";
import shotFinancial from "@/assets/howto/shot-financial.png";

export const Route = createFileRoute("/how-to")({
  head: () => ({
    meta: [
      { title: "How it works — Quantix Prime workflow map" },
      { name: "description", content: "Visual workflow map: Project → BoQ → Daily Reports → Variations → Payments → Cashflow. Click any node to see the screen and jump straight to it." },
      { property: "og:title", content: "How it works — Quantix Prime workflow map" },
      { property: "og:description", content: "Visual onboarding map for Quantix Prime — UK construction intelligence platform." },
    ],
  }),
  component: HowToPage,
});

type Node = {
  id: string;
  title: string;
  blurb: string;
  body: string;
  bullets: string[];
  cta: { label: string; to: string };
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  // grid position (col, row) on a 4x3 grid
  col: number;
  row: number;
};

const NODES: Node[] = [
  {
    id: "projects", title: "Projects", blurb: "Your scope of work",
    body: "Every workflow lives inside a project. Pick one (e.g. Hotel Fitzrovia) or create your own — the breadcrumb switcher follows you everywhere.",
    bullets: ["Browse all projects with budgets & progress", "Switch project from the breadcrumb", "Create custom projects with your own data"],
    cta: { label: "Browse Projects", to: "/projects" },
    image: shotProjects, icon: FolderKanban, col: 0, row: 0,
  },
  {
    id: "boq", title: "Costed BoQ", blurb: "Priced bill of quantities",
    body: "Auto-priced from your catalogue and live price lists (CCF, Minster, etc.). Live margin and total-cost breakdowns feed every commercial decision downstream.",
    bullets: ["Auto-priced from price lists", "Live margin & total-cost", "Feeds variations, applications, forecasts"],
    cta: { label: "Open Costed BoQ", to: "/costed-boq" },
    image: shotBoq, icon: FileSpreadsheet, col: 1, row: 0,
  },
  {
    id: "daily", title: "Daily Site Report", blurb: "What actually happened",
    body: "Site teams log manpower, weather, photos and progress. Reports flow into the planner and feed labour analytics — commercial decisions track reality.",
    bullets: ["Manpower, weather, photo evidence", "Progress against the planner", "Auto-feeds labour cost analytics"],
    cta: { label: "Open Daily Report", to: "/daily-report" },
    image: shotDaily, icon: ClipboardList, col: 2, row: 0,
  },
  {
    id: "variations", title: "Variations", blurb: "Change orders, audited",
    body: "Log VOs the moment they happen. Status flows Draft → Submitted → Approved. Approved VOs pull straight into your next interim payment application.",
    bullets: ["VO numbering & approval status", "Materials + labour + markup per VO", "One-click pull into payment apps"],
    cta: { label: "Open Variations", to: "/variations" },
    image: shotVariations, icon: GitBranch, col: 0, row: 1,
  },
  {
    id: "payments", title: "Payment Cycle", blurb: "Apps · Notices · Certs",
    body: "Inside each project, the Payments tab walks the JCT/NEC interim cycle: submit Application → issue Payment Notice or Pay Less Notice → certify → record payment. Deadlines tracked automatically.",
    bullets: ["Interim Payment Applications", "Payment Notice & Pay Less Notice deadlines", "Certificates auto-mirror to invoice register"],
    cta: { label: "See payments on a project", to: "/projects" },
    image: shotPayments, icon: Receipt, col: 1, row: 1,
  },
  {
    id: "cashflow", title: "Cashflow Forecast", blurb: "Confidence-weighted in/out",
    body: "Aggregates certified amounts, submitted applications and outstanding invoices, weighted by confidence (95% certs, 85% noticed, 70% submitted). Open it on a project or portfolio-wide.",
    bullets: ["0–7d, 8–14d, 15–30d, 30–60d buckets", "Sources: certificates, apps, invoices", "Confidence-weighted in/out totals"],
    cta: { label: "Open Financial dashboard", to: "/financial" },
    image: shotFinancial, icon: LineChart, col: 2, row: 1,
  },
  {
    id: "dashboard", title: "Dashboard & Financial", blurb: "Daily focus + portfolio P&L",
    body: "The Dashboard surfaces the 3 highest-impact actions for today. The Financial dashboard rolls up every project: revenue, margin, applied vs certified, outstanding and the payment pipeline.",
    bullets: ["Morning briefing with prioritised actions", "Portfolio KPIs across all projects", "Payment pipeline (applied → certified → paid)"],
    cta: { label: "Open Dashboard", to: "/" },
    image: shotDashboard, icon: BookOpen, col: 1, row: 2,
  },
];

// edges as id pairs
const EDGES: Array<[string, string]> = [
  ["projects", "boq"],
  ["boq", "daily"],
  ["projects", "variations"],
  ["boq", "payments"],
  ["daily", "payments"],
  ["variations", "payments"],
  ["payments", "cashflow"],
  ["cashflow", "dashboard"],
  ["payments", "dashboard"],
];

const STORAGE_KEY = "qp-howto-completed-v1";

function HowToPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw) as string[]));
    } catch {}
    localStorage.setItem("qp-howto-seen-v1", "1");
  }, []);

  const active = useMemo(() => NODES.find((n) => n.id === activeId) ?? null, [activeId]);

  const markDone = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  // grid: 3 cols × 3 rows. Map (col,row) → SVG center coords on a 900×520 viewBox
  const COLS = 3;
  const ROWS = 3;
  const VW = 900;
  const VH = 520;
  const padX = 110;
  const padY = 70;
  const stepX = (VW - padX * 2) / (COLS - 1);
  const stepY = (VH - padY * 2) / (ROWS - 1);
  const pos = (c: number, r: number) => ({ x: padX + c * stepX, y: padY + r * stepY });

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-7 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
            <BookOpen className="h-3 w-3" /> Workflow map
          </div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--ink-900)]">
            How it all connects
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-500)]">
            Click any node to see the real screen and jump straight to it.
          </p>
        </div>
        <div className="text-right text-[12px] text-[var(--ink-500)]">
          <div className="font-semibold text-[var(--ink-900)]">
            {completed.size} / {NODES.length} explored
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-1 text-[12px] text-[var(--ink-500)] underline-offset-2 hover:text-[var(--ink-900)] hover:underline"
          >
            Skip tour →
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--card)] p-3 shadow-sm sm:p-5">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="h-auto w-full"
          role="img"
          aria-label="Quantix Prime workflow map"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* Edges */}
          <g className="text-[var(--ink-300)]">
            {EDGES.map(([from, to]) => {
              const f = NODES.find((n) => n.id === from)!;
              const t = NODES.find((n) => n.id === to)!;
              const a = pos(f.col, f.row);
              const b = pos(t.col, t.row);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow)"
                  opacity={0.7}
                />
              );
            })}
          </g>

          {/* Nodes */}
          {NODES.map((n) => {
            const { x, y } = pos(n.col, n.row);
            const w = 200;
            const h = 84;
            const isActive = activeId === n.id;
            const isDone = completed.has(n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${x - w / 2}, ${y - h / 2})`}
                className="cursor-pointer"
                onClick={() => setActiveId(n.id)}
              >
                <rect
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  rx={10}
                  className={cn(
                    "transition-all",
                    isActive
                      ? "fill-[var(--accent-500)]/15 stroke-[var(--accent-500)]"
                      : isDone
                        ? "fill-[var(--accent-500)]/8 stroke-[var(--accent-500)]/40"
                        : "fill-[var(--ink-50)] stroke-[var(--ink-200)] hover:stroke-[var(--ink-700)]",
                  )}
                  strokeWidth={isActive ? 2 : 1.25}
                />
                <text
                  x={16}
                  y={32}
                  className="fill-[var(--ink-900)] font-semibold"
                  style={{ fontSize: "14px" }}
                >
                  {n.title}
                </text>
                <text
                  x={16}
                  y={54}
                  className="fill-[var(--ink-500)]"
                  style={{ fontSize: "11.5px" }}
                >
                  {n.blurb}
                </text>
                <text
                  x={16}
                  y={72}
                  className="fill-[var(--accent-500)] font-semibold"
                  style={{ fontSize: "10.5px", letterSpacing: "0.04em" }}
                >
                  {isDone ? "✓ EXPLORED · CLICK" : "CLICK TO EXPLORE →"}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-2 text-center text-[11.5px] text-[var(--ink-500)]">
          Arrows show how data flows between modules.
        </p>
      </div>

      {/* Quick links grid (mobile + accessibility fallback) */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {NODES.map((n) => {
          const Icon = n.icon;
          const isDone = completed.has(n.id);
          return (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
                activeId === n.id
                  ? "border-[var(--accent-500)]/40 bg-[var(--accent-500)]/8"
                  : "border-[var(--ink-200)] hover:bg-[var(--ink-50)]",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  isDone
                    ? "bg-[var(--accent-500)] text-white"
                    : "bg-[var(--ink-100)] text-[var(--ink-700)]",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-[var(--ink-900)]">
                  {n.title}
                </span>
                <span className="block truncate text-[11px] text-[var(--ink-500)]">
                  {n.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel (modal-like, inline) */}
      {active && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          onClick={() => setActiveId(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-xl border border-[var(--ink-200)] bg-[var(--card)] shadow-xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveId(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--ink-50)]">
              <img
                src={active.image}
                alt={`Screenshot of ${active.title}`}
                className="h-full w-full object-cover object-top"
              />
            </div>

            <div className="max-h-[40vh] overflow-y-auto p-5 sm:p-6">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
                <active.icon className="h-3.5 w-3.5" />
                {active.blurb}
              </div>
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-[var(--ink-900)]">
                {active.title}
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-700)]">
                {active.body}
              </p>
              <ul className="mt-3 space-y-1.5">
                {active.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--ink-700)]">
                    <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--ink-200)] pt-4">
                <Button variant="outline" size="sm" onClick={() => setActiveId(null)}>
                  Close
                </Button>
                <Link to={active.cta.to as "/"}>
                  <Button size="sm" onClick={() => markDone(active.id)}>
                    {active.cta.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
