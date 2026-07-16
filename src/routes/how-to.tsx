import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, Check, ClipboardList, FileSpreadsheet, FolderKanban,
  GitBranch, LineChart, Receipt, Eye, Wrench, ShieldCheck, Crown,
  HardHat, Briefcase, UserCog, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCurrentUser, setCurrentUserId, type Tier,
} from "@/lib/currentUser";
import { team } from "@/lib/mockData";

export const Route = createFileRoute("/how-to")({
  head: () => ({
    meta: [
      { title: "Tour by role — Quantix Prime" },
      { name: "description", content: "Pick your role and see exactly what you can view, do, and the daily steps you should follow inside Quantix Prime." },
      { property: "og:title", content: "Tour by role — Quantix Prime" },
      { property: "og:description", content: "Role-based onboarding tour for Quantix Prime." },
    ],
  }),
  component: HowToPage,
});

type Step = {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

type RoleGuide = {
  tier: Tier;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;          // tailwind color class for accents
  mission: string;         // one sentence: why you're here
  canSee: string[];        // what you have visibility on
  canDo: string[];         // what you can act on
  cantDo: string[];        // explicit limits — manages expectations
  daily: Step[];           // ordered daily checklist
  // Suggested mock user to "try as"
  demoUserId: string;
};

const ROLES: RoleGuide[] = [
  {
    tier: "Operative",
    tagline: "On the tools — log what you did",
    icon: HardHat,
    accent: "amber",
    demoUserId: "mk",
    mission:
      "You're on site doing the work. Your job in Quantix Prime is to confirm your hours and see today's tasks — that's it. No paperwork, no commercials.",
    canSee: [
      "Today's planner tasks assigned to your trade",
      "Your own PW (price-work) rates",
      "The Daily Report for the day",
    ],
    canDo: [
      "Log your own labour hours / PW for today",
      "Mark a task as started or completed",
    ],
    cantDo: [
      "See project budgets, margins or financials",
      "Approve other people's hours",
      "Edit BoQ, variations or payments",
    ],
    daily: [
      { title: "Check today's tasks", body: "Open Planner — see what's assigned to you on the active project.", icon: ClipboardList, to: "/planner" },
      { title: "Log your hours", body: "Open Daily Report → Log labour. Submit before you leave site.", icon: ClipboardList, to: "/daily-report" },
    ],
  },
  {
    tier: "Pro",
    tagline: "Site Manager / Estimator — run the project",
    icon: Briefcase,
    accent: "indigo",
    demoUserId: "na",
    mission:
      "You run a project end-to-end on site. You raise call-offs, log dayworks, see the BoQ and lite financials (spent vs budget), but you don't sign invoices or approve hours.",
    canSee: [
      "Costed BoQ (read), Price Intelligence",
      "Spent-vs-budget (lite financials, no margins)",
      "Planner, Daily Report, Variations (read)",
      "Team & PW rates (read)",
      "Payments tab (read)",
    ],
    canDo: [
      "Create call-offs & log labour for others",
      "Edit Planner, run the Daily Report",
      "Manage specifications & system docs",
    ],
    cantDo: [
      "Approve call-offs / labour (needs Pro Control)",
      "Sign invoices or issue Payment Notices",
      "See full margins or edit BoQ pricing",
    ],
    daily: [
      { title: "Morning: Dashboard", body: "Check today's 3 priority actions.", icon: BookOpen, to: "/" },
      { title: "Plan the day", body: "Adjust sequencing in Planner, push tasks to crews.", icon: ClipboardList, to: "/planner" },
      { title: "Order materials", body: "Raise any Call-offs needed for tomorrow.", icon: FolderKanban, to: "/calloffs" },
      { title: "Close out site", body: "Verify the Daily Report submitted by the foreman.", icon: ClipboardList, to: "/daily-report" },
    ],
  },
  {
    tier: "Pro Control",
    tagline: "Commercial / QS — own the numbers",
    icon: ShieldCheck,
    accent: "emerald",
    demoUserId: "sm",
    mission:
      "You own the commercials. Approve call-offs and labour, edit BoQ pricing, sign invoices, raise variations, and run the JCT/NEC payment cycle — Application → Notice → Certificate.",
    canSee: [
      "Full Financial dashboard with margin & P&L",
      "Costed BoQ with full pricing",
      "Variations, Payments, Invoices, Cashflow",
      "Live labour cost vs budget",
    ],
    canDo: [
      "Approve call-offs & labour logs",
      "Edit BoQ, upload price lists, edit PW rates",
      "Sign invoices, raise & approve variations",
      "Submit Payment Applications & issue Payment Notices",
    ],
    cantDo: [
      "Manage users / billing (Admin only)",
      "Record final payment receipt (Admin only)",
    ],
    daily: [
      { title: "Sidebar urgent tasks", body: "Clear Critical items first (overdue invoices, pending approvals).", icon: ShieldCheck, to: "/" },
      { title: "Approvals queue", body: "Approve labour logs from the Daily Report.", icon: Check, to: "/daily-report" },
      { title: "Variations", body: "Move VOs Draft → Submitted → Approved.", icon: GitBranch, to: "/variations" },
      { title: "Payment cycle", body: "Issue Notices / certificates before the deadline.", icon: Receipt, to: "/projects" },
      { title: "Cashflow check", body: "Review confidence-weighted in/out for the next 30 days.", icon: LineChart, to: "/financial" },
    ],
  },
  {
    tier: "Admin",
    tagline: "MD / Owner — full visibility, full control",
    icon: Crown,
    accent: "violet",
    demoUserId: "dp",
    mission:
      "You see everything. Portfolio P&L, every project's health, all approvals. You also manage users, integrations and billing.",
    canSee: [
      "Everything Pro Control sees, plus…",
      "Portfolio Financial dashboard across projects",
      "User & permission management, integrations",
      "Audit of every approval & signature",
    ],
    canDo: [
      "All Pro Control actions",
      "Invite/remove users, change tiers & rates",
      "Record final payment receipts",
      "Configure integrations & company-wide settings",
    ],
    cantDo: [
      "(Nothing is hidden from Admin.)",
    ],
    daily: [
      { title: "Portfolio glance", body: "Open Financial — weighted margin, applied vs certified.", icon: LineChart, to: "/financial" },
      { title: "Project health", body: "Scan project list for risk/watch states.", icon: FolderKanban, to: "/projects" },
      { title: "Team & access", body: "Approve pending invites or rate changes.", icon: Users, to: "/team" },
    ],
  },
];

const ACCENT_CLASSES: Record<string, { ring: string; bg: string; text: string; chip: string }> = {
  amber:   { ring: "ring-amber-400/40",   bg: "bg-amber-400/10",   text: "text-amber-300",   chip: "bg-amber-400/15 text-amber-200 border-amber-400/30" },
  sky:     { ring: "ring-sky-400/40",     bg: "bg-sky-400/10",     text: "text-sky-300",     chip: "bg-sky-400/15 text-sky-200 border-sky-400/30" },
  indigo:  { ring: "ring-indigo-400/40",  bg: "bg-indigo-400/10",  text: "text-indigo-300",  chip: "bg-indigo-400/15 text-indigo-200 border-indigo-400/30" },
  emerald: { ring: "ring-emerald-400/40", bg: "bg-emerald-400/10", text: "text-emerald-300", chip: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30" },
  violet:  { ring: "ring-violet-400/40",  bg: "bg-violet-400/10",  text: "text-violet-300",  chip: "bg-violet-400/15 text-violet-200 border-violet-400/30" },
};

const STORAGE_KEY = "qp-howto-role-explored-v1";

function HowToPage() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const [activeTier, setActiveTier] = useState<Tier>(me.tier);
  const [explored, setExplored] = useState<Set<Tier>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setExplored(new Set(JSON.parse(raw) as Tier[]));
    } catch {}
    localStorage.setItem("qp-howto-seen-v1", "1");
  }, []);

  // sync once when the user changes (e.g. switched via header)
  useEffect(() => { setActiveTier(me.tier); }, [me.tier]);

  useEffect(() => {
    setExplored((prev) => {
      if (prev.has(activeTier)) return prev;
      const next = new Set(prev);
      next.add(activeTier);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, [activeTier]);

  const role = useMemo(
    () => ROLES.find((r) => r.tier === activeTier) ?? ROLES[2],
    [activeTier],
  );
  const accent = ACCENT_CLASSES[role.accent];
  const RoleIcon = role.icon;

  const tryAsRole = () => {
    setCurrentUserId(role.demoUserId);
  };

  const demoUser = team.find((t) => t.id === role.demoUserId);
  const isCurrent = me.tier === role.tier;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--accent-500)]">
            <BookOpen className="h-3 w-3" /> Tour by role
          </div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--ink-900)]">
            Pick your role. See exactly what you do here.
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-500)]">
            Five roles, five different views of Quantix Prime. Switch between them to compare — or "try as" the role to feel it live.
          </p>
        </div>
        <div className="text-right text-[12px] text-[var(--ink-500)]">
          <div className="font-semibold text-[var(--ink-900)]">
            {explored.size} / {ROLES.length} roles explored
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-1 text-[12px] text-[var(--ink-500)] underline-offset-2 hover:text-[var(--ink-900)] hover:underline"
          >
            Skip tour →
          </button>
        </div>
      </div>

      {/* Role selector */}
      <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const a = ACCENT_CLASSES[r.accent];
          const active = r.tier === activeTier;
          const done = explored.has(r.tier);
          return (
            <button
              key={r.tier}
              onClick={() => setActiveTier(r.tier)}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition-all",
                active
                  ? `border-transparent ${a.bg} ring-2 ${a.ring}`
                  : "border-[var(--ink-200)] bg-[var(--card)] hover:border-[var(--ink-700)]",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", a.bg, a.text)}>
                  <Icon className="h-4 w-4" />
                </span>
                {done && <Check className={cn("h-3.5 w-3.5", a.text)} />}
              </div>
              <div>
                <div className="font-display text-[14px] font-semibold text-[var(--ink-900)]">{r.tier}</div>
                <div className="text-[11.5px] text-[var(--ink-500)]">{r.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active role panel */}
      <div className={cn("overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--card)] shadow-sm")}>
        {/* Hero strip */}
        <div className={cn("flex flex-wrap items-center justify-between gap-4 px-6 py-5", accent.bg)}>
          <div className="flex items-center gap-3">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", accent.bg, accent.text, "ring-1", accent.ring)}>
              <RoleIcon className="h-6 w-6" />
            </span>
            <div>
              <div className={cn("text-[10.5px] font-bold uppercase tracking-wider", accent.text)}>
                Role · {role.tier}
              </div>
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-[var(--ink-900)]">
                {role.tagline}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCurrent ? (
              <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", accent.chip)}>
                You're signed in as this role
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={tryAsRole}>
                <UserCog className="mr-1.5 h-3.5 w-3.5" />
                Try as {demoUser?.name ?? role.tier}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-3">
          {/* Mission */}
          <div className="lg:col-span-3">
            <p className="text-[14px] leading-relaxed text-[var(--ink-700)]">
              {role.mission}
            </p>
          </div>

          {/* Can see */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <Eye className="h-3.5 w-3.5" /> What you can see
            </div>
            <ul className="space-y-1.5">
              {role.canSee.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--ink-700)]">
                  <Check className={cn("mt-[3px] h-3.5 w-3.5 shrink-0", accent.text)} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Can do */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <Wrench className="h-3.5 w-3.5" /> What you can do
            </div>
            <ul className="space-y-1.5">
              {role.canDo.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--ink-700)]">
                  <Check className={cn("mt-[3px] h-3.5 w-3.5 shrink-0", accent.text)} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Can't do */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Out of scope for you
            </div>
            <ul className="space-y-1.5">
              {role.cantDo.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--ink-500)]">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--ink-300)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Daily checklist */}
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
              <ClipboardList className="h-3.5 w-3.5" /> Your daily flow — do it in this order
            </div>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {role.daily.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="flex flex-col gap-2 rounded-lg border border-[var(--ink-200)] bg-[var(--ink-50)] p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", accent.bg, accent.text)}>
                        {i + 1}
                      </span>
                      <Icon className={cn("h-4 w-4", accent.text)} />
                      <span className="font-display text-[13.5px] font-semibold text-[var(--ink-900)]">
                        {s.title}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[var(--ink-700)]">{s.body}</p>
                    <Link
                      to={s.to as "/"}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--accent-500)] hover:underline"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-6 text-center text-[11.5px] text-[var(--ink-500)]">
        Tip: switch user any time from the avatar menu in the top header to land on a role-tailored dashboard.
      </p>
    </div>
  );
}
