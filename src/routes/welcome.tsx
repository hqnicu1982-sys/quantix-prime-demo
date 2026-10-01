import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileClock,
  FileDiff,
  FileSpreadsheet,
  HardHat,
  Layers3,
  LockKeyhole,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
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
          "Control estimating, procurement, site delivery, variations, invoices and margin in one place for UK interiors subcontractors.",
      },
      {
        property: "og:title",
        content: "FixMargin — Cost control for UK drylining and interiors subcontractors",
      },
      {
        property: "og:description",
        content:
          "Control estimating, procurement, site delivery, variations, invoices and margin in one place for UK interiors subcontractors.",
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

const workflow = [
  { label: "Estimate", detail: "Systems & take-off", state: "complete" },
  { label: "Procurement", detail: "Quotes & call-offs", state: "complete" },
  { label: "Site", detail: "Deliveries & reports", state: "warning" },
  { label: "Commercial", detail: "Variations & invoices", state: "warning" },
  { label: "Final account", detail: "Applications & retention", state: "live" },
];

const coverage = [
  { icon: FileDiff, title: "Drawing revisions", detail: "Track C0 onwards and see post-award impact." },
  { icon: HardHat, title: "Daily site reports", detail: "Labour, progress, delays and photo records." },
  { icon: CalendarClock, title: "Planner", detail: "Linked tasks, milestones and overdue work." },
  { icon: FileClock, title: "Variations", detail: "Instructions, values, status and evidence." },
  { icon: FileCheck2, title: "Payment applications", detail: "Applications, certificates and retention." },
  { icon: TrendingUp, title: "Profit forecast", detail: "Current cost, exposure and forecast margin." },
  { icon: ClipboardCheck, title: "Tender handoff", detail: "Carry the awarded baseline into delivery." },
  { icon: LockKeyhole, title: "Roles & permissions", detail: "Control access by commercial responsibility." },
  { icon: Download, title: "Practical exports", detail: "CSV, PDF and XLSX where the team needs them." },
];

function WelcomePage() {
  return (
    <div className="welcome-dark min-h-screen overflow-hidden bg-[var(--welcome-bg)] text-[var(--welcome-text)] antialiased [font-family:'Lato',ui-sans-serif,system-ui,sans-serif]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--welcome-bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link to="/welcome" aria-label="FixMargin home"><Logo light /></Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <Link to="/pricing" className="rounded-full px-3 py-2 text-[13px] font-bold text-white/60 transition-colors hover:text-white">Pricing</Link>
            <Link to="/login" className="rounded-full px-3 py-2 text-[13px] font-bold text-white/60 transition-colors hover:text-white">Sign in</Link>
            <Link to="/signup" className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/10 sm:px-5">Start free</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="welcome-aurora welcome-grid relative text-white">
          <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-7 lg:grid-cols-[0.86fr_1.14fr] lg:pb-24 lg:pt-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--welcome-blue)]/30 bg-[color:var(--welcome-blue)]/10 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--welcome-cyan)]">
                <span className="h-2 w-2 rounded-full bg-[var(--welcome-cyan)] shadow-[0_0_12px_var(--welcome-cyan)] motion-safe:animate-pulse" aria-hidden />
                Commercial control for UK interiors subcontractors
              </p>
              <h1 className="mt-7 text-[40px] font-black leading-[1.06] tracking-normal sm:text-[52px] lg:text-[64px]">
                Protect the margin you priced — from <span className="welcome-gradient-text">estimate to final account.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/58">
                Keep estimating, buying, site records, variations, invoices, programme and profit connected as the job moves.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-[var(--welcome-blue)] px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_0_30px_color-mix(in_oklab,var(--welcome-blue)_38%,transparent)] transition-transform hover:-translate-y-0.5">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/pricing" className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10">See pricing</Link>
              </div>
              <p className="mt-4 text-[12.5px] text-white/40">No card required.</p>
            </div>
            <ProjectControlMock />
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.025]" aria-labelledby="connected-control">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--welcome-cyan)]">One commercial record</p>
                <h2 id="connected-control" className="mt-2 text-[27px] font-black text-white sm:text-[34px]">Every handover stays connected</h2>
              </div>
              <p className="max-w-xl text-[14px] leading-relaxed text-white/45">The estimate becomes the buying baseline. Site records support the commercial position. The forecast reflects what is happening now.</p>
            </div>
            <div className="relative mt-10 grid gap-3 md:grid-cols-5">
              <div className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-transparent via-[var(--welcome-cyan)]/35 to-transparent md:block" aria-hidden />
              {workflow.map((item, index) => (
                <div key={item.label} className="welcome-glass relative rounded-xl px-4 py-4">
                  <div className="flex items-center gap-3 md:block">
                    <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black ${item.state === "warning" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-[color:var(--welcome-cyan)]/35 bg-[color:var(--welcome-cyan)]/10 text-[var(--welcome-cyan)]"}`}>
                      {item.state === "complete" ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div className="md:mt-3">
                      <p className="text-[12px] font-black text-white/85">{item.label}</p>
                      <p className="mt-0.5 text-[10.5px] text-white/38">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative bg-[var(--welcome-bg)]" aria-labelledby="control-workflow">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--welcome-cyan)]">Across the whole job</p>
              <h2 id="control-workflow" className="mt-3 text-[29px] font-black text-white sm:text-[38px]">Control the work, the evidence and the money</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-white/48">FixMargin follows the job beyond pricing. Each team sees the information it needs, while commercial control stays joined up.</p>
            </div>

            <div className="mt-16 space-y-16 lg:space-y-24">
              <StoryRow kicker="Estimate & procurement" title="Price what you will build. Buy against the same baseline." copy="Build the take-off from manufacturer systems, compare merchant price lists line by line, then raise call-offs against the awarded quantities." mock={<ProcurementMock />} />
              <StoryRow reverse kicker="Site delivery control" title="Know what arrived, what did not, and what held the work up." copy="Signed GRNs, daily reports and delay records give the office a current view of delivery and progress — while the evidence is still fresh." mock={<SiteMock />} />
              <StoryRow kicker="Commercial control" title="Turn site events into a protected commercial position." copy="Track instructions and unsigned work, match invoices to orders and deliveries, manage disputes, applications and retention in one record." mock={<CommercialMock />} />
              <StoryRow reverse kicker="Programme & margin" title="See delay and cost exposure before the final account." copy="Linked tasks, milestones, overdue actions and live commercial data feed the forecast, so the team can act while there is still time." mock={<ProgrammeMock />} />
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.035]" aria-labelledby="coverage">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--welcome-cyan)]">Operational coverage</p>
              <h2 id="coverage" className="mt-3 text-[29px] font-black text-white sm:text-[38px]">The controls around the core workflow</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.map(({ icon: Icon, title, detail }) => (
                <article key={title} className="welcome-glass group rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--welcome-blue)]/25 bg-[color:var(--welcome-blue)]/10 text-[var(--welcome-cyan)]"><Icon className="h-4 w-4" /></span>
                    <div><h3 className="text-[14px] font-black text-white/85">{title}</h3><p className="mt-1.5 text-[12.5px] leading-relaxed text-white/42">{detail}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--welcome-bg-soft)]" aria-labelledby="who">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="who" className="text-[29px] font-black text-white sm:text-[38px]">Built for the people who carry the margin</h2>
              <p className="mt-4 text-[15px] text-white/42">Drylining, ceilings and interiors subcontractors, roughly £2–25M turnover.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <RoleCard role="Managing Director" line="Sees live project health, exposure and forecast margin without waiting for month end." />
              <RoleCard role="Commercial Director" line="Controls variations, applications, invoice disputes and the route to final account." />
              <RoleCard role="Estimator / QS" line="Builds a traceable estimate, then follows value and risk as the job moves." />
              <RoleCard role="Buyer" line="Compares supply, controls call-offs and resolves delivery or invoice differences." />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[var(--welcome-bg)]" aria-labelledby="cta">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-7 lg:py-24">
            <div className="welcome-cta relative overflow-hidden rounded-3xl border border-[color:var(--welcome-cyan)]/25 p-10 text-center sm:p-14">
              <div className="absolute inset-x-[15%] -bottom-24 h-44 bg-[color:var(--welcome-cyan)]/10 blur-3xl" aria-hidden />
              <div className="relative">
                <h2 id="cta" className="text-[30px] font-black text-white sm:text-[36px]">Keep control from tender to final account</h2>
                <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/55">Set up your workspace and bring estimating, procurement, site and commercial records into one project view.</p>
                <div className="mt-9 flex flex-wrap justify-center gap-4">
                  <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-[var(--welcome-blue)] px-8 py-3.5 text-[14px] font-black text-white shadow-[0_0_30px_color-mix(in_oklab,var(--welcome-blue)_40%,transparent)] transition-transform hover:scale-[1.03]">Start free — no card required <ArrowRight className="h-4 w-4" /></Link>
                  <Link to="/pricing" className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10">Compare plans</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[var(--welcome-bg)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <Logo />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-bold text-white/40" aria-label="Footer">
              <Link to="/pricing" className="hover:text-[var(--welcome-cyan)]">Pricing</Link><a href="/privacy" className="hover:text-[var(--welcome-cyan)]">Privacy</a><a href="/terms" className="hover:text-[var(--welcome-cyan)]">Terms</a><a href="/cookies" className="hover:text-[var(--welcome-cyan)]">Cookies</a><Link to="/login" className="hover:text-[var(--welcome-cyan)]">Sign in</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-[12px] leading-relaxed text-white/35">
            <p>FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales, company number 16680674.</p>
            <p className="mt-1 text-white/25">© 2026 Quantix Prime Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SampleLabel() {
  return <span className="rounded-full border border-[color:var(--welcome-cyan)]/25 bg-[color:var(--welcome-cyan)]/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--welcome-cyan)]">Sample data</span>;
}

function ProjectControlMock() {
  return (
    <div className="relative min-w-0 lg:justify-self-end">
      <div className="welcome-glass relative rounded-2xl p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/35">Project control</p><p className="mt-1 text-[14px] font-black text-white/85">Harbour Yard Offices — Levels 2–3</p></div><SampleLabel />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Progress" value="42%" note="8 weeks remain" />
          <Metric label="Forecast margin" value="18.4%" note="Healthy" positive />
          <Metric label="Variations" value="2" note="1 unsigned" warning />
          <Metric label="Open disputes" value="1" note="Meridian invoice" warning />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.08fr_.92fr]">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between"><p className="text-[11.5px] font-black text-white/72">Live controls</p><span className="text-[10px] text-white/32">Today</span></div>
            <div className="mt-3 space-y-2.5">
              <Signal icon={Truck} label="CO-0002 delivery shortfall" detail="180 of 240 sheets received" tone="warning" />
              <Signal icon={ReceiptText} label="MER-2048 invoice disputed" detail="Quantity and rate differ" tone="danger" />
              <Signal icon={FileClock} label="VAR-002 awaiting instruction" detail="Cupboard wall completed on site" tone="warning" />
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <p className="text-[11.5px] font-black text-white/72">Programme</p>
            <div className="mt-4 space-y-4">
              <Progress label="Level 2 partitions" value="74%" />
              <Progress label="Level 3 partitions" value="28%" />
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-[10.5px] text-amber-300"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />W3 corridors behind — material shortfall</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-white/32"><span>Estimate · Procurement · Site · Commercial · Programme</span><span className="text-[var(--welcome-cyan)]">All connected</span></div>
      </div>
      <div className="absolute -right-5 -top-5 -z-10 h-36 w-36 rounded-full bg-[color:var(--welcome-blue)]/20 blur-3xl" aria-hidden />
    </div>
  );
}

function Metric({ label, value, note, positive, warning }: { label: string; value: string; note: string; positive?: boolean; warning?: boolean }) {
  return <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/32">{label}</p><p className="font-mono-num mt-2 text-[20px] font-black text-white/88">{value}</p><p className={`mt-1 text-[9.5px] ${positive ? "text-emerald-300" : warning ? "text-amber-300" : "text-white/32"}`}>{note}</p></div>;
}

function Signal({ icon: Icon, label, detail, tone }: { icon: typeof Truck; label: string; detail: string; tone: "warning" | "danger" }) {
  return <div className="flex items-start gap-2.5"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tone === "danger" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}><Icon className="h-3.5 w-3.5" /></span><div><p className="text-[10.5px] font-bold text-white/72">{label}</p><p className="text-[9.5px] text-white/32">{detail}</p></div></div>;
}

function Progress({ label, value }: { label: string; value: string }) {
  return <div><div className="flex justify-between text-[10px]"><span className="text-white/45">{label}</span><span className="font-mono-num font-bold text-white/70">{value}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[var(--welcome-cyan)] shadow-[0_0_10px_var(--welcome-cyan)]" style={{ width: value }} /></div></div>;
}

function StoryRow({ kicker, title, copy, mock, reverse }: { kicker: string; title: string; copy: string; mock: React.ReactNode; reverse?: boolean }) {
  return <article className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}><div><p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--welcome-cyan)]">{kicker}</p><h3 className="mt-3 max-w-xl text-[24px] font-black leading-tight text-white sm:text-[30px]">{title}</h3><p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/48">{copy}</p></div><div className="min-w-0">{mock}</div></article>;
}

