import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileWarning,
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
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap",
      },
      { rel: "canonical", href: "https://quantix-prime-flow.lovable.app/welcome" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div
      className="min-h-screen bg-white text-[#0A1D33] antialiased"
      style={{ fontFamily: "'Lato', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Top bar — navy */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A1D33]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link to="/welcome" aria-label="FixMargin home">
            <Logo light />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <Link
              to="/pricing"
              className="rounded-md px-3 py-2 text-[13px] font-bold text-white/70 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-[13px] font-bold text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="ml-1 inline-flex items-center rounded bg-[#2563EB] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#1d4fd8]"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — navy, BoQ comparison right */}
      <section className="hero-glow sidebar-dot-pattern bg-[#0A1D33] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-7 lg:grid-cols-2 lg:pb-28 lg:pt-20">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded bg-[#2563EB]/20 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-[#7ea6f5]">
              <span className="h-2 w-2 rounded-full bg-[#2563EB] motion-safe:animate-pulse" aria-hidden />
              For UK drylining, ceilings &amp; interiors subcontractors
            </p>
            <h1 className="mt-6 text-[36px] font-black leading-[1.08] tracking-tight sm:text-[46px] lg:text-[54px]">
              Protect the margin you priced — from{" "}
              <span className="text-[#4f83f0]">estimate to final account.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300">
              Price the job from manufacturer systems, compare your merchants&rsquo; price lists on
              the same BoQ, and check every invoice against what was ordered and delivered — in one
              place.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded bg-[#2563EB] px-7 py-3.5 text-[14px] font-bold text-white shadow-lg transition-colors hover:bg-[#1d4fd8]"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded border border-slate-600 px-7 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-[12.5px] text-white/50">No card required.</p>
          </div>

          <div className="min-w-0 max-w-full lg:justify-self-end">
            <BoqMock />
          </div>
        </div>
      </section>

      {/* The problem — light band, white cards */}
      <section className="bg-[#F1F5F9]" aria-labelledby="problem">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="problem" className="text-[28px] font-black tracking-tight sm:text-[34px]">
              Where drylining margin quietly goes
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-[#2563EB]" aria-hidden />
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--ink-500)]">
              Three leaks that are hard to see week to week — and expensive at final account.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <ProblemCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Merchant prices drift"
              body="Price lists go up, pack sizes change and substitution lines creep in — and nobody re-checks them against the priced BoQ until the money is gone."
            />
            <ProblemCard
              icon={<FileWarning className="h-5 w-5" />}
              title="Invoices get paid unchecked"
              body="Invoices are paid without matching them against the order and the delivery note. Shortfalls, wrong rates and unordered lines slip through."
            />
            <ProblemCard
              icon={<TrendingDown className="h-5 w-5" />}
              title="Variations erode margin"
              body="Site changes and extra work happen before anyone prices them or logs the instruction — and the cost lands on you at final account."
            />
          </div>
        </div>
      </section>

      {/* How it works — zigzag with ghost numbers and real mocks */}
      <section className="bg-white" aria-labelledby="how">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="how" className="text-[28px] font-black tracking-tight sm:text-[34px]">
              One thread from take-off to payment
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-500)]">
              Every step works off the same costed BoQ — nothing gets re-keyed, nothing gets lost
              between spreadsheet and site.
            </p>
          </div>

          <div className="mt-16 space-y-20 lg:space-y-28">
            <ZigRow n="01" title="Build the take-off from the system" mock={<TakeoffMock />}>
              Work from Siniat, Knauf and British Gypsum specifications — performance, boards, metal
              and accessories. FixMargin turns the system into a material list and quantities, so
              the priced BoQ matches what the site will actually build.
            </ZigRow>
            <ZigRow reverse n="02" title="Compare merchants on the same BoQ" mock={<ComparisonMock />}>
              Upload your merchants&rsquo; price lists and FixMargin prices the same lines against
              each one — best price highlighted line by line, with the best mix across suppliers
              shown alongside the single-list totals.
            </ZigRow>
            <ZigRow n="03" title="Track call-offs and deliveries" mock={<CalloffMock />}>
              Place call-offs against the priced BoQ and track what was actually delivered, with
              GRNs signed on site. When a delivery falls short, you know the same day — not at
              invoice time.
            </ZigRow>
            <ZigRow reverse n="04" title="Check every invoice before you pay" mock={<InvoiceMock />}>
              Invoices are checked against the order and the delivery before payment. Quantity and
              rate checked line by line, differences flagged, disputes opened with the evidence
              already attached.
            </ZigRow>
          </div>
        </div>
      </section>

      {/* Also included */}
      <section className="bg-[#F1F5F9]" aria-labelledby="included">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="included" className="text-[28px] font-black tracking-tight sm:text-[34px]">
              Also included
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-[#2563EB]" aria-hidden />
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureRow icon={<ClipboardList className="h-4 w-4" />} label="Variations log" />
            <FeatureRow icon={<FileWarning className="h-4 w-4" />} label="Daily site reports" />
            <FeatureRow icon={<CalendarDays className="h-4 w-4" />} label="Planner" />
            <FeatureRow icon={<TrendingUp className="h-4 w-4" />} label="Profit forecast" />
            <FeatureRow icon={<Users className="h-4 w-4" />} label="Team roles and permissions" />
            <FeatureRow icon={<Download className="h-4 w-4" />} label="CSV export" />
          </div>
        </div>
      </section>

      {/* Who it's for — navy band */}
      <section className="bg-[#0A1D33] text-white" aria-labelledby="who">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="who" className="text-[28px] font-black tracking-tight sm:text-[34px]">
              Built for the people who carry the margin
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
              Drylining, ceilings and interiors subcontractors, roughly £2–25M turnover.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Closing CTA — blue card with soft glow */}
      <section className="bg-white" aria-labelledby="cta">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-7 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-[#2563EB] p-10 text-center text-white shadow-2xl shadow-[#2563EB]/30 sm:p-14">
            <div
              className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h2 id="cta" className="text-[30px] font-black tracking-tight sm:text-[36px]">
                Stop margin erosion before it starts
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-blue-100">
                Set up a workspace, price your first take-off and compare your merchants&rsquo;
                lists — free, no card required.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded bg-white px-8 py-3.5 text-[14px] font-black text-[#2563EB] shadow-xl transition-transform hover:scale-[1.03] motion-safe:transition-transform"
                >
                  Start free — no card required <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center rounded border border-white/50 px-8 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
                >
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <Logo />
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-bold text-slate-500"
              aria-label="Footer"
            >
              <Link to="/pricing" className="transition-colors hover:text-[#2563EB]">
                Pricing
              </Link>
              <a href="/privacy" className="transition-colors hover:text-[#2563EB]">
                Privacy
              </a>
              <a href="/terms" className="transition-colors hover:text-[#2563EB]">
                Terms
              </a>
              <a href="/cookies" className="transition-colors hover:text-[#2563EB]">
                Cookies
              </a>
              <Link to="/login" className="transition-colors hover:text-[#2563EB]">
                Sign in
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-[12px] leading-relaxed text-slate-500">
              FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales,
              company number 16680674.
            </p>
            <p className="mt-1 text-[12px] text-slate-400">© 2026 Quantix Prime Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- Zigzag row --- */

function ZigRow({
  n,
  title,
  mock,
  reverse,
  children,
}: {
  n: string;
  title: string;
  mock: React.ReactNode;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-10 lg:gap-16 ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[64px] font-black leading-none text-[#2563EB] opacity-20" aria-hidden>
          {n}
        </p>
        <h3 className="mt-2 text-[22px] font-black tracking-tight sm:text-[26px]">{title}</h3>
        <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--ink-500)]">
          {children}
        </p>
      </div>
      <div className="min-w-0 flex-1">{mock}</div>
    </div>
  );
}

function MockFrame({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-inner sm:p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {label && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-[var(--ink-900)]">{label}</p>
            <span className="rounded border border-slate-300 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
              Sample data
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* --- Hero: costed BoQ with suppliers compared --- */

const MOCK_ROWS = [
  { item: "Gyproc WallBoard 12.5", qty: "284 sheets", n: "£8.85", c: "£9.60", m: "£10.30", best: "n" },
  { item: "Gypframe 70 S 50 C stud 3000", qty: "829 nr", n: "—", c: "£4.15", m: "£4.55", best: "c" },
  { item: "Gyproc FireLine 15", qty: "321 sheets", n: "£15.40", c: "£15.90", m: "£14.10", best: "m" },
];

function BoqMock() {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#0F2847] p-5 shadow-2xl shadow-black/40 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-bold text-slate-300">
          Costed BoQ — Level 2 partitions
        </p>
        <span className="rounded border border-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Sample data
        </span>
      </div>
      <div className="mt-4 w-full max-w-full overflow-x-auto rounded-lg border border-slate-700 bg-white">
        <table className="w-full min-w-[460px] text-[11.5px]">
          <thead className="bg-[#F1F5F9] text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-bold">Material</th>
              <th className="px-2 py-2.5 text-right font-bold">Qty</th>
              <th className="px-2 py-2.5 text-right font-bold">Northway</th>
              <th className="px-2 py-2.5 text-right font-bold">Castlegate</th>
              <th className="px-3 py-2.5 text-right font-bold">Meridian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_ROWS.map((r) => (
              <tr key={r.item}>
                <td className="px-3 py-2.5 font-bold text-[#0A1D33]">{r.item}</td>
                <td className="px-2 py-2.5 text-right font-mono-num text-slate-500">{r.qty}</td>
                <MockPrice value={r.n} best={r.best === "n"} />
                <MockPrice value={r.c} best={r.best === "c"} />
                <MockPrice value={r.m} best={r.best === "m"} />
              </tr>
            ))}
            <tr className="bg-[#F1F5F9]">
              <td className="px-3 py-2.5 font-bold text-[#0A1D33]">BoQ total</td>
              <td />
              <MockPrice value="£37,354" best={false} total note="incomplete" />
              <MockPrice value="£37,347" best={false} total />
              <MockPrice value="£37,187" best total />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-800/60 px-4 py-3">
        <span className="text-[12.5px] text-slate-400">Best mix across the three lists</span>
        <span className="font-mono-num text-[15px] font-bold text-green-400">saves £2,450</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Sample figures — every name is fictional.</p>
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
      className={`font-mono-num text-right ${total ? "px-3" : "px-2"} py-2.5 ${
        best ? "font-bold text-green-600" : "text-slate-600"
      }`}
    >
      {value}
      {note && <span className="ml-1 text-[9.5px] font-bold uppercase text-amber-500">{note}</span>}
      {best && !note && <span className="sr-only"> (best)</span>}
    </td>
  );
}

/* --- Step 1 mock: manufacturer system take-off --- */

function TakeoffMock() {
  const lines = [
    "1× Gyproc SoundBloc 12.5, each side",
    "Gypframe 70 S 50 C studs @ 600 centres",
    "Isover APR 1200, 50 mm",
    "Gypframe 72 DC 60 channel, head & base",
  ];
  return (
    <MockFrame label="System W2 — sound partition, from specification">
      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l} className="flex items-start gap-2 text-[12.5px] text-slate-600">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" aria-hidden />
            {l}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F1F5F9] px-3 py-2.5">
        <span className="text-[11.5px] font-bold text-slate-500">Material list generated</span>
        <span className="font-mono-num text-[12px] font-bold text-[#0A1D33]">
          829 studs · 1,128 boards
        </span>
      </div>
    </MockFrame>
  );
}

/* --- Step 2 mock: merchant comparison grid --- */

function ComparisonMock() {
  return (
    <MockFrame label="Same lines, three price lists">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[340px] text-[11.5px]">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2 text-left font-bold">Material</th>
              <th className="py-2 text-right font-bold">Castlegate</th>
              <th className="py-2 text-right font-bold">Meridian</th>
              <th className="py-2 text-right font-bold">Northway</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_ROWS.map((r) => (
              <tr key={r.item}>
                <td className="py-2.5 pr-2 font-bold text-[#0A1D33]">{r.item}</td>
                <PriceCell value={r.c} best={r.best === "c"} />
                <PriceCell value={r.m} best={r.best === "m"} />
                <PriceCell value={r.n} best={r.best === "n"} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5">
        <span className="text-[11.5px] font-bold text-green-700">Best mix across suppliers</span>
        <span className="font-mono-num text-[12px] font-bold text-green-700">
          £34,737 · saves £2,450
        </span>
      </div>
    </MockFrame>
  );
}

function PriceCell({ value, best }: { value: string; best: boolean }) {
  return (
    <td
      className={`font-mono-num py-2.5 text-right ${best ? "font-bold text-green-600" : "text-slate-600"}`}
    >
      {value}
      {best && <span className="sr-only"> (best)</span>}
    </td>
  );
}

/* --- Step 3 mock: call-offs and deliveries --- */

function CalloffMock() {
  const rows = [
    {
      ref: "CO-0001",
      supplier: "Castlegate",
      detail: "W2 boards + studs — North zone",
      status: "Delivered in full · GRN signed",
      ok: true,
    },
    {
      ref: "CO-0002",
      supplier: "Meridian",
      detail: "W3 FireLine 15 + APR — corridors",
      status: "240 ordered · 180 delivered",
      ok: false,
    },
  ];
  return (
    <MockFrame label="Call-offs against the priced BoQ">
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.ref} className="rounded-lg border border-slate-200 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono-num text-[11.5px] font-bold text-[#0A1D33]">
                {r.ref} · {r.supplier}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-bold ${
                  r.ok ? "text-green-600" : "text-amber-600"
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                ) : (
                  <FileWarning className="h-3 w-3" aria-hidden />
                )}
                {r.status}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-slate-500">{r.detail}</p>
          </li>
        ))}
      </ul>
<p className="mt-3 text-[11px] text-slate-500">
        Shortfall flagged to the buyer the same day, before the invoice arrives.
      </p>
    </MockFrame>
  );
}

