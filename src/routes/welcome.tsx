import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Download,
  FileWarning,
  PenLine,
  Table2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "FixMargin — Cost control for UK drylining and interiors subcontractors" },
      {
        name: "description",
        content:
          "Price drylining jobs from manufacturer systems, compare merchant price lists on the same BoQ, and check every invoice before you pay.",
      },
      {
        property: "og:title",
        content: "FixMargin — Cost control for UK drylining and interiors subcontractors",
      },
      {
        property: "og:description",
        content:
          "Price drylining jobs from manufacturer systems, compare merchant price lists on the same BoQ, and check every invoice before you pay.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://quantix-prime-flow.lovable.app/welcome" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://quantix-prime-flow.lovable.app/welcome" }],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink-900)] antialiased">
      {/* Top bar — sticky, navy */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--navy-950)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link to="/welcome" aria-label="FixMargin home">
            <Logo light />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <Link
              to="/pricing"
              className="rounded-md px-3 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="ml-1 inline-flex items-center rounded-md bg-[var(--accent-500)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — dark navy band */}
      <section className="hero-glow sidebar-dot-pattern bg-[var(--navy-950)] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-7 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-medium tracking-wide text-white/70">
              For UK drylining, ceilings &amp; interiors subcontractors
            </p>
            <h1 className="mt-6 font-display text-[34px] font-semibold leading-[1.12] tracking-tight sm:text-[44px] lg:text-[50px]">
              Protect your margin on every job — from estimate to final account.
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
              Price the job from manufacturer systems, compare your merchants&rsquo; price lists on
              the same BoQ, and check every invoice against what was ordered and delivered.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-500)] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-md border border-white/20 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-white/50">No card required.</p>
          </div>

          <div className="min-w-0 max-w-full lg:justify-self-end lg:max-w-[580px]">
            <BoqMock />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 lg:py-24" aria-labelledby="problem">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-500)]">
            The problem
          </p>
          <h2
            id="problem"
            className="mt-3 font-display text-[28px] font-semibold tracking-tight sm:text-[34px]"
          >
            Where the margin goes
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-500)]">
            Three quiet leaks that show up at final account, long after they could have been caught.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <ProblemCard
            icon={<Coins className="h-5 w-5" />}
            title="Merchant prices drift"
            body="Lists go up, pack sizes change and substitution lines creep in — and nobody re-checks them against the priced BoQ."
          />
          <ProblemCard
            icon={<FileWarning className="h-5 w-5" />}
            title="Invoices get paid unchecked"
            body="Invoices are paid without matching them against the order and the delivery note. Shortfalls and wrong rates slip through."
          />
          <ProblemCard
            icon={<TrendingDown className="h-5 w-5" />}
            title="Variations erode margin"
            body="Site changes and extra work happen before anyone prices them or logs the instruction — the cost lands on you."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[var(--ink-200)] bg-[var(--ink-50)]" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-500)]">
              How it works
            </p>
            <h2
              id="how"
              className="mt-3 font-display text-[28px] font-semibold tracking-tight sm:text-[34px]"
            >
              One thread from take-off to payment
            </h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StepCard
              n="1"
              icon={<PenLine className="h-4.5 w-4.5" />}
              title="Build the take-off"
              body="From Siniat, Knauf and British Gypsum systems — performance, boards, metal and accessories."
            />
            <StepCard
              n="2"
              icon={<Table2 className="h-4.5 w-4.5" />}
              title="Compare the price lists"
              body="One costed BoQ, priced against your merchants' own price lists, side by side on the same lines."
            />
            <StepCard
              n="3"
              icon={<Truck className="h-4.5 w-4.5" />}
              title="Track calls and deliveries"
              body="Call-offs and deliveries tracked against the order, with GRNs signed on site."
            />
            <StepCard
              n="4"
              icon={<CheckCircle2 className="h-4.5 w-4.5" />}
              title="Check before you pay"
              body="Every invoice checked against the order and the delivery before it goes for payment."
            />
          </ol>
        </div>
      </section>

      {/* Also included */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 lg:py-24" aria-labelledby="included">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-500)]">
            Also included
          </p>
          <h2
            id="included"
            className="mt-3 font-display text-[28px] font-semibold tracking-tight sm:text-[34px]"
          >
            The rest of the job, in the same place
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureRow icon={<ClipboardList className="h-4 w-4" />} label="Variations log" />
          <FeatureRow icon={<FileWarning className="h-4 w-4" />} label="Daily site reports" />
          <FeatureRow icon={<CalendarDays className="h-4 w-4" />} label="Planner" />
          <FeatureRow icon={<TrendingUp className="h-4 w-4" />} label="Profit forecast" />
          <FeatureRow icon={<Users className="h-4 w-4" />} label="Team roles and permissions" />
          <FeatureRow icon={<Download className="h-4 w-4" />} label="CSV export" />
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-[var(--ink-200)] bg-[var(--ink-50)]" aria-labelledby="who">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-500)]">
              Who it&rsquo;s for
            </p>
            <h2
              id="who"
              className="mt-3 font-display text-[28px] font-semibold tracking-tight sm:text-[34px]"
            >
              Built for the people who carry the margin risk
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-500)]">
              Drylining, ceilings and interiors subcontractors, roughly £2–25M turnover.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <RoleCard
              role="Managing Director"
              line="Sees job margins as they move, not at year end — without chasing spreadsheets."
            />
            <RoleCard
              role="Commercial Director"
              line="Catches price drift and unpaid variations before they reach the final account."
            />
            <RoleCard
              role="Estimator / QS"
              line="Prices take-offs from real manufacturer systems and compares quotes on the same lines."
            />
            <RoleCard
              role="Buyer"
              line="Places call-offs against the priced BoQ and checks deliveries and invoices in one place."
            />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="hero-glow sidebar-dot-pattern bg-[var(--navy-950)] text-white" aria-labelledby="cta">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-20 text-center sm:px-7 lg:py-24">
          <h2
            id="cta"
            className="font-display text-[28px] font-semibold tracking-tight sm:text-[34px]"
          >
            Start free — no card required
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/70">
            Set up a workspace, price your first take-off and compare your merchants&rsquo; lists.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-500)] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-md border border-white/20 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--ink-200)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <Logo />
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--ink-500)]"
              aria-label="Footer"
            >
              <Link to="/pricing" className="transition-colors hover:text-[var(--ink-900)]">
                Pricing
              </Link>
              <a href="/privacy" className="transition-colors hover:text-[var(--ink-900)]">
                Privacy
              </a>
              <a href="/terms" className="transition-colors hover:text-[var(--ink-900)]">
                Terms
              </a>
              <a href="/cookies" className="transition-colors hover:text-[var(--ink-900)]">
                Cookies
              </a>
              <Link to="/login" className="transition-colors hover:text-[var(--ink-900)]">
                Sign in
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-[var(--ink-200)] pt-6">
            <p className="text-[12px] leading-relaxed text-[var(--ink-500)]">
              FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales,
              company number 16680674.
            </p>
            <p className="mt-1 text-[12px] text-[var(--ink-500)]">© 2026 Quantix Prime Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- Hero product visual: costed BoQ with suppliers compared (HTML/CSS mock) --- */