function MockFrame({ title, icon: Icon, children }: { title: string; icon: typeof Truck; children: React.ReactNode }) {
  return <div className="welcome-glass rounded-2xl p-4 sm:p-5"><div className="rounded-xl border border-white/[0.08] bg-[color:var(--welcome-panel)]/80 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--welcome-blue)]/12 text-[var(--welcome-cyan)]"><Icon className="h-4 w-4" /></span><p className="text-[12px] font-black text-white/78">{title}</p></div><SampleLabel /></div>{children}</div></div>;
}

function ProcurementMock() {
  return <MockFrame title="Awarded baseline to approved call-off" icon={Layers3}><div className="mt-4 grid gap-3 sm:grid-cols-3"><MiniStage label="System W2" value="780 m²" detail="Take-off ready" done /><MiniStage label="Best mix" value="£34,736.90" detail="3 lists compared" done /><MiniStage label="CO-0003" value="Draft" detail="Awaiting approval" /></div><div className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-3 text-[10.5px]"><span className="text-white/42">Northway · Gypframe 70 S 50 C stud 4200</span><span className="font-bold text-amber-300">Not priced</span></div><p className="mt-1 text-[9.5px] text-white/28">Missing line is visible before the call-off is approved.</p></div></MockFrame>;
}

function SiteMock() {
  return <MockFrame title="Delivery and daily site record" icon={HardHat}><div className="mt-4 grid gap-3 sm:grid-cols-[1.08fr_.92fr]"><div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3"><div className="flex justify-between gap-2"><p className="font-mono-num text-[11px] font-bold text-white/76">CO-0002 · Meridian</p><span className="text-[9px] font-black uppercase text-amber-300">Shortfall</span></div><p className="mt-2 text-[11px] text-white/44">W3 FireLine 15 — corridors</p><div className="mt-3 grid grid-cols-2 gap-2"><MiniValue label="Ordered" value="240" /><MiniValue label="Delivered" value="180" /></div><p className="mt-2 text-[9.5px] text-white/30">GRN recorded on site</p></div><div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10.5px] font-bold text-white/68">Daily report · Dan Mercer</p><p className="mt-2 text-[11px] text-white/42">Crew 5 · W3 corridors</p><div className="mt-3 flex items-center gap-2 rounded-md bg-amber-500/[0.07] p-2 text-[9.5px] text-amber-300"><Clock3 className="h-3.5 w-3.5" />2-hour access delay</div><p className="mt-2 text-[9.5px] text-white/28">Hoist booked by M&amp;E</p></div></div></MockFrame>;
}

