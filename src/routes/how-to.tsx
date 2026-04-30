import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, FolderKanban, FileSpreadsheet, ClipboardList,
  GitBranch, Receipt, TrendingUp, LineChart, Sparkles, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import welcomeImg from "@/assets/howto/01-welcome.jpg";
import projectsImg from "@/assets/howto/02-projects.jpg";
import boqImg from "@/assets/howto/03-boq.jpg";
import dailyImg from "@/assets/howto/04-daily-report.jpg";
import variationsImg from "@/assets/howto/05-variations.jpg";
import paymentsImg from "@/assets/howto/06-payments.jpg";
import cashflowImg from "@/assets/howto/07-cashflow.jpg";
import financialImg from "@/assets/howto/08-financial.jpg";

export const Route = createFileRoute("/how-to")({
  head: () => ({
    meta: [
      { title: "How to use Quantix Prime — Interactive tour" },
      { name: "description", content: "A step-by-step interactive tour for new users: projects, BoQ, site reports, variations, payments, cashflow and financial dashboards." },
      { property: "og:title", content: "How to use Quantix Prime — Interactive tour" },
      { property: "og:description", content: "Step-by-step onboarding guide for Quantix Prime — UK construction intelligence platform." },
    ],
  }),
  component: HowToPage,
});

type Step = {
  n: number;
  title: string;
  blurb: string;
  body: string;
  bullets: string[];
  cta: { label: string; to: string; params?: Record<string, string> };
  image: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Pick your role",
    blurb: "Site or Commercial — the app reshapes itself.",
    body:
      "Use the sidebar toggle to switch between Site Manager (planner, daily reports, readiness) and Commercial Manager (BoQ, variations, financials). The navigation, dashboards and KPIs adapt automatically to what matters for each persona.",
    bullets: [
      "Site = planner, daily reports, material readiness",
      "Commercial = BoQ, variations, payments, financials",
      "Switch any time from the sidebar",
    ],
    cta: { label: "Open Dashboard", to: "/" },
    image: welcomeImg,
    icon: Sparkles,
  },
  {
    n: 2,
    title: "Open a project",
    blurb: "Every workflow lives inside a project.",
    body:
      "Pick an existing project (e.g. Hotel Fitzrovia) or create your own from the Projects screen. The breadcrumb project switcher follows you everywhere — change project once and the entire app re-scopes.",
    bullets: [
      "Browse all projects with budgets and progress",
      "Switch project from the top breadcrumb",
      "Create custom projects with your own data",
    ],
    cta: { label: "Browse Projects", to: "/projects" },
    image: projectsImg,
    icon: FolderKanban,
  },
  {
    n: 3,
    title: "Build a Costed BoQ",
    blurb: "Turn quantities into a priced bill in minutes.",
    body:
      "The Costed Bill of Quantities pulls rates from your price lists and labour settings. You see materials, labour, margin and totals live as you edit — the foundation for every commercial decision downstream.",
    bullets: [
      "Auto-priced from catalogue + price lists",
      "Live margin and total-cost breakdowns",
      "Feeds variations, applications and forecasts",
    ],
    cta: { label: "Open Costed BoQ", to: "/costed-boq" },
    image: boqImg,
    icon: FileSpreadsheet,
  },
  {
    n: 4,
    title: "Log Daily Site Reports",
    blurb: "Capture progress, manpower and weather from site.",
    body:
      "Site teams record daily activity — manpower, weather, progress photos, blockers. Reports flow into the planner and feed the readiness and labour analytics, so commercial decisions are based on what actually happened on site.",
    bullets: [
      "Manpower, weather and photo evidence",
      "Progress against the planner",
      "Auto-feeds labour cost analytics",
    ],
    cta: { label: "Open Daily Report", to: "/daily-report" },
    image: dailyImg,
    icon: ClipboardList,
  },
  {
    n: 5,
    title: "Track Variations",
    blurb: "Capture every change order — protect your margin.",
    body:
      "Log variations the moment they happen on site. Status flows from Submitted → Approved. Approved variations can be pulled directly into your next interim payment application — no double entry.",
    bullets: [
      "VO numbering and approval status",
      "Materials + labour + markup per VO",
      "One-click pull into payment applications",
    ],
    cta: { label: "Open Variations", to: "/variations" },
    image: variationsImg,
    icon: GitBranch,
  },
  {
    n: 6,
    title: "Run the Payment cycle",
    blurb: "Applications, Notices and Certificates — the JCT/NEC way.",
    body:
      "Inside each project, the Payments tab walks you through the interim payment cycle: submit an Application, issue a Payment Notice or Pay Less Notice, certify the final amount, and record the payment. Deadlines and outstanding amounts are tracked automatically.",
    bullets: [
      "Interim Payment Applications with line items",
      "Payment Notice & Pay Less Notice deadlines",
      "Certificates auto-mirror into invoice register",
    ],
    cta: { label: "See payments on a project", to: "/projects" },
    image: paymentsImg,
    icon: Receipt,
  },
  {
    n: 7,
    title: "Read your Cashflow",
    blurb: "Project incoming cash across 0–60 day buckets.",
    body:
      "The Cashflow Forecast aggregates certified amounts, submitted applications and outstanding invoices, weighted by confidence (95% certificates, 85% noticed, 70% submitted). Open it on a project or from the Financial dashboard.",
    bullets: [
      "0–7d, 8–14d, 15–30d, 30–60d buckets",
      "Confidence-weighted in/out totals",
      "Sources mixed: certificates, apps, invoices",
    ],
    cta: { label: "Open Financial dashboard", to: "/financial" },
    image: cashflowImg,
    icon: TrendingUp,
  },
  {
    n: 8,
    title: "See the big picture",
    blurb: "Portfolio-wide financials, pipelines and KPIs.",
    body:
      "The Financial dashboard rolls up every project: revenue, margin, applied vs certified, outstanding and the payment pipeline. Use it for board reviews, cash planning and to spot projects that need attention.",
    bullets: [
      "Portfolio KPIs across all projects",
      "Payment pipeline (applied → certified → paid)",
      "Cashflow forecast at portfolio level",
    ],
    cta: { label: "Open Financial", to: "/financial" },
    image: financialImg,
    icon: LineChart,
  },
];

