import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileDiff,
  FileSpreadsheet,
  HardHat,
  Layers3,
  PackageCheck,
  Play,
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
      { name: "description", content: "Control estimating, procurement, site delivery, variations, invoices and margin in one place for UK interiors subcontractors." },
      { property: "og:title", content: "FixMargin — Cost control for UK drylining and interiors subcontractors" },
      { property: "og:description", content: "Control estimating, procurement, site delivery, variations, invoices and margin in one place for UK interiors subcontractors." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://quantix-prime-flow.lovable.app/welcome" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
      { rel: "canonical", href: "https://quantix-prime-flow.lovable.app/welcome" },
    ],
  }),
  component: WelcomePage,
});

const lifecycle = [
  { number: "01", title: "Tender", copy: "Pipeline, scope and follow-up" },
  { number: "02", title: "Estimate", copy: "Systems, take-off and revisions" },
  { number: "03", title: "Procure", copy: "Prices, call-offs and approvals" },
  { number: "04", title: "Deliver", copy: "GRNs, labour and daily reports" },
  { number: "05", title: "Control", copy: "Variations, invoices and programme" },
  { number: "06", title: "Close", copy: "Applications, retention and account" },
];

const capabilities = [
  { icon: FileDiff, title: "Drawing revisions", copy: "Track C0 onwards and identify post-award scope changes." },
  { icon: ClipboardCheck, title: "Tender & award handoff", copy: "Carry the commercial baseline into the live project." },
  { icon: Layers3, title: "Manufacturer systems", copy: "Build wall and ceiling quantities from known system specifications." },
  { icon: FileSpreadsheet, title: "Price-list comparison", copy: "Compare merchant lines on the same BoQ and expose missing prices." },
  { icon: Truck, title: "Call-offs & deliveries", copy: "Approve orders, record GRNs and retain delivery evidence." },
  { icon: ReceiptText, title: "Invoice checks", copy: "Match invoice quantity and rate to the order and delivery." },
  { icon: HardHat, title: "Site reporting", copy: "Capture labour, progress, delay notes and photographs." },
  { icon: CalendarClock, title: "Planner & progress", copy: "Connect tasks, milestones and progress-delay reporting." },
  { icon: TrendingUp, title: "Margin forecast", copy: "Read current exposure alongside forecast project margin." },
  { icon: FileCheck2, title: "Applications & retention", copy: "Track applications, certificates and retained value." },
  { icon: Users, title: "Roles & audit", copy: "Set responsibility and retain a record of important changes." },
  { icon: ShieldCheck, title: "Practical exports", copy: "Export operational records in CSV, PDF and XLSX formats." },
];

