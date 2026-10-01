import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CalendarClock,
  Check,
  FileDiff,
  FileText,
  FileSpreadsheet,
  GitBranch,
  LibraryBig,
  Pause,
  Play,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const TITLE = "FixMargin — Cost control for UK drylining and interiors subcontractors";
const DESC =
  "Estimating, merchant price comparison, planner, call-offs, invoice checks and margin in one place for UK interiors subcontractors.";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://quantix-prime-flow.lovable.app/welcome" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "canonical", href: "https://quantix-prime-flow.lovable.app/welcome" },
    ],
  }),
  component: WelcomePage,
});

/* ---------- shared bits ---------- */

function SampleTag() {
  return (
    <span className="th-mono rounded-full border border-[var(--th-line-strong)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--th-muted)]">
      Sample data
    </span>
  );
}

function Window({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`th-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--th-line)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--th-line-strong)]" />
          <span className="text-xs font-medium text-[var(--th-muted)]">{title}</span>
        </div>
        <SampleTag />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" | "warn" }) {
  const c = tone === "good" ? "text-[var(--th-good)]" : tone === "bad" ? "text-[var(--th-bad)]" : tone === "warn" ? "text-[var(--th-warn)]" : "text-[var(--th-text)]";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--th-line)] py-2 text-[13px] last:border-0">
      <span className="text-[var(--th-muted)]">{k}</span>
      <span className={`th-mono ${c}`}>{v}</span>
    </div>
  );
}

/* ---------- showcase stages ---------- */

function StageSpec() {
  const walls = [
    ["W1", "Gypframe 70 S 50 C · 1× WallBoard 12.5", "30 min · 40 dB"],
    ["W2", "Gypframe 70 S 50 C · 2× FireLine 15", "60 min · 48 dB"],
    ["W3", "Gypframe 70 S 50 C · Isover APR", "30 min · 45 dB"],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <Window title="Specification · wall systems">
        {walls.map(([id, sys, perf]) => (
          <div key={id} className="flex items-center gap-3 border-b border-[var(--th-line)] py-2.5 last:border-0">
            <span className="th-mono rounded-md bg-[var(--th-panel-2)] px-2 py-1 text-xs">{id}</span>
            <span className="flex-1 text-[13px]">{sys}</span>
            <span className="th-mono text-[11px] text-[var(--th-muted)]">{perf}</span>
          </div>
        ))}
        <p className="mt-3 text-xs text-[var(--th-dim)]">600 centres · British Gypsum build-ups</p>
      </Window>
      <Window title="Drawing revisions">
        <Row k="A-201 rev C0" v="Tender" />
        <Row k="A-201 rev C1" v="Issued" />
        <Row k="A-201 rev C2" v="+18 m² W2" tone="warn" />
        <p className="mt-3 text-xs text-[var(--th-muted)]">Post-award change flagged for a variation.</p>
      </Window>
    </div>
  );
}

function StageCatalog() {
  const families = ["Partitions & walls", "Wall linings", "Shaftwalls", "Ceilings"];
  return (
    <div className="grid gap-4 md:grid-cols-[.75fr_1.25fr]">
      <Window title="System Catalog · families">
        <div className="space-y-1.5">
          {families.map((family, i) => (
            <div
              key={family}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs ${i === 0 ? "border border-[var(--th-accent)]/35 bg-[var(--th-accent)]/10 text-[var(--th-text)]" : "text-[var(--th-muted)]"}`}
            >
              <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[var(--th-accent)]" : "bg-[var(--th-line-strong)]"}`} />{family}</span>
              <span className="th-mono text-[10px]">{i < 3 ? "LIVE" : "BETA"}</span>
            </div>
          ))}
        </div>
      </Window>
      <Window title="Find a tested build-up">
        <div className="flex flex-wrap gap-2 border-b border-[var(--th-line)] pb-3 text-[10px]">
          {["60 min fire", "48+ dB", "4.0+ m", "British Gypsum"].map((filter) => (
            <span key={filter} className="rounded-full border border-[var(--th-accent)]/35 bg-[var(--th-accent)]/10 px-2.5 py-1 text-[var(--th-accent)]">{filter}</span>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-[var(--th-accent)]/40 bg-[var(--th-panel-2)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="th-mono text-[10px] text-[var(--th-accent)]">C-48/70-2L-FL15</p>
              <p className="mt-1 text-sm font-medium">GypWall CLASSIC · FireLine 15</p>
            </div>
            <span className="rounded-full bg-[var(--th-accent)] px-2.5 py-1 text-[10px] font-medium text-[var(--th-bg)]">Best match</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[["Fire", "60 min"], ["Acoustic", "48 dB"], ["Height", "4.2 m"]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-[var(--th-bg)]/35 p-2.5">
                <p className="text-[9px] text-[var(--th-dim)]">{k}</p><p className="th-mono mt-1 text-xs">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-12 items-stretch gap-1 overflow-hidden rounded-lg" aria-label="Wall build-up preview">
            <span className="w-3 bg-[var(--th-accent)]" /><span className="w-3 bg-[var(--th-accent)]/70" />
            <span className="flex-1 border-x border-[var(--th-line-strong)] bg-[var(--th-bg)]/50" />
            <span className="w-3 bg-[var(--th-accent)]/70" /><span className="w-3 bg-[var(--th-accent)]" />
          </div>
          <p className="mt-2 text-[10px] text-[var(--th-dim)]">2 × FireLine 15 · Gypframe 70 S 50 C @ 600 centres · 2 × FireLine 15</p>
        </div>
      </Window>
    </div>
  );
}

function StageCalculator() {
  const materials = [
    ["Gyproc FireLine 15", "72 sheets"],
    ["Gypframe 70 S 50 C", "37 lengths"],
    ["Gypframe 72 DC", "12 lengths"],
    ["Jointing & fixings", "1 allowance"],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
      <Window title="System Calculator · wall W2">
        <div className="grid grid-cols-3 gap-2">
          {[["Length", "18.0 m"], ["Height", "3.2 m"], ["Waste", "5%"]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-[var(--th-panel-2)] p-3">
              <p className="text-[10px] text-[var(--th-dim)]">{k}</p><p className="th-mono mt-1 text-xs">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-[var(--th-line)] p-3">
          <div className="flex items-center justify-between text-xs"><span className="text-[var(--th-muted)]">Calculated area</span><span className="th-mono">57.6 m²</span></div>
          <div className="mt-3 flex items-center justify-between text-xs"><span className="text-[var(--th-muted)]">Recommended board</span><span className="th-mono text-[var(--th-accent)]">1200 × 3200</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--th-line)]"><div className="th-progress h-full w-[92%] rounded-full bg-[var(--th-accent)]" style={{ animationDuration: "1100ms" }} /></div>
          <p className="mt-2 text-[10px] text-[var(--th-dim)]">Board length matched to wall height to reduce offcuts.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--th-panel-2)] p-3"><p className="text-[10px] text-[var(--th-dim)]">Materials</p><p className="th-mono mt-1 text-sm">£2,146.40</p></div>
          <div className="rounded-lg bg-[var(--th-panel-2)] p-3"><p className="text-[10px] text-[var(--th-dim)]">Labour</p><p className="th-mono mt-1 text-sm">£1,008.00</p></div>
        </div>
      </Window>
      <Window title="Calculated material schedule">
        <div>
          {materials.map(([item, qty], i) => (
            <div key={item} className="th-enter flex items-center justify-between gap-3 border-b border-[var(--th-line)] py-2.5 text-xs last:border-0" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="text-[var(--th-muted)]">{item}</span><span className="th-mono shrink-0">{qty}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-[var(--th-accent)]/35 bg-[var(--th-accent)]/10 p-3">
          <div className="flex items-center justify-between gap-3"><span className="text-xs">Total installed cost</span><span className="th-mono text-base text-[var(--th-accent)]">£3,154.40</span></div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--th-accent)]/20 pt-3 text-xs"><span className="text-[var(--th-muted)]">Ready for Harbour Yard BoQ</span><span className="flex items-center gap-1 text-[var(--th-accent)]">Add system <ArrowRight className="h-3 w-3" /></span></div>
        </div>
      </Window>
    </div>
  );
}

function StageBoq() {
  const rows = [
    ["WallBoard 12.5", "£4,260", "£4,175", "£4,118"],
    ["Gypframe 70 S 50 C", "£6,384", "£6,467", "£6,530"],
    ["FireLine 15", "£5,618", "£5,522", "£5,490"],
    ["C stud 4200", "£2,940", "—", "£2,996"],
  ];
  return (
    <Window title="Costed BoQ · merchant comparison">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--th-dim)]">
              <th className="pb-2 font-medium">Line</th>
              <th className="pb-2 font-medium">Northway</th>
              <th className="pb-2 font-medium">Castlegate</th>
              <th className="pb-2 font-medium">Meridian</th>
            </tr>
          </thead>
          <tbody className="th-mono">
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-[var(--th-line)]">
                <td className="py-2 font-sans">{r[0]}</td>
                {r.slice(1).map((c, i) => (
                  <td key={i} className={`py-2 ${c === "—" ? "text-[var(--th-bad)]" : ""}`}>{c === "—" ? "Not priced" : c}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-[var(--th-line-strong)] text-[var(--th-muted)]">
              <td className="py-2 font-sans">Totals</td>
              <td className="py-2">£37,354.00</td>
              <td className="py-2">£37,347.45</td>
              <td className="py-2">£37,186.60</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--th-accent)]/30 bg-[var(--th-accent)]/10 px-4 py-3">
        <span className="text-sm">Best mix across merchants</span>
        <span className="th-mono text-lg text-[var(--th-accent)]">£34,736.90</span>
      </div>
    </Window>
  );
}

function StagePlanner() {
  const tasks = [
    { t: "W2 partitions L2", s: 0, w: 38, p: 100, tone: "var(--th-good)" },
    { t: "W2 South L2", s: 22, w: 34, p: 62, tone: "var(--th-blue)" },
    { t: "W3 corridors L3", s: 40, w: 32, p: 38, tone: "var(--th-warn)" },
    { t: "W4 cores", s: 60, w: 30, p: 12, tone: "var(--th-blue)" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
      <Window title="Planner · Gantt">
        <div className="space-y-3">
          {tasks.map((x) => (
            <div key={x.t}>
              <div className="mb-1 flex justify-between text-xs"><span>{x.t}</span><span className="th-mono text-[var(--th-muted)]">{x.p}%</span></div>
              <div className="relative h-5 rounded bg-[var(--th-panel-2)]">
                <div className="absolute inset-y-0 rounded" style={{ left: `${x.s}%`, width: `${x.w}%`, background: `color-mix(in oklch, ${x.tone} 25%, transparent)` }}>
                  <div className="h-full rounded" style={{ width: `${x.p}%`, background: x.tone }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--th-muted)]"><GitBranch className="h-3.5 w-3.5" /> Finish-to-start links · milestone: L2 handover</p>
      </Window>
      <div className="space-y-4">
        <Window title="Auto call-offs">
          <p className="text-sm">2 call-offs suggested from lead times</p>
          <Row k="Castlegate · boards" v="send by 30 Apr" tone="warn" />
          <Row k="Meridian · studs" v="send by 4 May" />
        </Window>
        <Window title="Blockers">
          <Row k="W3 corridors" v="Material" tone="bad" />
        </Window>
      </div>
    </div>
  );
}

function StageDelivery() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Window title="GRN · CO-0002">
        <Row k="FireLine 15 ordered" v="240" />
        <Row k="Received on site" v="180" tone="warn" />
        <Row k="Shortfall" v="60 sheets" tone="bad" />
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--th-bad)]/10 px-3 py-2 text-xs text-[var(--th-bad)]">
          <AlertTriangle className="h-3.5 w-3.5" /> Shortfall held back from payment
        </div>
      </Window>
      <Window title="Daily site report">
        <Row k="Dryliners" v="6" />
        <Row k="Tapers" v="2" />
        <Row k="Delay" v="Hoist · 2 h" tone="warn" />
        <p className="mt-3 text-xs text-[var(--th-muted)]">Issue can be raised as a variation in one step.</p>
      </Window>
    </div>
  );
}