const STORAGE_KEY = "qp-howto-completed-v1";

function HowToPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw) as number[]));
    } catch {}
    // mark onboarding as seen so we don't auto-redirect again
    localStorage.setItem("qp-howto-seen-v1", "1");
  }, []);

  const markDone = (n: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(n);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const step = STEPS[active];
  const Icon = step.icon;
  const isLast = active === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
            <BookOpen className="h-3 w-3" /> Onboarding tour
          </div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--ink-900)]">
            How to use Quantix Prime
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-500)]">
            Eight short steps — from picking a role to reading your portfolio cashflow.
          </p>
        </div>
        <div className="text-right text-[12px] text-[var(--ink-500)]">
          <div className="font-semibold text-[var(--ink-900)]">
            {completed.size} / {STEPS.length} done
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-1 text-[12px] text-[var(--ink-500)] underline-offset-2 hover:text-[var(--ink-900)] hover:underline"
          >
            Skip tour →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--ink-100)]">
        <div
          className="h-full rounded-full bg-[var(--accent-500)] transition-all duration-500"
          style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Steps rail */}
        <ol className="hidden flex-col gap-1 lg:flex">
          {STEPS.map((s, i) => {
            const done = completed.has(s.n);
            const isActive = i === active;
            const SI = s.icon;
            return (
              <li key={s.n}>
                <button
                  onClick={() => setActive(i)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-[var(--accent-500)]/40 bg-[var(--accent-500)]/8"
                      : "border-transparent hover:bg-[var(--ink-50)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done
                        ? "bg-[var(--accent-500)] text-white"
                        : isActive
                          ? "bg-[var(--navy-950)] text-white"
                          : "bg-[var(--ink-100)] text-[var(--ink-500)]",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-[var(--ink-900)]">
                      {s.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-[var(--ink-500)]">
                      {s.blurb}
                    </span>
                  </span>
                  <SI className="h-4 w-4 shrink-0 text-[var(--ink-300)] group-hover:text-[var(--ink-700)]" />
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step content */}
        <article className="overflow-hidden rounded-lg border border-[var(--ink-200)] bg-[var(--card)] shadow-sm">
          <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--ink-50)]">
            <img
              src={step.image}
              alt={`Step ${step.n}: ${step.title}`}
              loading={active === 0 ? "eager" : "lazy"}
              width={1024}
              height={640}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-7">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
              <Icon className="h-3.5 w-3.5" />
              Step {step.n} of {STEPS.length}
            </div>
            <h2 className="font-display text-[22px] font-semibold tracking-tight text-[var(--ink-900)]">
              {step.title}
            </h2>
            <p className="mt-1.5 text-[14px] text-[var(--ink-500)]">{step.blurb}</p>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-700)]">{step.body}</p>

            <ul className="mt-4 space-y-1.5">
              {step.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--ink-700)]">
                  <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Mobile step indicator */}
            <div className="mt-5 flex items-center gap-1 lg:hidden">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i <= active ? "bg-[var(--accent-500)]" : "bg-[var(--ink-100)]",
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink-200)] pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActive((a) => Math.max(0, a - 1))}
                disabled={active === 0}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Link to={step.cta.to as "/"} params={step.cta.params as never}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markDone(step.n)}
                  >
                    {step.cta.label}
                  </Button>
                </Link>
                {!isLast ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      markDone(step.n);
                      setActive((a) => Math.min(STEPS.length - 1, a + 1));
                    }}
                  >
                    Next <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      markDone(step.n);
                      navigate({ to: "/" });
                    }}
                  >
                    Finish <Check className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}