function WelcomePage() {
  return (
    <div className="welcome-architectural min-h-screen overflow-x-hidden bg-[var(--wm-paper)] text-[var(--wm-ink)] antialiased">
      <header className="sticky top-0 z-50 border-b border-[var(--wm-line-dark)] bg-[var(--wm-ink)] text-[var(--wm-paper)]">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/welcome" aria-label="FixMargin home"><Logo light /></Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
            <Link to="/pricing" className="px-2 py-2 text-xs font-medium text-[var(--wm-text-on-dark-muted)] hover:text-[var(--wm-paper)] sm:px-3">Pricing</Link>
            <Link to="/login" className="px-2 py-2 text-xs font-medium text-[var(--wm-text-on-dark-muted)] hover:text-[var(--wm-paper)] sm:px-3">Sign in</Link>
            <Link to="/signup" className="ml-1 inline-flex min-h-9 items-center border border-[var(--wm-paper)] bg-[var(--wm-paper)] px-3 text-xs font-semibold text-[var(--wm-ink)] hover:bg-[var(--wm-blue-soft)] sm:px-5">Start free</Link>
          </nav>
        </div>
        <nav aria-label="Product overview" className="hidden border-t border-[var(--wm-line-dark)] bg-[var(--wm-dark-soft)] md:block">
          <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-8 px-8 text-[11px] font-medium text-[var(--wm-text-on-dark-muted)] lg:px-12">
            <a href="#overview" className="border-b-2 border-[var(--wm-blue)] py-3 text-[var(--wm-paper)]">Overview</a>
            <a href="#workflow" className="py-3 hover:text-[var(--wm-paper)]">Workflow</a>
            <a href="#capabilities" className="py-3 hover:text-[var(--wm-paper)]">Capabilities</a>
            <a href="#demo" className="py-3 hover:text-[var(--wm-paper)]">Sample project</a>
            <a href="#presentations" className="py-3 hover:text-[var(--wm-paper)]">Presentations</a>
          </div>
        </nav>
      </header>

      <main>
        <section id="overview" className="welcome-tech-grid relative overflow-hidden bg-[var(--wm-ink)] text-[var(--wm-paper)]">
          <div className="mx-auto grid min-h-[720px] max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-24">
            <div className="relative z-10 lg:col-span-5">
              <Eyebrow>Commercial control platform</Eyebrow>
              <h1 className="mt-7 max-w-2xl text-[42px] font-semibold leading-[1.05] sm:text-[58px] lg:text-[68px]">
                Keep the margin you priced.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[var(--wm-text-on-dark-muted)] sm:text-lg">
                FixMargin connects tender, estimate, procurement, delivery, site records and commercial control for UK drylining and interiors subcontractors.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/signup" className="inline-flex min-h-12 items-center gap-2 bg-[var(--wm-blue)] px-6 text-sm font-semibold text-[var(--wm-paper)] hover:bg-[var(--wm-blue-strong)]">Start free <ArrowRight className="h-4 w-4" /></Link>
                <a href="#demo" className="inline-flex min-h-12 items-center gap-2 border border-[var(--wm-line-dark-strong)] px-6 text-sm font-semibold text-[var(--wm-paper)] hover:border-[var(--wm-paper)]"><Play className="h-4 w-4" /> View sample project</a>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase text-[var(--wm-text-on-dark-faint)]">No card required · UK trade workflows</p>
            </div>
            <div className="relative min-w-0 lg:col-span-7">
              <ProductStage />
            </div>
          </div>
        </section>

        <section id="workflow" aria-labelledby="workflow-title" className="border-b border-[var(--wm-line)] bg-[var(--wm-paper)]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Eyebrow dark>One connected commercial record</Eyebrow>
                <h2 id="workflow-title" className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">From first tender to final account</h2>
              </div>
              <p className="max-w-2xl self-end text-base leading-7 text-[var(--wm-muted)] lg:col-span-6 lg:col-start-7">The estimate becomes the buying baseline. Delivery and site evidence support the commercial position. Programme and cost changes update the forecast.</p>
            </div>
            <div className="mt-14 grid border-x border-t border-[var(--wm-line)] sm:grid-cols-2 lg:grid-cols-6">
              {lifecycle.map((item) => (
                <article key={item.number} className="group min-h-48 border-b border-r border-[var(--wm-line)] p-5 last:border-r-0 hover:bg-[var(--wm-panel)]">
                  <span className="font-mono text-[11px] text-[var(--wm-blue)]">{item.number}</span>
                  <h3 className="mt-9 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--wm-muted)]">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="platform-title" className="bg-[var(--wm-paper)]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <div className="max-w-3xl">
              <Eyebrow dark>Inside FixMargin</Eyebrow>
              <h2 id="platform-title" className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">The work, the evidence and the money — in the same view</h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--wm-muted)]">Each stage uses the same project baseline, so changes do not disappear between estimating, buying, site and commercial teams.</p>
            </div>
            <div className="mt-20 space-y-28 lg:space-y-36">
              <FeatureStory number="01" eyebrow="Estimate & specification" title="Build from manufacturer systems. Keep revisions traceable." copy="Turn British Gypsum, Knauf and Siniat system requirements into measured quantities. Record drawing revisions and separate post-award change from the C0 baseline." bullets={["System specification and take-off", "Drawing revision impact", "Tender-to-award baseline"]} visual={<EstimateVisual />} />
              <FeatureStory reverse number="02" eyebrow="Procurement" title="Compare merchant prices on the same BoQ before you buy." copy="Align merchant price lists to the materials you need, expose unpriced lines and pack differences, then raise controlled call-offs against the awarded quantities." bullets={["Side-by-side supplier comparison", "Missing-price and pack-size checks", "Approvals and call-off tracking"]} visual={<ProcurementVisual />} />
              <FeatureStory number="03" eyebrow="Delivery & site" title="Connect what arrived with what happened on site." copy="Record signed delivery notes, shortfalls, labour, daily progress and delays while the evidence is current and linked to the project." bullets={["GRNs and delivery shortfalls", "Daily reports and site photos", "Labour and delay records"]} visual={<DeliveryVisual />} />
              <FeatureStory reverse number="04" eyebrow="Commercial control" title="Check every invoice. Protect every instructed change." copy="Match billed quantity and rate to the call-off and delivery. Keep signed and unsigned variations, applications and retention visible in the commercial record." bullets={["Three-way invoice checks", "Variation evidence and status", "Applications, certificates and retention"]} visual={<CommercialVisual />} />
              <FeatureStory number="05" eyebrow="Programme & forecast" title="See the programme risk beside the margin impact." copy="Linked tasks, milestones, progress reports and overdue actions give commercial teams the context behind the latest forecast." bullets={["Dependencies and milestones", "Progress and delay reporting", "Live forecast margin"]} visual={<ProgrammeVisual />} />
            </div>
          </div>
        </section>

        <section id="demo" aria-labelledby="demo-title" className="bg-[var(--wm-dark-soft)] text-[var(--wm-paper)]">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-28">
            <div className="lg:col-span-4">
              <Eyebrow>Guided sample project</Eyebrow>
              <h2 id="demo-title" className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">See the full workflow in Harbour Yard</h2>
              <p className="mt-6 text-base leading-7 text-[var(--wm-text-on-dark-muted)]">A fictional drylining fit-out shows an estimate, three merchant comparisons, controlled call-offs, a delivery shortfall, an invoice dispute, variations, progress and forecast margin.</p>
              <Link to="/projects/$projectId" params={{ projectId: "sample-harbour-yard" }} className="mt-8 inline-flex min-h-12 items-center gap-2 bg-[var(--wm-paper)] px-6 text-sm font-semibold text-[var(--wm-ink)] hover:bg-[var(--wm-blue-soft)]">Open sample project <ArrowRight className="h-4 w-4" /></Link>
              <p className="mt-4 font-mono text-[10px] uppercase text-[var(--wm-text-on-dark-faint)]">Sample data · No emails or live actions</p>
            </div>
            <div className="min-w-0 lg:col-span-8"><DemoBoard /></div>
          </div>
        </section>

        <section id="capabilities" aria-labelledby="capabilities-title" className="border-b border-[var(--wm-line)] bg-[var(--wm-panel)]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4"><Eyebrow dark>Capabilities</Eyebrow><h2 id="capabilities-title" className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">Commercial controls around the whole job</h2></div>
              <div className="grid border-l border-t border-[var(--wm-line)] sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
                {capabilities.map(({ icon: Icon, title, copy }) => <article key={title} className="min-h-44 border-b border-r border-[var(--wm-line)] bg-[var(--wm-paper)] p-5"><Icon className="h-5 w-5 text-[var(--wm-blue)]" /><h3 className="mt-7 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--wm-muted)]">{copy}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section id="presentations" aria-labelledby="presentations-title" className="bg-[var(--wm-paper)]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <Eyebrow dark>Explore FixMargin</Eyebrow>
            <h2 id="presentations-title" className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Choose the view that matches your responsibility</h2>
            <div className="mt-12 grid border-l border-t border-[var(--wm-line)] md:grid-cols-3">
              <PresentationCard tag="Role walkthrough" title="How each team member uses FixMargin" copy="See the working rhythm for the MD, Commercial Director, Estimator/QS and Buyer." to="/how-to" />
              <PresentationCard tag="Live sample" title="Harbour Yard Offices — Levels 2–3" copy="Explore the fictional project from priced systems through delivery, dispute and forecast." project />
              <PresentationCard tag="Plans" title="Compare the available workspace plans" copy="Review included controls and choose the plan that suits your team." to="/pricing" />
            </div>
          </div>
        </section>

        <section aria-labelledby="roles-title" className="border-y border-[var(--wm-line)] bg-[var(--wm-panel)]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4"><Eyebrow dark>Who it is for</Eyebrow><h2 id="roles-title" className="mt-5 text-3xl font-semibold leading-tight">Built for the people who carry the margin</h2><p className="mt-5 text-sm leading-6 text-[var(--wm-muted)]">Drylining, ceilings and interiors subcontractors, roughly £2–25M turnover.</p></div>
              <div className="grid border-l border-t border-[var(--wm-line)] sm:grid-cols-2 lg:col-span-8"><Role title="Managing Director" copy="Project health, exposure and forecast margin without waiting for month end." /><Role title="Commercial Director" copy="Variations, applications, disputes and the route to final account." /><Role title="Estimator / QS" copy="A traceable estimate that carries value and risk into delivery." /><Role title="Buyer" copy="Supplier comparison, call-offs, deliveries and invoice differences." /></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-title" className="bg-[var(--wm-blue)] text-[var(--wm-paper)]">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-12">
            <div><h2 id="cta-title" className="text-3xl font-semibold sm:text-4xl">Start free — no card required</h2><p className="mt-3 text-sm text-[var(--wm-blue-text-muted)]">Keep tender, procurement, site and commercial control connected.</p></div>
            <div className="flex flex-wrap gap-3"><Link to="/signup" className="inline-flex min-h-12 items-center gap-2 bg-[var(--wm-paper)] px-6 text-sm font-semibold text-[var(--wm-ink)]">Start free <ArrowRight className="h-4 w-4" /></Link><Link to="/pricing" className="inline-flex min-h-12 items-center border border-[var(--wm-paper)] px-6 text-sm font-semibold text-[var(--wm-paper)]">Compare plans</Link></div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--wm-ink)] text-[var(--wm-paper)]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center"><Logo light /><nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[var(--wm-text-on-dark-muted)]"><Link to="/pricing">Pricing</Link><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cookies">Cookies</a><Link to="/login">Sign in</Link></nav></div>
          <div className="mt-9 border-t border-[var(--wm-line-dark)] pt-6 text-xs leading-6 text-[var(--wm-text-on-dark-faint)]"><p>FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales, company number 16680674.</p><p>© 2026 Quantix Prime Ltd.</p></div>
        </div>
      </footer>
    </div>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-[var(--wm-blue)]" : "text-[var(--wm-blue-bright)]"}`}>{children}</p>;
}

function ProductStage() {
  return <div className="relative mx-auto max-w-3xl pb-10 lg:ml-auto">
    <div className="border border-[var(--wm-line-dark-strong)] bg-[var(--wm-product)] shadow-[0_32px_80px_var(--wm-shadow)]">
      <WindowBar label="HARBOUR YARD / PROJECT CONTROL" />
      <div className="grid gap-px bg-[var(--wm-line-dark)] sm:grid-cols-4"><Metric label="Progress" value="42%" sub="8 weeks remain" /><Metric label="Forecast margin" value="18.4%" sub="Healthy" good /><Metric label="Variations" value="2" sub="1 unsigned" warn /><Metric label="Open disputes" value="1" sub="Meridian invoice" warn /></div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_.9fr] sm:p-5">
        <Panel title="Live commercial controls"><Signal icon={Truck} title="CO-0002 delivery shortfall" detail="180 of 240 sheets received" /><Signal icon={ReceiptText} title="MER-2048 invoice disputed" detail="Quantity and rate differ" danger /><Signal icon={FileDiff} title="VAR-002 not yet signed" detail="Cupboard wall completed" /></Panel>
        <Panel title="Programme"><ProgressLine label="Level 2 partitions" value="74%" width="74%" /><ProgressLine label="Level 3 partitions" value="28%" width="28%" /><div className="mt-4 border border-[var(--wm-warning-line)] bg-[var(--wm-warning-bg)] p-3 text-[10px] text-[var(--wm-warning)]"><AlertTriangle className="mr-2 inline h-3 w-3" />W3 corridors behind — material shortfall</div></Panel>
      </div>
    </div>
    <div className="absolute -bottom-1 left-4 right-8 border border-[var(--wm-line-dark-strong)] bg-[var(--wm-dark-soft)] p-4 shadow-[0_16px_45px_var(--wm-shadow)] sm:-left-8 sm:right-auto sm:w-64"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase text-[var(--wm-text-on-dark-faint)]">Control status</span><CheckCircle2 className="h-4 w-4 text-[var(--wm-good)]" /></div><p className="mt-2 text-sm font-semibold">All project records connected</p></div>
  </div>;
}

function WindowBar({ label }: { label: string }) { return <div className="flex h-10 items-center justify-between border-b border-[var(--wm-line-dark)] bg-[var(--wm-dark-soft)] px-4"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--wm-line-dark-strong)]" /><span className="h-2 w-2 rounded-full bg-[var(--wm-line-dark-strong)]" /><span className="h-2 w-2 rounded-full bg-[var(--wm-blue)]" /></div><span className="font-mono text-[8px] tracking-[0.12em] text-[var(--wm-text-on-dark-faint)]">{label}</span><SampleBadge /></div>; }
function SampleBadge() { return <span className="border border-[var(--wm-blue-line)] bg-[var(--wm-blue-bg)] px-2 py-0.5 font-mono text-[8px] uppercase text-[var(--wm-blue-bright)]">Sample data</span>; }
function Metric({ label, value, sub, good, warn }: { label: string; value: string; sub: string; good?: boolean; warn?: boolean }) { return <div className="bg-[var(--wm-product)] p-4"><p className="font-mono text-[8px] uppercase text-[var(--wm-text-on-dark-faint)]">{label}</p><p className="mt-3 font-mono text-xl font-semibold">{value}</p><p className={`mt-1 text-[9px] ${good ? "text-[var(--wm-good)]" : warn ? "text-[var(--wm-warning)]" : "text-[var(--wm-text-on-dark-faint)]"}`}>{sub}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="border border-[var(--wm-line-dark)] bg-[var(--wm-dark-soft)] p-4"><p className="mb-4 text-[11px] font-semibold">{title}</p>{children}</div>; }
function Signal({ icon: Icon, title, detail, danger }: { icon: typeof Truck; title: string; detail: string; danger?: boolean }) { return <div className="mb-3 flex items-start gap-3 last:mb-0"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${danger ? "bg-[var(--wm-danger-bg)] text-[var(--wm-danger)]" : "bg-[var(--wm-warning-bg)] text-[var(--wm-warning)]"}`}><Icon className="h-3.5 w-3.5" /></span><div><p className="text-[10px] font-medium">{title}</p><p className="mt-0.5 text-[9px] text-[var(--wm-text-on-dark-faint)]">{detail}</p></div></div>; }
function ProgressLine({ label, value, width, warning }: { label: string; value: string; width: string; warning?: boolean }) { return <div className="mb-4"><div className="flex justify-between text-[9px]"><span className="text-[var(--wm-text-on-dark-muted)]">{label}</span><span className={warning ? "text-[var(--wm-warning)]" : "text-[var(--wm-paper)]"}>{value}</span></div><div className="mt-2 h-1 bg-[var(--wm-line-dark)]"><div className={`h-full ${warning ? "bg-[var(--wm-warning)]" : "bg-[var(--wm-blue)]"}`} style={{ width }} /></div></div>; }

function FeatureStory({ number, eyebrow, title, copy, bullets, visual, reverse = false }: { number: string; eyebrow: string; title: string; copy: string; bullets: string[]; visual: React.ReactNode; reverse?: boolean }) {
  return <article className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16"><div className={`lg:col-span-4 ${reverse ? "lg:col-start-9" : ""}`}><span className="font-mono text-xs text-[var(--wm-blue)]">{number}</span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wm-muted)]">{eyebrow}</p><h3 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h3><p className="mt-5 text-sm leading-7 text-[var(--wm-muted)]">{copy}</p><ul className="mt-7 border-t border-[var(--wm-line)]">{bullets.map((bullet) => <li key={bullet} className="flex items-center gap-3 border-b border-[var(--wm-line)] py-3 text-sm"><Check className="h-4 w-4 text-[var(--wm-blue)]" />{bullet}</li>)}</ul></div><div className={`min-w-0 lg:col-span-7 ${reverse ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-6"}`}>{visual}</div></article>;
}

function LightFrame({ label, children }: { label: string; children: React.ReactNode }) { return <div className="border border-[var(--wm-line-strong)] bg-[var(--wm-panel)] shadow-[0_24px_60px_var(--wm-light-shadow)]"><div className="flex h-10 items-center justify-between border-b border-[var(--wm-line)] bg-[var(--wm-paper)] px-4"><span className="font-mono text-[9px] text-[var(--wm-muted)]">{label}</span><SampleBadge /></div><div className="p-4 sm:p-6">{children}</div></div>; }
function EstimateVisual() { return <LightFrame label="SPECIFICATION / DRAWING IMPACT"><div className="grid gap-4 sm:grid-cols-[.8fr_1.2fr]"><div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-4"><p className="text-xs font-semibold">Wall systems</p>{[["W1","A206013","150 m²"],["W2","A206228","780 m²"],["W3","A206141","420 m²"]].map(([a,b,c],i)=><div key={a} className={`mt-3 border-l-2 p-3 ${i===1?"border-[var(--wm-blue)] bg-[var(--wm-blue-pale)]":"border-[var(--wm-line)] bg-[var(--wm-panel)]"}`}><div className="flex justify-between"><span className="font-mono text-[10px] font-semibold">{a} · {b}</span><span className="font-mono text-[10px]">{c}</span></div><p className="mt-1 text-[9px] text-[var(--wm-muted)]">Gypframe 70 S 50 C · 600 centres</p></div>)}</div><div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold">Drawing revisions</p><span className="font-mono text-[9px] text-[var(--wm-blue)]">C0 BASELINE</span></div><div className="mt-6 space-y-0">{[["C0","Award baseline","Accepted"],["C1","Meeting-room partition","Impact found"],["C2","Core wall detail","Review"]].map(([rev,name,status],i)=><div key={rev} className="relative flex gap-4 border-l border-[var(--wm-line-strong)] pb-7 pl-5 last:pb-0"><span className={`absolute -left-1 top-1 h-2 w-2 rounded-full ${i===0?"bg-[var(--wm-good)]":"bg-[var(--wm-blue)]"}`} /><span className="font-mono text-[10px] font-semibold">{rev}</span><div><p className="text-[11px] font-medium">{name}</p><p className="mt-1 text-[9px] text-[var(--wm-muted)]">{status}</p></div></div>)}</div></div></div></LightFrame>; }
function ProcurementVisual() { return <LightFrame label="COSTED BOQ / SUPPLIER COMPARISON"><div className="overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left"><thead><tr className="border-b border-[var(--wm-line-strong)] font-mono text-[8px] uppercase text-[var(--wm-muted)]"><th className="pb-3">Material</th><th className="pb-3">Qty</th><th className="pb-3">Castlegate</th><th className="pb-3">Meridian</th><th className="pb-3">Northway</th></tr></thead><tbody className="text-[10px]"><TableRow item="WallBoard 12.5" qty="284" a="£7.82" b="£7.94" c="£7.88" best="a"/><TableRow item="SoundBloc 12.5" qty="612" a="£13.28" b="£13.12" c="£13.76" best="b"/><TableRow item="70 S 50 C stud 4200" qty="52" a="£8.64" b="£8.51" c="Not priced" alert/><TableRow item="APR 1200 · 50 mm" qty="146" a="£22.08" b="£21.92" c="£21.66" best="c"/></tbody></table></div><div className="mt-5 grid gap-px bg-[var(--wm-line)] sm:grid-cols-4"><LightMetric label="Castlegate" value="£37,347.45"/><LightMetric label="Meridian" value="£37,186.60"/><LightMetric label="Northway" value="£37,354.00" alert/><LightMetric label="Best mix" value="£34,736.90" active/></div></LightFrame>; }
function TableRow({ item, qty, a, b, c, best, alert }: { item:string; qty:string; a:string; b:string; c:string; best?:string; alert?:boolean }) { return <tr className="border-b border-[var(--wm-line)]"><td className="py-4 font-medium">{item}</td><td className="py-4 font-mono text-[var(--wm-muted)]">{qty}</td>{[["a",a],["b",b],["c",c]].map(([key,val])=><td key={key} className={`py-4 font-mono ${key===best?"font-semibold text-[var(--wm-blue)]":alert&&key==="c"?"text-[var(--wm-warning-strong)]":""}`}>{val}</td>)}</tr>; }
function LightMetric({ label, value, active, alert }: { label:string; value:string; active?:boolean; alert?:boolean }) { return <div className={`${active?"bg-[var(--wm-ink)] text-[var(--wm-paper)]":"bg-[var(--wm-paper)]"} p-4`}><p className={`font-mono text-[8px] uppercase ${active?"text-[var(--wm-text-on-dark-faint)]":"text-[var(--wm-muted)]"}`}>{label}</p><p className={`mt-2 font-mono text-[12px] font-semibold ${alert?"text-[var(--wm-warning-strong)]":""}`}>{value}</p></div>; }
function DeliveryVisual() { return <LightFrame label="SITE / DELIVERIES & DAILY REPORTS"><div className="grid gap-4 sm:grid-cols-2"><div className="border border-[var(--wm-warning-line-light)] bg-[var(--wm-warning-pale)] p-5"><div className="flex justify-between"><div><p className="font-mono text-[10px] font-semibold">CO-0002</p><p className="mt-1 text-xs">Meridian · W3 corridors</p></div><span className="font-mono text-[8px] uppercase text-[var(--wm-warning-strong)]">Shortfall</span></div><div className="mt-8 grid grid-cols-2 gap-3"><LightMetric label="Ordered" value="240"/><LightMetric label="Delivered" value="180"/></div><p className="mt-4 text-[10px] text-[var(--wm-muted)]">GRN signed · short delivery recorded</p></div><div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-5"><p className="font-mono text-[9px] text-[var(--wm-muted)]">DAILY REPORT · DAN MERCER</p><p className="mt-3 text-sm font-semibold">W3 corridors · crew 5</p><div className="mt-6 border-l-2 border-[var(--wm-warning)] bg-[var(--wm-warning-pale)] p-3"><p className="text-xs font-semibold">2-hour access delay</p><p className="mt-1 text-[10px] text-[var(--wm-muted)]">Hoist booked by M&amp;E</p></div><div className="mt-4 grid grid-cols-3 gap-2"><Photo/><Photo/><Photo/></div></div></div></LightFrame>; }
function Photo() { return <div className="aspect-[4/3] bg-[var(--wm-photo)]"><HardHat className="mx-auto h-full w-4 text-[var(--wm-muted-light)]" /></div>; }
function CommercialVisual() { return <LightFrame label="COMMERCIAL / INVOICE & VARIATIONS"><div className="grid gap-4 sm:grid-cols-[1.15fr_.85fr]"><div className="border border-[var(--wm-danger-line)] bg-[var(--wm-danger-pale)] p-5"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-semibold">MER-2048</p><p className="mt-1 text-xs">Invoice against CO-0002</p></div><span className="font-mono text-[8px] uppercase text-[var(--wm-danger-strong)]">Dispute open</span></div><div className="mt-6 space-y-3"><Variance label="Quantity" ordered="180 delivered" billed="240 billed"/><Variance label="Rate" ordered="£14.10 quoted" billed="£14.90 billed"/></div></div><div className="space-y-3"><VariationRow refNo="VAR-001" copy="Meeting-room partition" value="£1,080" signed/><VariationRow refNo="VAR-002" copy="Cupboard wall at core" value="£600"/><div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-4"><p className="font-mono text-[8px] uppercase text-[var(--wm-muted)]">Application 1</p><div className="mt-2 flex justify-between"><span className="text-xs">Certified</span><span className="font-mono text-xs font-semibold">£28,600</span></div><p className="mt-2 text-[9px] text-[var(--wm-muted)]">Retention 3%</p></div></div></div></LightFrame>; }
function Variance({ label, ordered, billed }: { label:string; ordered:string; billed:string }) { return <div className="grid grid-cols-3 items-center gap-2 border-t border-[var(--wm-danger-line)] pt-3 text-[10px]"><span className="font-semibold">{label}</span><span className="text-[var(--wm-muted)]">{ordered}</span><span className="font-mono text-[var(--wm-danger-strong)]">{billed}</span></div>; }
function VariationRow({ refNo, copy, value, signed }: { refNo:string; copy:string; value:string; signed?:boolean }) { return <div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-4"><div className="flex justify-between"><span className="font-mono text-[9px] font-semibold">{refNo}</span><span className="font-mono text-[10px] font-semibold">{value}</span></div><p className="mt-2 text-[10px]">{copy}</p><p className={`mt-2 text-[9px] ${signed?"text-[var(--wm-good-strong)]":"text-[var(--wm-warning-strong)]"}`}>{signed?"Signed":"Not signed"}</p></div>; }
function ProgrammeVisual() { return <LightFrame label="PROGRAMME / PROGRESS & FORECAST"><div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]"><div className="border border-[var(--wm-line)] bg-[var(--wm-paper)] p-5"><p className="text-xs font-semibold">Level 2–3 fit-out</p><div className="mt-6"><ProgrammeRow label="W2 · North zone" status="Complete" width="100%"/><ProgrammeRow label="W2 · South zone" status="In progress" width="62%"/><ProgrammeRow label="W3 · Corridors" status="Behind" width="38%" warning/><ProgrammeRow label="W4 · Reception" status="Following W3" width="12%"/></div><div className="mt-5 flex items-center gap-2 border-t border-[var(--wm-line)] pt-4 text-[10px]"><PackageCheck className="h-4 w-4 text-[var(--wm-blue)]"/>Milestone · Level 2 partitions boarded</div></div><div className="bg-[var(--wm-ink)] p-5 text-[var(--wm-paper)]"><p className="font-mono text-[9px] uppercase text-[var(--wm-text-on-dark-faint)]">Forecast margin</p><p className="mt-4 font-mono text-4xl font-semibold text-[var(--wm-blue-bright)]">18.4%</p><p className="mt-2 text-[10px] text-[var(--wm-good)]">Project health · Healthy</p><div className="mt-8 border-t border-[var(--wm-line-dark)] pt-4"><p className="font-mono text-[8px] uppercase text-[var(--wm-text-on-dark-faint)]">Current attention</p><p className="mt-2 text-xs text-[var(--wm-warning)]">Meridian invoice dispute</p></div></div></div></LightFrame>; }
function ProgrammeRow({ label, status, width, warning }: { label:string; status:string; width:string; warning?:boolean }) { return <div className="mb-5"><div className="flex justify-between gap-3 text-[10px]"><span className="font-medium">{label}</span><span className={warning?"text-[var(--wm-warning-strong)]":"text-[var(--wm-muted)]"}>{status}</span></div><div className="mt-2 h-1.5 bg-[var(--wm-line)]"><div className={`h-full ${warning?"bg-[var(--wm-warning)]":"bg-[var(--wm-blue)]"}`} style={{width}}/></div></div>; }
function DemoBoard() { return <div className="border border-[var(--wm-line-dark-strong)] bg-[var(--wm-product)]"><WindowBar label="SAMPLE PROJECT / HARBOUR YARD OFFICES"/><div className="grid gap-px bg-[var(--wm-line-dark)] sm:grid-cols-3"><Metric label="Contract value" value="£104,800" sub="Retention 3%"/><Metric label="Progress" value="42%" sub="8 weeks remain"/><Metric label="Forecast margin" value="18.4%" sub="Healthy" good/></div><div className="grid gap-px bg-[var(--wm-line-dark)] md:grid-cols-3"><DemoColumn title="Procurement"><DemoLine text="3 merchant lists compared" status="Complete"/><DemoLine text="CO-0003 awaiting approval" status="Draft"/></DemoColumn><DemoColumn title="Site"><DemoLine text="CO-0002 short delivery" status="Attention" warn/><DemoLine text="5 daily reports" status="Current"/></DemoColumn><DemoColumn title="Commercial"><DemoLine text="VAR-001 signed" status="£1,080"/><DemoLine text="MER-2048 disputed" status="Open" warn/></DemoColumn></div></div>; }
function DemoColumn({ title, children }: { title:string; children:React.ReactNode }) { return <div className="bg-[var(--wm-dark-soft)] p-5"><p className="mb-5 text-xs font-semibold">{title}</p>{children}</div>; }
function DemoLine({ text, status, warn }: { text:string; status:string; warn?:boolean }) { return <div className="mb-3 border-t border-[var(--wm-line-dark)] pt-3 last:mb-0"><p className="text-[10px]">{text}</p><p className={`mt-1 font-mono text-[8px] ${warn?"text-[var(--wm-warning)]":"text-[var(--wm-blue-bright)]"}`}>{status}</p></div>; }
function PresentationCard({ tag, title, copy, to, project }: { tag:string; title:string; copy:string; to?:"/how-to"|"/pricing"; project?:boolean }) { const content=<><p className="font-mono text-[9px] uppercase text-[var(--wm-blue)]">{tag}</p><h3 className="mt-8 max-w-sm text-xl font-semibold">{title}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-[var(--wm-muted)]">{copy}</p><span className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--wm-blue)]">Explore <ArrowRight className="h-4 w-4"/></span></>; return project?<Link to="/projects/$projectId" params={{projectId:"sample-harbour-yard"}} className="min-h-72 border-b border-r border-[var(--wm-line)] p-7 hover:bg-[var(--wm-panel)]">{content}</Link>:<Link to={to ?? "/welcome"} className="min-h-72 border-b border-r border-[var(--wm-line)] p-7 hover:bg-[var(--wm-panel)]">{content}</Link>; }
function Role({ title, copy }: { title:string; copy:string }) { return <article className="min-h-44 border-b border-r border-[var(--wm-line)] bg-[var(--wm-paper)] p-6"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-4 text-xs leading-5 text-[var(--wm-muted)]">{copy}</p></article>; }