const MOCK_ROWS = [
  { item: "Gyproc WallBoard 12.5", qty: "284 sheets", n: "£8.85", c: "£9.60", m: "£10.30", best: "n" },
  { item: "Gypframe 70 S 50 C stud 3000", qty: "829 nr", n: "—", c: "£4.15", m: "£4.55", best: "c" },
  { item: "Gyproc FireLine 15", qty: "321 sheets", n: "£15.40", c: "£15.90", m: "£14.10", best: "m" },
];

function BoqMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-500)]/20 text-[var(--accent-100)]">
            <Table2 className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-[12.5px] font-semibold text-white">Costed BoQ — Level 2 partitions</p>
        </div>
        <span className="rounded border border-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Sample data
        </span>
      </div>
      <div className="mt-3 w-full max-w-full overflow-x-auto rounded-lg border border-white/10 bg-white">
        <table className="w-full min-w-[440px] text-[11.5px]">
          <thead className="bg-[var(--ink-50)] text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Material</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 text-right font-medium">Northway</th>
              <th className="px-2 py-2 text-right font-medium">Castlegate</th>
              <th className="px-3 py-2 text-right font-medium">Meridian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-200)]">
            {MOCK_ROWS.map((r) => (
              <tr key={r.item}>
                <td className="px-3 py-2 font-medium text-[var(--ink-900)]">{r.item}</td>
                <td className="px-2 py-2 text-right font-mono-num text-[var(--ink-500)]">{r.qty}</td>
                <MockPrice value={r.n} best={r.best === "n"} />
                <MockPrice value={r.c} best={r.best === "c"} />
                <MockPrice value={r.m} best={r.best === "m"} />
              </tr>
            ))}
            <tr className="bg-[var(--ink-50)]">
              <td className="px-3 py-2 font-semibold text-[var(--ink-900)]">BoQ total</td>
              <td />
              <MockPrice value="£37,354" best={false} total note="incomplete" />
              <MockPrice value="£37,347" best={false} total />
              <MockPrice value="£37,187" best total />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-white/60">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Best mix across the three lists saves{" "}
        <strong className="font-mono-num text-white">£2,450</strong> on this BoQ — sample figures.
      </p>
    </div>
  );
}

function MockPrice({
  value,
  best,
  total,
  note,
}: {
  value: string;
  best: boolean;
  total?: boolean;
  note?: string;
}) {
  return (
    <td
      className={`px-2 py-2 text-right font-mono-num ${total ? "px-3" : ""} ${
        best ? "font-semibold text-[var(--green-600)]" : "text-[var(--ink-700)]"
      }`}
    >
      {value}
      {note && <span className="ml-1 text-[9.5px] uppercase text-[var(--amber-500)]">{note}</span>}
      {best && !note && <span className="sr-only"> (best)</span>}
    </td>
  );
}

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--ink-200)] bg-card p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-500)]/10 text-[var(--accent-500)]">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-500)]">{body}</p>
    </div>
  );
}

function StepCard({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl border border-[var(--ink-200)] bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="step-badge" aria-hidden>
          {n}
        </span>
        <span className="text-[var(--accent-500)]" aria-hidden>
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-500)]">{body}</p>
    </li>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-card px-5 py-4 shadow-sm">
      <span className="text-[var(--accent-500)]" aria-hidden>
        {icon}
      </span>
      <span className="text-[13.5px] font-medium">{label}</span>
    </div>
  );
}

function RoleCard({ role, line }: { role: string; line: string }) {
  return (
    <div className="rounded-xl border border-[var(--ink-200)] bg-card p-6 shadow-sm">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--navy-950)] text-white"
        aria-hidden
      >
        <Users className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-[14px] font-semibold tracking-tight">{role}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-500)]">{line}</p>
    </div>
  );
}