function CommercialMock() {
  return <MockFrame title="Commercial position and evidence" icon={CircleDollarSign}><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-3"><div className="flex justify-between gap-2"><p className="font-mono-num text-[11px] font-bold text-white/76">MER-2048</p><span className="text-[9px] font-black uppercase text-red-300">Dispute open</span></div><CheckLine label="Quantity" detail="240 billed · 180 delivered" flagged /><CheckLine label="Rate" detail="£14.90 billed · £14.10 quoted" flagged /></div><div className="space-y-2"><Variation ref="VAR-001" value="£1,080" status="Signed" /><Variation ref="VAR-002" value="£600" status="Not signed" warning /><div className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"><div className="flex justify-between text-[10.5px]"><span className="text-white/42">Application 1 certified</span><span className="font-mono-num font-bold text-white/72">£28,600</span></div><p className="mt-1 text-[9.5px] text-white/28">Retention 3%</p></div></div></div></MockFrame>;
}

function ProgrammeMock() {
  return <MockFrame title="Programme and forecast" icon={BarChart3}><div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_.85fr]"><div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><PlanLine label="W2 · North zone" date="Complete" width="100%" /><PlanLine label="W2 · South zone" date="In progress" width="62%" /><PlanLine label="W3 · Corridors" date="Behind" width="38%" warning /><div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[9.5px] text-white/34"><PackageCheck className="h-3.5 w-3.5 text-[var(--welcome-cyan)]" />Milestone: Level 2 partitions boarded</div></div><div className="rounded-lg border border-[color:var(--welcome-cyan)]/15 bg-[color:var(--welcome-cyan)]/[0.045] p-3"><p className="text-[9.5px] font-bold uppercase tracking-wider text-white/34">Forecast margin</p><p className="font-mono-num mt-2 text-[28px] font-black text-[var(--welcome-cyan)]">18.4%</p><p className="mt-1 text-[10px] text-emerald-300">Project health · Healthy</p><div className="mt-4 border-t border-white/[0.07] pt-3"><p className="text-[9.5px] text-white/30">One amber issue</p><p className="mt-1 text-[10.5px] font-bold text-amber-300">Meridian invoice dispute</p></div></div></div></MockFrame>;
}

