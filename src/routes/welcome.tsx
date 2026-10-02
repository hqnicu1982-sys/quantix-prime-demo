import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITLE = "FixMargin — commercial control for UK drylining and interiors subcontractors";
const DESCRIPTION =
  "Estimate from 3,054 manufacturer systems, compare merchant prices on your BoQ, plan call-offs, file site reports and check every invoice before you pay.";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fixmargin.com/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://fixmargin.com/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: WelcomePage,
});

const RESOURCES = [
  { label: "Blog", href: "/blog", enabled: false },
  { label: "How-to guides", href: "/how-to", enabled: true },
  { label: "Partners", href: "/partners", enabled: false },
  { label: "News & statements", href: "/news", enabled: false },
];

const enabledResources = RESOURCES.filter((item) => item.enabled);

const PHASES = [
  { id: "estimate", number: "01", title: "ESTIMATE", items: ["System catalog", "Calculator", "Costed BoQ", "Tender pipeline"] },
  { id: "buy", number: "02", title: "BUY", items: ["Price lists", "Merchant comparison", "Call-offs", "Auto call-off"] },
  { id: "build", number: "03", title: "BUILD", items: ["Planner", "Material readiness", "Deliveries", "Daily site report", "Labour"] },
  { id: "paid", number: "04", title: "GET PAID", items: ["Invoice check", "Variations", "Profit forecast", "Financials"] },
];

function Brand() {
  return (
    <a href="#top" className="wm-brand" aria-label="FixMargin home">
      <span className="wm-board-mark" aria-hidden="true">
        <i className="wm-mark-estimate" /><i className="wm-mark-buy" /><i className="wm-mark-build" /><i className="wm-mark-paid" />
      </span>
      <span>FixMargin</span>
    </a>
  );
}

function Reveal({ children, className = "", as = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.classList.add("is-visible");
        observer.unobserve(node);
      },
      { threshold: 0.16 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Comp = as;
  return <Comp ref={ref as never} className={`wm-reveal ${className}`}>{children}</Comp>;
}

function AnimatedMoney({ pounds, delay = 0 }: { pounds: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const finalText = `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = finalText;
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      window.setTimeout(() => {
        const start = performance.now();
        const duration = 900;
        const frame = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = progress === 1 ? pounds : pounds * eased;
          node.textContent = `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }, delay);
    }, { threshold: 0.8 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, pounds]);

  return <span ref={ref}>£0.00</span>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="wm-header">
      <div className="wm-header-inner">
        <Brand />
        <nav className="wm-desktop-nav" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#site">On site</a>
          <a href="#roles">Roles</a>
          {enabledResources.length > 0 && (
            <div className="wm-resource-menu">
              <button type="button" className="wm-nav-resource">Resources <ChevronDown aria-hidden /></button>
              <div className="wm-resource-popover">
                {enabledResources.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
              </div>
            </div>
          )}
          <Link to="/pricing">Pricing</Link>
          <Link to="/login" className="wm-sign-in">Sign in</Link>
          <Button asChild className="wm-button wm-button-primary"><Link to="/signup">Start free</Link></Button>
        </nav>
        <div className="wm-mobile-actions">
          <Link to="/login" className="wm-sign-in">Sign in</Link>
          <Button type="button" variant="ghost" size="icon" className="wm-menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="welcome-mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="welcome-mobile-menu" className="wm-mobile-menu" aria-label="Mobile navigation">
          <a href="#product" onClick={close}>Product</a>
          <a href="#site" onClick={close}>On site</a>
          <a href="#roles" onClick={close}>Roles</a>
          {enabledResources.map((item) => <a key={item.label} href={item.href} onClick={close}>{item.label}</a>)}
          <Link to="/pricing" onClick={close}>Pricing</Link>
          <Button asChild className="wm-button wm-button-primary"><Link to="/signup">Start free</Link></Button>
        </nav>
      )}
    </header>
  );
}