function StageInvoice() {
  return (
    <Window title="Invoice check · MER-2048">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Order", "240 @ £14.10"], ["Delivered", "180"], ["Invoiced", "240 @ £14.90"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[var(--th-panel-2)] p-3">
            <div className="text-[11px] uppercase tracking-wider text-[var(--th-dim)]">{k}</div>
            <div className="th-mono mt-1 text-sm">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1">
        <Row k="Quantity variance" v="+60 sheets" tone="bad" />
        <Row k="Rate variance" v="+£0.80 / sheet" tone="bad" />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--th-bad)]/30 bg-[var(--th-bad)]/10 px-4 py-3 text-sm">
        <span>Dispute drafted to Meridian</span>
        <ReceiptText className="h-4 w-4 text-[var(--th-bad)]" />
      </div>
    </Window>
  );
}

function StageCommercial() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Window title="Variations">
        <Row k="VAR-001 · signed" v="£1,080" tone="good" />
        <Row k="VAR-002 · unsigned" v="£600" tone="warn" />
      </Window>
      <Window title="Payments & forecast">
        <Row k="Application 1 · certified" v="£28,600" tone="good" />
        <Row k="Retention" v="3%" />
        <Row k="Forecast margin" v="18.4%" tone="good" />
      </Window>
    </div>
  );
}