function MiniStage({ label, value, detail, done }: { label: string; value: string; detail: string; done?: boolean }) {
  return <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-center justify-between"><p className="text-[9.5px] text-white/34">{label}</p>{done && <CheckCircle2 className="h-3 w-3 text-emerald-300" />}</div><p className="font-mono-num mt-2 text-[13px] font-black text-white/76">{value}</p><p className="mt-1 text-[9.5px] text-white/28">{detail}</p></div>;
}
function MiniValue({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-white/[0.035] p-2"><p className="text-[8.5px] uppercase text-white/26">{label}</p><p className="font-mono-num mt-1 text-[13px] font-bold text-white/72">{value}</p></div>; }
function CheckLine({ label, detail, flagged }: { label: string; detail: string; flagged?: boolean }) { return <div className="mt-3 flex items-start justify-between gap-2"><div><p className="text-[10px] font-bold text-white/65">{label}</p><p className="font-mono-num text-[9.5px] text-white/32">{detail}</p></div><span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${flagged ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{flagged ? "Flagged" : "OK"}</span></div>; }
function Variation({ ref, value, status, warning }: { ref: string; value: string; status: string; warning?: boolean }) { return <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"><div className="flex justify-between gap-2"><span className="font-mono-num text-[10.5px] font-bold text-white/65">{ref}</span><span className="font-mono-num text-[10.5px] font-bold text-white/70">{value}</span></div><p className={`mt-1 text-[9.5px] ${warning ? "text-amber-300" : "text-emerald-300"}`}>{status}</p></div>; }
function PlanLine({ label, date, width, warning }: { label: string; date: string; width: string; warning?: boolean }) { return <div className="mb-3"><div className="flex justify-between gap-2 text-[9.5px]"><span className="font-bold text-white/55">{label}</span><span className={warning ? "text-amber-300" : "text-white/30"}>{date}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${warning ? "bg-amber-400" : "bg-[var(--welcome-cyan)]"}`} style={{ width }} /></div></div>; }
function RoleCard({ role, line }: { role: string; line: string }) { return <article className="welcome-glass rounded-xl p-6"><Users className="h-4 w-4 text-[var(--welcome-cyan)]" /><h3 className="mt-4 text-[12px] font-black uppercase tracking-[0.08em] text-white/82">{role}</h3><p className="mt-3 text-[13px] leading-relaxed text-white/44">{line}</p></article>; }