function PhaseStrip() {
  return (
    <Reveal className="wm-wrap wm-phase-wrap">
      <div className="wm-phase-grid">
        {PHASES.map((phase, index) => (
          <article key={phase.id} className={`wm-phase wm-phase-${phase.id}`} style={{ "--phase-delay": `${index * 110}ms` } as React.CSSProperties}>
            <span className="wm-phase-line" />
            <span className="wm-phase-label">{phase.number} · {phase.title}</span>
            <div className="wm-chip-row">{phase.items.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
        ))}
      </div>
      <p className="wm-caption">Colour-coded like the boards on site. Every account opens with a finished sample project in all four.</p>
    </Reveal>
  );
}

function EstimateMock() {
  const rows = ["Boards", "Studs & track", "Screws, tape & jointing", "Insulation"];
  return (
    <div className="wm-mock wm-estimate-mock">
      <div className="wm-filter-row"><span className="active">Partitions</span><span>Fire rating</span><span>Acoustic</span><span>Max height</span></div>
      <div className="wm-component-list">
        {rows.map((row, index) => <div key={row}><span>{row}</span><span className="wm-check" style={{ "--item-delay": `${240 + index * 170}ms` } as React.CSSProperties}>✓ calculated</span></div>)}
      </div>
    </div>
  );
}

function BuyMock() {
  return (
    <div className="wm-mock wm-buy-mock">
      <div className="wm-money-row"><span>All from Castlegate</span><span className="wm-mono"><AnimatedMoney pounds={34679.09} /></span></div>
      <div className="wm-money-row"><span>Best mix of 3 merchants</span><span className="wm-mono"><AnimatedMoney pounds={32488.33} delay={100} /></span></div>
      <div className="wm-difference"><span>Difference</span><span className="wm-mono"><AnimatedMoney pounds={2190.76} delay={200} /></span></div>
      <div className="wm-calloff"><span>Call-off · boards, L2</span><span className="wm-status wm-status-good">Delivered</span></div>
      <div className="wm-calloff"><span>Call-off · metal, L3</span><span className="wm-status wm-status-warn">Suggested from programme</span></div>
    </div>
  );
}

function BuildMock() {
  return (
    <div className="wm-build-mock">
      <div className="wm-mock wm-planner">
        <strong>Planner · L2–3</strong>
        <div><span>Partitions L2</span><i className="wm-track"><b className="wm-gantt wm-gantt-build" /></i></div>
        <div><span>Ceilings L2</span><i className="wm-track"><b className="wm-gantt wm-gantt-buy" /></i></div>
        <div><span>Partitions L3</span><i className="wm-track"><b className="wm-gantt wm-gantt-warn" /></i></div>
        <div className="wm-readiness"><span>Material readiness, L3</span><span>At risk</span></div>
      </div>
      <div className="wm-phone">
        <strong>Daily site report</strong>
        {["Crew on site", "Progress by area", "Photos", "Delays & issues"].map((field, index) => <span key={field} style={{ "--item-delay": `${250 + index * 150}ms` } as React.CSSProperties}>{field}</span>)}
        <button type="button" tabIndex={-1}>Sign & save PDF</button>
      </div>
    </div>
  );
}

function PaidMock() {
  return (
    <div className="wm-mock wm-paid-mock">
      <div className="wm-match-grid">
        <div><span>Ordered</span><strong>PO <i>✓</i></strong></div>
        <div><span>Delivered</span><strong>GRN <i>✓</i></strong></div>
        <div className="mismatch"><span>Invoiced</span><strong>Mismatch</strong></div>
      </div>
      <div className="wm-dispute"><span>Invoice held · dispute opened</span><span>Evidence attached</span></div>
      <div className="wm-detail-row"><span>Variation · instructed on site</span><span className="wm-status wm-status-warn">Awaiting approval</span></div>
      <div className="wm-detail-row"><span>Priced vs bought vs claimed</span><span className="wm-status wm-status-good">On budget</span></div>
    </div>
  );
}

const FEATURE_COPY = [
  {
    phase: "estimate", number: "01", label: "ESTIMATE", title: "From manufacturer system to costed BoQ.",
    body: "Pick from 3,054 manufacturer-verified British Gypsum, Knauf, Siniat and Fermacell systems, filtered by fire, acoustic and height. The calculator lists every component and saves it into the project BoQ. Tenders are tracked until they're won.",
    mock: <EstimateMock />,
  },
  {
    phase: "buy", number: "02", label: "BUY", title: "Every merchant's price on your lines. Call-offs from the BoQ.",
    body: "Upload price lists as they come. FixMargin matches them to your BoQ lines, compares per sheet, metre and box, shows what's missing and works out the best mix. Call-offs go out from the BoQ, and the planner suggests them from lead times.",
    mock: <BuyMock />,
  },
  {
    phase: "build", number: "03", label: "BUILD", title: "Programme, materials and site, in the same file.",
    body: "A Gantt planner with linked tasks. Material readiness shows what's on site before the gang arrives. Deliveries are booked in against the order. Site managers file the daily report from the phone, with photos and a signature, saved as a PDF.",
    mock: <BuildMock />,
  },
  {
    phase: "paid", number: "04", label: "GET PAID", title: "Check before you pay. Claim everything you did.",
    body: "Every invoice is matched against the order and the delivery note. A mismatch becomes a dispute with the evidence attached, not a payment. Variations are logged when the work happens, with the site evidence attached. Priced vs bought vs claimed is a live number per project.",
    mock: <PaidMock />,
  },
];

function FeatureRow({ feature, reverse, id }: { feature: (typeof FEATURE_COPY)[number]; reverse?: boolean; id?: string }) {
  return (
    <Reveal as="section" className={`wm-feature-row wm-feature-${feature.phase} ${reverse ? "wm-feature-reverse" : ""}`}>
      <div id={id} className="wm-feature-copy">
        <span className="wm-phase-label">{feature.number} · {feature.label}</span>
        <h3>{feature.title}</h3>
        <p>{feature.body}</p>
      </div>
      <div className="wm-feature-visual">{feature.mock}</div>
    </Reveal>
  );
}

function Roles() {
  const roles = [
    ["ADMIN", "Directors, QS, estimators, buyers", "BoQ, prices, call-offs, invoices, variations and margin."],
    ["PRO CONTROL", "Site managers", "Programme, deliveries, materials, team and site reports."],
    ["PRO", "Supervisors", "The projects they're on, progress and daily reports."],
    ["OPERATIVE", "The gang", "Their tasks and site updates from the phone."],
  ];
  return (
    <Reveal as="section" className="wm-roles" >
      <div id="roles" className="wm-wrap wm-roles-inner">
        <div className="wm-section-heading"><h2>The office and the site on the same job.</h2><p>Four roles with clear permissions and an audit trail. Operatives never see commercial figures.</p></div>
        <div className="wm-role-grid">{roles.map(([role, title, copy]) => <article key={role}><span className="wm-mono">{role}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div>
    </Reveal>
  );
}

function Footer() {
  return (
    <footer className="wm-footer">
      <div className="wm-wrap wm-footer-inner">
        <div className="wm-footer-grid">
          <div><strong>Product</strong><a href="#product">Product</a><a href="#site">On site</a><a href="#roles">Roles</a><Link to="/pricing">Pricing</Link><Link to="/login">Demo</Link></div>
          {enabledResources.length > 0 && <div><strong>Resources</strong>{enabledResources.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}</div>}
          <div><strong>Account</strong><Link to="/login">Sign in</Link><Link to="/signup">Start free</Link></div>
          <div><strong>Legal</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cookies">Cookies</a></div>
        </div>
        <p className="wm-legal">FixMargin is a trading name of Quantix Prime Ltd, registered in England &amp; Wales, company no. 16680674.</p>
      </div>
    </footer>
  );
}

function WelcomePage() {
  return (
    <div className="welcome-cover">
      <Header />
      <main>
        <Reveal as="section" className="wm-wrap wm-hero">
          <p>For UK drylining, ceilings and interiors subcontractors</p>
          <h1>Estimate it, buy it, build it, get paid for it. <span>Keep the margin you priced.</span></h1>
          <p className="wm-hero-copy">One job file for the whole contract: 3,054 manufacturer systems to costed BoQ, merchant prices, call-offs, programme, site reports, invoice checks and variations.</p>
          <div className="wm-actions">
            <Button asChild className="wm-button wm-button-primary wm-button-large"><Link to="/signup">Start free</Link></Button>
            <Button asChild variant="outline" className="wm-button wm-button-outline wm-button-large"><Link to="/login">Explore the demo</Link></Button>
          </div>
        </Reveal>
        <PhaseStrip />
        <Reveal as="section" className="wm-wrap wm-product-intro"><h2 id="product">Every step works off the BoQ you priced, so nothing gets re-keyed and nothing slips between office and site.</h2></Reveal>
        <div className="wm-wrap wm-features">
          <FeatureRow feature={FEATURE_COPY[0]} />
          <FeatureRow feature={FEATURE_COPY[1]} reverse />
          <FeatureRow feature={FEATURE_COPY[2]} id="site" />
          <FeatureRow feature={FEATURE_COPY[3]} reverse />
        </div>
        <Roles />
        <Reveal as="section" className="wm-wrap wm-pricing">
          <div>
            <h2>Free to start. Public prices, no sales call.</h2>
            <p>Free covers the calculator and one supplier price list on your own BoQ. Paid plans start at £399 a month with seats included. CSV and PDF exports on every paid plan. Coming next: payment applications, accounting and programme integrations (Xero, Sage, QuickBooks, MS Project).</p>
          </div>
          <Button asChild variant="outline" className="wm-button wm-button-outline"><Link to="/pricing">See all plans</Link></Button>
        </Reveal>
        <Reveal as="section" className="wm-wrap wm-final-wrap">
          <div className="wm-final-cta">
            <div><h2>Price it once. Keep it.</h2><p>Walk through the demo project on your own, or start free and open the same sample in your account.</p></div>
            <div className="wm-actions"><Button asChild className="wm-button wm-button-inverted wm-button-large"><Link to="/signup">Start free</Link></Button><Button asChild variant="outline" className="wm-button wm-button-inverted-outline wm-button-large"><Link to="/login">Explore the demo</Link></Button></div>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}