const STAGES = [
  { n: "01", title: "Take-off & specification", copy: "Wall systems from British Gypsum, Siniat or Knauf build-ups, with drawing revisions tracked.", view: StageSpec },
  { n: "02", title: "System Catalog", copy: "Filter tested build-ups by system family, fire, acoustic and height requirements, then inspect every layer.", view: StageCatalog },
  { n: "03", title: "System Calculator", copy: "Size the wall, optimise board lengths and turn the selected build-up into a complete material and labour schedule.", view: StageCalculator },
  { n: "04", title: "Costed BoQ", copy: "One BoQ priced against every merchant list. Missing prices exposed, best mix calculated.", view: StageBoq },
  { n: "05", title: "Planner & auto call-offs", copy: "Programme with linked tasks. Lead times turn into suggested call-offs before crews run dry.", view: StagePlanner },
  { n: "06", title: "Deliveries & site", copy: "GRNs record what actually arrived. Daily reports log crews and delays.", view: StageDelivery },
  { n: "07", title: "Invoice checks", copy: "Order, delivery and invoice matched before you pay. Variances become disputes.", view: StageInvoice },
  { n: "08", title: "Variations & final account", copy: "Signed and unsigned variations, applications, retention and a live margin forecast.", view: StageCommercial },
];

const DURATION = 6000;