/* --- Step 4 mock: invoice check --- */

function InvoiceMock() {
  const checks = [
    { label: "Quantity", detail: "240 sheets billed vs 180 delivered", flag: true },
    { label: "Rate", detail: "£14.90 billed vs £14.10 quoted", flag: true },
    { label: "Ordered lines", detail: "W3 FireLine 15 + Isover APR 1200", flag: false },
  ];
  return (
    <MockFrame label="Invoice MER-2048 vs order CO-0002">
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-[#0A1D33]">{c.label}</p>
              <p className="font-mono-num text-[11.5px] text-slate-500">{c.detail}</p>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                c.flag ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
              }`}
            >
              {c.flag ? "Flagged" : "OK"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F1F5F9] px-3 py-2.5">
        <span className="text-[11.5px] font-bold text-slate-500">Outcome</span>
        <span className="text-[11.5px] font-bold text-[#0A1D33]">
          Dispute opened — evidence attached
        </span>
      </div>
    </MockFrame>
  );
}

/* --- Section cards --- */

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
        {icon}
      </div>
      <h3 className="mt-5 text-[17px] font-black tracking-tight">{title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="text-[#2563EB]" aria-hidden>
        {icon}
      </span>
      <span className="text-[13.5px] font-bold">{label}</span>
    </div>
  );
}

function RoleCard({ role, line }: { role: string; line: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0F2847] p-7 transition-colors hover:border-[#2563EB]">
      <h3 className="text-[13px] font-black uppercase tracking-wide text-[#4f83f0]">{role}</h3>
      <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">{line}</p>
    </div>
  );
}
