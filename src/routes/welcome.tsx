import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Download,
  FileWarning,
  Percent,
  PenLine,
  Table2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

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
      {
        name: "twitter:card",
        content: "summary",
      },
    ],
    links: [{ rel: "canonical", href: "https://quantix-prime-flow.lovable.app/welcome" }],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink-900)]">
      {/* 1 + 2 — Top bar and hero share the dark navy band */}
      <div className="hero-glow sidebar-dot-pattern text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-7">
          <Wordmark />
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main">
            <Link to="/pricing" className="text-[13px] font-medium text-white/75 hover:text-white">
              Pricing
            </Link>
            <Link to="/login" className="text-[13px] font-medium text-white/75 hover:text-white">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center rounded-md bg-[var(--accent-500)] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Start free
            </Link>
          </nav>
        </header>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-7 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div className="min-w-0">
            <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight sm:text-[42px] lg:text-[46px]">
              Protect your margin on every drylining job — from estimate to final account.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
              Price the job from manufacturer systems, compare your merchants&rsquo; price lists on the same BoQ,
              and check every invoice against what was ordered and delivered.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-500)] px-5 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-md border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>

          <div className="min-w-0 max-w-full lg:justify-self-end lg:max-w-[560px]">
            <BoqMock />
          </div>
        </section>
      </div>

      {/* 3 — The problem */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-7 lg:py-20" aria-labelledby="problem">
        <h2 id="problem" className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
          Where the margin goes
        </h2>
        <p className="mt-2 max-w-2xl text-[14.5px] text-[var(--ink-500)]">
          Three quiet leaks that show up at final account, long after they could have been caught.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
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

      {/* 4 — How it works */}
      <section className="border-y border-[var(--ink-200)] bg-[var(--ink-50)]" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-7 lg:py-20">
          <h2 id="how" className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* 5 — Also included */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-7 lg:py-20" aria-labelledby="included">
        <h2 id="included" className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
          Also included
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureRow icon={<ClipboardList className="h-4 w-4" />} label="Variations log" />
          <FeatureRow icon={<FileWarning className="h-4 w-4" />} label="Daily site reports" />
          <FeatureRow icon={<CalendarDays className="h-4 w-4" />} label="Planner" />
          <FeatureRow icon={<TrendingUp className="h-4 w-4" />} label="Profit forecast" />
          <FeatureRow icon={<Users className="h-4 w-4" />} label="Team roles and permissions" />
          <FeatureRow icon={<Download className="h-4 w-4" />} label="CSV export" />
        </div>
      </section>

      {/* 6 — Who it's for */}
      <section className="border-t border-[var(--ink-200)] bg-[var(--ink-50)]" aria-labelledby="who">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-7 lg:py-20">
          <h2 id="who" className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
            Who it&rsquo;s for
          </h2>
          <p className="mt-2 max-w-2xl text-[14.5px] text-[var(--ink-500)]">
            Built for drylining, ceilings and interiors subcontractors — the people who carry the margin risk.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RoleCard role="Managing Director" line="Sees job margins as they move, not at year end — without chasing spreadsheets." />
            <RoleCard role="Commercial Director" line="Catches price drift and unpaid variations before they reach the final account." />
            <RoleCard role="Estimator / QS" line="Prices take-offs from real manufacturer systems and compares quotes on the same lines." />
            <RoleCard role="Buyer" line="Places call-offs against the priced BoQ and checks deliveries and invoices in one place." />
          </div>
        </div>
      </section>

      {/* 7 — Closing CTA */}
      <section className="hero-glow sidebar-dot-pattern text-white" aria-labelledby="cta">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-7 lg:py-20">
          <h2 id="cta" className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
            Start free — no card required
          </h2>
          <p className="max-w-xl text-[14.5px] text-white/70">
            Set up a workspace, price your first take-off and compare your merchants&rsquo; lists. No card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-500)] px-5 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-md border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — Footer */}
      <footer className="border-t border-[var(--ink-200)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <Wordmark dark />
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--ink-500)]" aria-label="Footer">
              <Link to="/pricing" className="hover:text-[var(--ink-900)]">Pricing</Link>
              <a href="/privacy" className="hover:text-[var(--ink-900)]">Privacy</a>
              <a href="/terms" className="hover:text-[var(--ink-900)]">Terms</a>
              <a href="/cookies" className="hover:text-[var(--ink-900)]">Cookies</a>
              <Link to="/login" className="hover:text-[var(--ink-900)]">Sign in</Link>
            </nav>
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-[var(--ink-500)]">
            FixMargin is a trading name of FixMargin Ltd. Registered in England and Wales, company number
            16680674.
          </p>
          <p className="mt-1 text-[12px] text-[var(--ink-500)]">© 2026 FixMargin Ltd.</p>
        </div>
      </footer>
    </div>
  );
}

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-500)] text-[10px] font-bold tracking-tight text-white"
        aria-hidden
      >
        FM
      </span>
      <span className={`font-display text-[17px] font-semibold tracking-tight ${dark ? "text-[var(--navy-900)]" : "text-white"}`}>
        FixMargin
      </span>
    </span>
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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-semibold text-white">Costed BoQ — Level 2 partitions</p>
        <span className="rounded border border-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Sample data
        </span>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-white">
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
        <Percent className="h-3 w-3" aria-hidden />
        Best mix across the three lists saves <strong className="font-mono-num text-white">£2,450</strong> on this BoQ
        — sample figures.
      </p>
    </div>
  );
}

function MockPrice({ value, best, total, note }: { value: string; best: boolean; total?: boolean; note?: string }) {
  return (
    <td className={`px-2 py-2 text-right font-mono-num ${total ? "px-3" : ""} ${best ? "font-semibold text-[var(--green-600)]" : "text-[var(--ink-700)]"}`}>
      {value}
      {note && <span className="ml-1 text-[9.5px] uppercase text-[var(--amber-500)]">{note}</span>}
      {best && !note && <span className="sr-only"> (best)</span>}
    </td>
  );
}

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--ink-200)] bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-500)]/10 text-[var(--accent-500)]">
        {icon}
      </div>
      <h3 className="mt-3 text-[14px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-500)]">{body}</p>
    </div>
  );
}

function StepCard({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="rounded-[10px] border border-[var(--ink-200)] bg-card p-5">
      <div className="flex items-center gap-2.5">
        <span className="step-badge" aria-hidden>{n}</span>
        <span className="text-[var(--accent-500)]" aria-hidden>{icon}</span>
      </div>
      <h3 className="mt-3 text-[14px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-500)]">{body}</p>
    </li>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-[var(--ink-200)] bg-card px-4 py-3.5">
      <span className="text-[var(--accent-500)]" aria-hidden>{icon}</span>
      <span className="text-[13.5px] font-medium">{label}</span>
    </div>
  );
}

function RoleCard({ role, line }: { role: string; line: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--ink-200)] bg-card p-5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--navy-950)] text-white" aria-hidden>
        <Users className="h-4 w-4" />
      </span>
      <h3 className="mt-3 text-[13.5px] font-semibold tracking-tight">{role}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-500)]">{line}</p>
    </div>
  );
}