function Showcase() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const running = playing && !hover;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => setActive((a) => (a + 1) % STAGES.length), DURATION);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, running]);

  const View = STAGES[active].view;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12">
      <div>
        <ol className="space-y-1">
          {STAGES.map((s, i) => {
            const on = i === active;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => { setActive(i); setPlaying(false); }}
                  className={`w-full border-b border-[var(--th-line)] py-4 text-left transition-colors ${on ? "" : "opacity-55 hover:opacity-90"}`}
                  aria-current={on}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="th-mono text-xs text-[var(--th-dim)]">{s.n}</span>
                    <span className="text-lg">{s.title}</span>
                  </div>
                  {on && (
                    <>
                      <p className="th-enter mt-2 pl-8 text-sm leading-relaxed text-[var(--th-muted)]">{s.copy}</p>
                      <div className="mt-3 ml-8 h-0.5 overflow-hidden rounded bg-[var(--th-line)]">
                        <div
                          key={`${active}-${running}`}
                          className={`h-full bg-[var(--th-accent)] ${running ? "th-progress" : "opacity-40"}`}
                          style={running ? { animationDuration: `${DURATION}ms` } : undefined}
                        />
                      </div>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--th-line-strong)] hover:bg-[var(--th-panel)]"
            aria-label={playing ? "Pause presentation" : "Play presentation"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <span className="th-mono text-xs text-[var(--th-dim)]">{active + 1} / {STAGES.length}</span>
        </div>
      </div>
      <div
        className="min-w-0 rounded-[26px] border border-[var(--th-line)] bg-[var(--th-panel)]/40 p-3 sm:p-6"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div key={active} className="th-enter">
          <View />
        </div>
      </div>
    </div>
  );
}

/* ---------- roles ---------- */

const ROLES = [
  {
    id: "md", label: "Managing Director", eyebrow: "Portfolio control", summary: "See commercial health across every live job without opening separate spreadsheets.",
    points: ["Live margin forecast on every job", "Portfolio exceptions and overdue actions", "PDF management reports ready to share"],
    stats: [["Contract value", "£104,800"], ["Forecast margin", "18.4%"], ["Progress", "42%"]],
    activity: [["Harbour Yard", "Healthy", "good"], ["Applications", "£28,600 certified", "good"], ["Open dispute", "1 needs review", "warn"]],
  },
  {
    id: "cd", label: "Commercial Director", eyebrow: "Commercial control", summary: "Keep entitlement, payment dates and evidence visible from one commercial workspace.",
    points: ["Variations signed or flagged", "Applications, notices and retention tracked", "Invoice disputes with evidence attached"],
    stats: [["Signed variations", "£1,080"], ["Unsigned", "£600"], ["Retention", "3%"]],
    activity: [["VAR-001", "Signed", "good"], ["VAR-002", "Awaiting signature", "warn"], ["MER-2048", "Dispute drafted", "bad"]],
  },
  {
    id: "qs", label: "Estimator / QS", eyebrow: "Estimate to account", summary: "Carry measured quantities and drawing changes through buying, valuation and final account.",
    points: ["Manufacturer system build-ups", "Drawing revisions compared with tender", "Costed BoQ and PDF reports"],
    stats: [["Wall systems", "5"], ["Drawing revision", "C2"], ["Best mix", "£34,736.90"]],
    activity: [["A-201 rev C2", "+18 m² W2", "warn"], ["Castlegate", "List compared", "good"], ["C stud 4200", "Price missing", "bad"]],
  },
  {
    id: "buyer", label: "Buyer", eyebrow: "Procurement desk", summary: "Buy against the programme and reconcile what was ordered, delivered and invoiced.",
    points: ["Suggested call-offs from the programme", "Supplier lists compared line by line", "Invoices matched before payment"],
    stats: [["Call-offs", "3"], ["Due this week", "2"], ["Shortfall", "60 sheets"]],
    activity: [["CO-0001", "Delivered", "good"], ["CO-0002", "Short delivery", "bad"], ["CO-0003", "Draft", "warn"]],
  },
  {
    id: "manager", label: "Site Manager", eyebrow: "Site overview", summary: "Connect the live programme with labour, deliveries, delays and work completed on site.",
    points: ["Planner progress and blockers", "Daily reports, labour and photos", "Delivery shortfalls and site issues"],
    stats: [["Progress", "42%"], ["Operatives", "8"], ["Blockers", "1"]],
    activity: [["W2 South L2", "62% complete", "good"], ["W3 corridors", "Material blocker", "bad"], ["Hoist delay", "2 hours logged", "warn"]],
  },
  {
    id: "supervisor", label: "Site Supervisor", eyebrow: "Today's workface", summary: "Run the shift from assigned areas, record progress and leave a clear evidence trail.",
    points: ["Tasks and priorities for the day", "Crew and progress capture", "Issues raised with photos and notes"],
    stats: [["Tasks today", "4"], ["Crew", "6 + 2"], ["Reports", "1 due"]],
    activity: [["W2 South L2", "Continue boarding", "good"], ["W3 corridors", "Awaiting material", "bad"], ["Daily report", "Ready to submit", "warn"]],
  },
  {
    id: "operative", label: "Operative", eyebrow: "My work", summary: "See only the work assigned to you and submit simple, structured site updates.",
    points: ["Assigned tasks and locations", "Simple progress and issue forms", "No access to sensitive commercial figures"],
    stats: [["Assigned", "2 tasks"], ["Completed", "1"], ["Next area", "L2 South"]],
    activity: [["Board W2 partitions", "In progress", "good"], ["Upload site photo", "Required", "warn"], ["Commercial data", "Restricted", "neutral"]],
  },
];

function RoleVisual({ selected }: { selected: (typeof ROLES)[number] }) {
  return (
    <div className="th-card min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--th-line)] px-5 py-4 sm:px-6">
        <div>
          <p className="th-mono text-[10px] uppercase tracking-wider text-[var(--th-accent)]">{selected.eyebrow}</p>
          <h3 className="mt-1 text-lg font-medium">{selected.label} workspace</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--th-line)] px-3 py-1.5 text-xs text-[var(--th-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--th-accent)]" /> Permission-aware view
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="min-w-0">
          <div className="grid grid-cols-3 gap-2.5">
            {selected.stats.map(([label, value], i) => (
              <div key={label} className="rounded-xl bg-[var(--th-panel-2)] p-3">
                <p className="truncate text-[10px] text-[var(--th-dim)] sm:text-[11px]">{label}</p>
                <p className="th-mono mt-1 truncate text-xs sm:text-sm">{value}</p>
                <div className="mt-2 h-0.5 overflow-hidden rounded bg-[var(--th-line)]">
                  <div className="th-progress h-full bg-[var(--th-accent)]" style={{ animationDuration: `${650 + i * 180}ms`, width: `${82 - i * 17}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-[var(--th-line)] px-4">
            {selected.activity.map(([label, value, tone], i) => {
              const colour = tone === "good" ? "var(--th-good)" : tone === "bad" ? "var(--th-bad)" : tone === "warn" ? "var(--th-warn)" : "var(--th-dim)";
              return (
                <div key={label} className="th-enter flex items-center justify-between gap-3 border-b border-[var(--th-line)] py-3 text-xs last:border-0" style={{ animationDelay: `${i * 90}ms` }}>
                  <span className="flex min-w-0 items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colour }} /><span className="truncate">{label}</span></span>
                  <span className="th-mono shrink-0 text-right text-[10px] text-[var(--th-muted)] sm:text-xs">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-[var(--th-panel-2)] p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--th-dim)]">What this role sees</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--th-muted)]">{selected.summary}</p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[var(--th-line)] pt-4 text-xs">
            <span className="flex items-center gap-2 text-[var(--th-muted)]"><FileText className="h-4 w-4 text-[var(--th-accent)]" /> PDF & CSV exports</span>
            <span className="th-mono text-[var(--th-accent)]">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Roles() {
  const [role, setRole] = useState(0);
  const selected = ROLES[role];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {ROLES.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(i)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm transition-colors ${i === role ? "bg-[var(--th-accent)] text-[var(--th-bg)]" : "bg-[var(--th-panel)] text-[var(--th-muted)] hover:text-[var(--th-text)]"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div key={`copy-${role}`} className="th-enter mt-6 grid gap-4 sm:grid-cols-3">
        {selected.points.map((p) => (
          <div key={p} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--th-accent)]" />
            <span className="text-[15px] leading-relaxed">{p}</span>
          </div>
        ))}
      </div>
      <div key={`visual-${role}`} className="th-enter mt-6">
        <RoleVisual selected={selected} />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

const BENTO = [
  { icon: LibraryBig, title: "System Catalog", copy: "Find tested partitions, linings, shaftwalls and ceilings by performance requirement." },
  { icon: Calculator, title: "System Calculator", copy: "Turn dimensions and a selected build-up into optimised quantities, labour and cost." },
  { icon: CalendarClock, title: "MS Project import & sync", copy: "Bring the main contractor's programme in and keep it aligned." },
  { icon: Users, title: "Four roles, clear permissions", copy: "Admin, Pro Control, Pro and Operative — with an audit log." },
  { icon: ShieldCheck, title: "Payment notices", copy: "Applications, payment and pay less notice dates tracked per cycle." },
  { icon: FileSpreadsheet, title: "CSV and PDF exports", copy: "Export drawing registers, progress reports and project data when you need them." },
  { icon: FileDiff, title: "Tender pipeline", copy: "Follow-ups, award handoff and a locked commercial baseline." },
  { icon: Truck, title: "Supplier register", copy: "Your merchants, your price lists, nothing invented." },
];

function WelcomePage() {
  return (
    <div className="welcome-thrive min-h-screen overflow-x-hidden">
      {/* nav */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/welcome" aria-label="FixMargin home"><Logo light /></Link>
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--th-line)] bg-[var(--th-panel)]/80 px-2 py-1.5 backdrop-blur md:flex">
            {[["Platform", "#platform"], ["Workflow", "#workflow"], ["Roles", "#roles"]].map(([l, h]) => (
              <a key={h} href={h} className="rounded-full px-4 py-1.5 text-sm text-[var(--th-muted)] hover:text-[var(--th-text)]">{l}</a>
            ))}
            <Link to="/pricing" className="rounded-full px-4 py-1.5 text-sm text-[var(--th-muted)] hover:text-[var(--th-text)]">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden px-3 text-sm text-[var(--th-muted)] hover:text-[var(--th-text)] sm:block">Sign in</Link>
            <Link to="/signup" className="flex items-center gap-1.5 rounded-full bg-[var(--th-text)] px-4 py-2 text-sm font-medium text-[var(--th-bg)]">
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-24">
          <div className="min-w-0">
            <p className="mb-6 text-sm text-[var(--th-muted)]">For UK drylining, ceilings and interiors subcontractors</p>
            <h1 className="th-serif text-[52px] leading-[0.98] sm:text-7xl lg:text-[88px]">
              Keep the margin <em className="text-[var(--th-accent)]">you priced.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--th-muted)]">
              From take-off to final account — merchant prices compared, call-offs planned from the programme, deliveries and invoices checked before you pay.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/signup" className="flex items-center gap-2 rounded-full bg-[var(--th-text)] px-6 py-3 font-medium text-[var(--th-bg)]">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflow" className="rounded-full bg-[var(--th-panel-2)] px-6 py-3 text-[var(--th-text)] hover:bg-[var(--th-panel)]">See how it works</a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--th-dim)]">
              {["No card required", "Built around UK trade practice", "CSV & PDF exports"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[var(--th-accent)]" />{t}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] min-w-0 pb-16 pt-14">
            <Window title="Harbour Yard Offices · L2–3 fit-out">
              <div className="grid grid-cols-3 gap-3">
                {[["Contract", "£104,800"], ["Progress", "42%"], ["Forecast", "18.4%"]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-[var(--th-panel-2)] p-3">
                    <div className="text-[11px] text-[var(--th-dim)]">{k}</div>
                    <div className="th-mono mt-1 text-base sm:text-lg">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[["Estimate", 100], ["Procurement", 80], ["Site", 42], ["Commercial", 30]].map(([k, v]) => (
                  <div key={k as string} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-[var(--th-muted)]">{k}</span>
                    <div className="h-1.5 flex-1 rounded bg-[var(--th-panel-2)]"><div className="h-full rounded bg-[var(--th-blue)]" style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
            </Window>
            <div className="th-float-a th-card absolute -top-8 right-0 w-56 p-3.5 sm:-right-6">
              <div className="flex items-center gap-2 text-xs text-[var(--th-warn)]"><Truck className="h-3.5 w-3.5" /> GRN · CO-0002</div>
              <p className="mt-1.5 text-sm">180 of 240 sheets received</p>
            </div>
            <div className="th-float-b th-card absolute bottom-0 left-0 w-64 p-3.5 sm:-left-8">
              <div className="flex items-center gap-2 text-xs text-[var(--th-bad)]"><AlertTriangle className="h-3.5 w-3.5" /> Invoice MER-2048</div>
              <p className="mt-1.5 text-sm">Billed £14.90 vs agreed £14.10</p>
            </div>
          </div>
        </section>

        {/* intro */}
        <section id="platform" className="mx-auto grid max-w-7xl gap-8 border-t border-[var(--th-line)] px-5 py-24 lg:grid-cols-2 lg:items-end">
          <h2 className="th-serif text-5xl leading-[1.02] sm:text-6xl">One job file, <em>from tender to final account.</em></h2>
          <p className="max-w-lg text-lg leading-relaxed text-[var(--th-muted)]">
            Estimating, buying, site and commercial usually live in five places. FixMargin keeps them on one project, so a change on the drawing reaches the BoQ, the programme, the call-off and the invoice.
          </p>
        </section>

        {/* showcase */}
        <section id="workflow" className="mx-auto max-w-7xl px-5 pb-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="th-serif text-4xl sm:text-5xl">The workflow, <em>live.</em></h2>
            <p className="flex items-center gap-2 text-sm text-[var(--th-dim)]"><Sparkles className="h-3.5 w-3.5" /> Fictional sample project · hover to pause</p>
          </div>
          <Showcase />
        </section>

        {/* bento */}
        <section className="mx-auto max-w-7xl border-t border-[var(--th-line)] px-5 py-28">
          <h2 className="th-serif max-w-3xl text-4xl leading-[1.05] sm:text-5xl">Built for how a <em>subcontractor</em> actually runs a job.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENTO.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="th-card p-6 transition-colors hover:border-[var(--th-line-strong)]">
                <Icon className="h-5 w-5 text-[var(--th-accent)]" />
                <h3 className="mt-5 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--th-muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* roles */}
        <section id="roles" className="mx-auto max-w-7xl px-5 pb-28">
          <h2 className="th-serif mb-10 text-4xl sm:text-5xl">One platform, <em>every seat.</em></h2>
          <Roles />
        </section>

        {/* cta */}
        <section className="mx-auto max-w-7xl px-5 pb-24">
          <div className="th-card relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-24">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 w-[640px] max-w-full rounded-full bg-[var(--th-blue)]/20 blur-3xl" />
            <h2 className="th-serif relative text-5xl sm:text-6xl">Price it once. <em className="text-[var(--th-accent)]">Keep it.</em></h2>
            <p className="relative mx-auto mt-5 max-w-lg text-[var(--th-muted)]">Start with the sample project, then set up your first real job.</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/signup" className="rounded-full bg-[var(--th-text)] px-6 py-3 font-medium text-[var(--th-bg)]">Start free — no card required</Link>
              <Link to="/pricing" className="rounded-full border border-[var(--th-line-strong)] px-6 py-3 hover:bg-[var(--th-panel-2)]">Compare plans</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--th-line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-[var(--th-dim)] md:flex-row md:items-center md:justify-between">
          <div>
            <Logo light />
            <p className="mt-3 max-w-md">FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales, company number 16680674.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link to="/pricing" className="hover:text-[var(--th-text)]">Pricing</Link>
            <a href="/privacy" className="hover:text-[var(--th-text)]">Privacy</a>
            <a href="/terms" className="hover:text-[var(--th-text)]">Terms</a>
            <a href="/cookies" className="hover:text-[var(--th-text)]">Cookies</a>
            <Link to="/login" className="hover:text-[var(--th-text)]">Sign in</Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
