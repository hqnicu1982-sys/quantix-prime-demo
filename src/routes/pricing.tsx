import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { Check, X, Sparkles, Star } from "lucide-react";
import { Card, CardHead, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Quantix Prime" },
      {
        name: "description",
        content:
          "Quantix Prime pricing for specialty contractors. Free calculator, Starter, Growth, Scale and Enterprise tiers with monthly, annual, 2-year and 3-year commitments.",
      },
      { property: "og:title", content: "Pricing — Quantix Prime" },
      {
        property: "og:description",
        content:
          "Pricing that pays for itself. Recover 1 point of margin and Quantix pays back many times over.",
      },
    ],
  }),
  component: PricingPage,
});

type Commit = "monthly" | "annual" | "2yr" | "3yr";

const COMMITS: { id: Commit; label: string; note?: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual", note: "−20%" },
  { id: "2yr", label: "2-year", note: "−25%" },
  { id: "3yr", label: "3-year", note: "−30%" },
];

const PRICES: Record<"starter" | "growth" | "scale", Record<Commit, number>> = {
  starter: { monthly: 399, annual: 319, "2yr": 299, "3yr": 279 },
  growth: { monthly: 999, annual: 799, "2yr": 749, "3yr": 699 },
  scale: { monthly: 2499, annual: 1999, "2yr": 1874, "3yr": 1749 },
};

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

function PricingPage() {
  const [commit, setCommit] = useState<Commit>("annual");

  const founderScale = useMemo(
    () => Math.round(PRICES.scale.annual * 0.7),
    [],
  );

  return (
    <div className="space-y-14">
      {/* HERO */}
      <Section
        title="Pricing that pays for itself"
        subtitle="A typical £15M specialty contractor loses 2–4 points of margin a year to estimating, buying and site inefficiency. Quantix recovering even 1 point is worth £150k."
      >
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--ink-200)] bg-card p-1.5 w-fit">
          {COMMITS.map((c) => {
            const active = commit === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCommit(c.id)}
                className={cn(
                  "rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-[var(--ink-900)] text-white"
                    : "text-[var(--ink-700)] hover:bg-[var(--ink-100)]",
                )}
              >
                <span>{c.label}</span>
                {c.note && (
                  <span
                    className={cn(
                      "ml-2 text-[11px] font-semibold",
                      active ? "text-white/80" : "text-[var(--green-600)]",
                    )}
                  >
                    {c.note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* FOUNDING RIBBON */}
      <a
        href="#founding"
        className="block rounded-[10px] border border-[var(--accent-500)]/40 bg-[var(--accent-500)]/10 px-5 py-3 transition-colors hover:bg-[var(--accent-500)]/15"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--ink-900)]">
            <Sparkles className="h-4 w-4 text-[var(--accent-500)]" />
            <span className="font-semibold">Founding Customer Programme</span>
            <span className="text-[var(--ink-500)]">
              — the first 20 customers get an extra 30% off for 24 months. 14 of
              20 spots remaining.
            </span>
          </div>
          <span className="text-[12px] font-medium text-[var(--accent-500)]">
            Learn more →
          </span>
        </div>
      </a>

      {/* TIER CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TierCard
          name="Free"
          price="£0"
          per=""
          blurb="Try the estimator"
          features={[
            "Calculator only (1,547 manufacturer-verified systems)",
            "50 takeoffs per month · 1 project · 2 users",
            "“Powered by Quantix Prime” footer on PDF/XLSX exports",
          ]}
          cta="Start free"
        />
        <TierCard
          name="Starter"
          price={fmt(PRICES.starter[commit])}
          per="/mo"
          blurb="For sole traders and micro contractors under £2M revenue."
          features={[
            "1 Admin seat · 2 Pro Control seats · 5 Operative seats",
            "3 active projects",
            "Calculator + Costed BoQ + Call-offs + Invoice Reconciliation",
            "Xero integration",
          ]}
          cta="Start with Starter"
        />
        <TierCard
          name="Growth"
          price={fmt(PRICES.growth[commit])}
          per="/mo"
          blurb="For mid-market specialty contractors, £2–10M revenue."
          features={[
            "3 Admin seats · 5 Pro Control seats · 15 Operative seats",
            "10 active projects",
            "Everything in Starter, plus Planner, Material Readiness, Daily Site Report, full Variations, full Invoice Reconciliation",
            "All integrations: Xero, QuickBooks, Sage, Asta, MS Project, Procore, Slack, Teams",
          ]}
          cta="Start with Growth"
          highlight
        />
        <TierCard
          name="Scale"
          price={fmt(PRICES.scale[commit])}
          per="/mo"
          blurb="For mature specialty contractors, £10–50M revenue."
          features={[
            "10 Admin seats · 15 Pro Control seats · 100 Operative seats",
            "Unlimited projects",
            "Everything in Growth, plus API access, custom reports, dedicated success manager",
            "Custom integration support",
          ]}
          cta="Start with Scale"
        />
        <TierCard
          name="Enterprise"
          price="Custom"
          per=""
          blurb="For £50M+ contractors and multi-region operations."
          features={[
            "SSO",
            "Dedicated infrastructure",
            "99.9% uptime SLA",
            "White-label option",
          ]}
          cta="Talk to us"
        />
      </div>

      {/* SEAT ADD-ONS */}
      <Card>
        <CardHead
          title="Grow without jumping tiers"
          subtitle="Available on any paid tier."
        />
        <div className="grid grid-cols-1 divide-y divide-[var(--ink-200)] md:grid-cols-4 md:divide-y-0 md:divide-x">
          {[
            { name: "Extra Admin seat", price: "£49/mo" },
            { name: "Extra Pro Control seat", price: "£29/mo" },
            { name: "Operative pack (25 seats)", price: "£99/mo" },
            { name: "Additional active project", price: "£25/mo" },
          ].map((a) => (
            <div key={a.name} className="px-5 py-4">
              <p className="text-[12px] font-medium text-[var(--ink-500)]">
                {a.name}
              </p>
              <p className="font-display mt-1 text-[20px] font-semibold text-[var(--ink-900)]">
                {a.price}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* FEATURE COMPARISON */}
      <ComparisonTable />

      {/* FOUNDING CUSTOMER SECTION */}
      <section id="founding" className="scroll-mt-20 space-y-5">
        <div>
          <h2 className="font-display text-[24px] font-semibold text-[var(--ink-900)]">
            Founding Customer Programme
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-500)]">
            Shape the product with us. Save while you do.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHead title="What you get" />
            <ul className="space-y-3 px-5 py-4 text-[13px] text-[var(--ink-700)]">
              {[
                "30% off for 24 months on top of any commitment discount",
                "Locked-in rate",
                "Founding Customer badge",
                "Early access to new features",
                "Direct line to the founder",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-600)]" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="What we ask" />
            <ul className="space-y-3 px-5 py-4 text-[13px] text-[var(--ink-700)]">
              {[
                "One published case study after 3 months",
                "2 reference calls a year",
                "A 30-minute quarterly feedback session",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card className="border-[var(--accent-500)]/40 bg-[var(--accent-500)]/5">
          <div className="px-5 py-4 text-[13px] text-[var(--ink-700)]">
            <span className="font-semibold text-[var(--ink-900)]">
              Worked example:
            </span>{" "}
            Scale, annual commitment: {fmt(PRICES.scale.annual)} → {fmt(founderScale)}/mo as a
            Founding Customer — £14,400 saved over 24 months.
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-5">
        <h2 className="font-display text-[24px] font-semibold text-[var(--ink-900)]">
          Frequently asked
        </h2>
        <Card>
          <Accordion type="single" collapsible className="px-5">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="border-[var(--ink-200)]">
                <AccordionTrigger className="text-left text-[13px] font-semibold text-[var(--ink-900)]">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-[var(--ink-700)]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>
    </div>
  );
}

function TierCard({
  name,
  price,
  per,
  blurb,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  per: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        highlight &&
          "border-[var(--accent-500)] shadow-[0_4px_24px_rgba(15,40,71,0.08)] ring-1 ring-[var(--accent-500)]/30",
      )}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--ink-900)]">
          {name}
        </h3>
        {highlight && (
          <Badge className="gap-1 bg-[var(--accent-500)] text-white hover:bg-[var(--accent-500)]">
            <Star className="h-3 w-3" />
            Most popular
          </Badge>
        )}
      </div>
      <div className="px-5 pt-3">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[32px] font-semibold leading-none text-[var(--ink-900)]">
            {price}
          </span>
          {per && (
            <span className="text-[13px] text-[var(--ink-500)]">{per}</span>
          )}
        </div>
        <p className="mt-2 text-[12px] text-[var(--ink-500)]">{blurb}</p>
      </div>
      <ul className="mt-4 flex-1 space-y-2.5 px-5 pb-5 text-[13px] text-[var(--ink-700)]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-600)]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--ink-200)] p-4">
        <Button
          className={cn(
            "w-full",
            highlight
              ? "bg-[var(--accent-500)] text-white hover:bg-[var(--accent-500)]/90"
              : "",
          )}
          variant={highlight ? "default" : "outline"}
        >
          {cta}
        </Button>
      </div>
    </Card>
  );
}

type Cell = boolean | string;
type Row = { label: string; cells: [Cell, Cell, Cell, Cell, Cell] };
type Group = { title: string; rows: Row[] };

const GROUPS: Group[] = [
  {
    title: "Estimating",
    rows: [
      { label: "Calculator", cells: ["50 takeoffs/mo", true, true, true, true] },
      { label: "Costed BoQ", cells: [false, true, true, true, true] },
      { label: "Price Intelligence", cells: [false, false, true, true, true] },
    ],
  },
  {
    title: "Procurement",
    rows: [
      { label: "Call-offs", cells: [false, true, true, true, true] },
      { label: "Purchase Orders", cells: [false, true, true, true, true] },
      { label: "GRN", cells: [false, true, true, true, true] },
      { label: "Invoice Reconciliation", cells: [false, true, true, true, true] },
      { label: "Variations", cells: [false, false, true, true, true] },
    ],
  },
  {
    title: "Site",
    rows: [
      { label: "Planner", cells: [false, false, true, true, true] },
      { label: "Material Readiness", cells: [false, false, true, true, true] },
      { label: "Daily Site Report", cells: [false, false, true, true, true] },
    ],
  },
  {
    title: "Organisation",
    rows: [
      { label: "Team & Roles", cells: [false, true, true, true, true] },
      { label: "Integrations", cells: [false, "Xero", "All", "All + custom", "All + custom"] },
      { label: "API access", cells: [false, false, false, true, true] },
      { label: "Custom reports", cells: [false, false, false, true, true] },
      { label: "Success manager", cells: [false, false, false, true, true] },
    ],
  },
];

function CellNode({ v }: { v: Cell }) {
  if (v === true)
    return <Check className="mx-auto h-4 w-4 text-[var(--green-600)]" />;
  if (v === false)
    return <X className="mx-auto h-4 w-4 text-[var(--ink-300)]" />;
  return (
    <span className="text-[12px] font-medium text-[var(--ink-700)]">{v}</span>
  );
}

function ComparisonTable() {
  const cols = ["Free", "Starter", "Growth", "Scale", "Enterprise"];
  return (
    <Card>
      <CardHead title="Compare plans" />
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--ink-200)] bg-[var(--ink-50)]">
              <th className="px-5 py-3 text-left font-semibold text-[var(--ink-500)]">
                Feature
              </th>
              {cols.map((c) => (
                <th
                  key={c}
                  className={cn(
                    "px-4 py-3 text-center font-semibold text-[var(--ink-700)]",
                    c === "Growth" && "bg-[var(--accent-500)]/5 text-[var(--accent-500)]",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.title}>
                <tr className="bg-[var(--ink-50)]/50">
                  <td
                    colSpan={6}
                    className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
                  >
                    {g.title}
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <tr
                    key={r.label}
                    className="border-t border-[var(--ink-200)]"
                  >
                    <td className="px-5 py-3 text-[var(--ink-900)]">
                      {r.label}
                    </td>
                    {r.cells.map((c, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-4 py-3 text-center",
                          i === 2 && "bg-[var(--accent-500)]/5",
                        )}
                      >
                        <CellNode v={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const FAQS = [
  {
    q: "What counts as an active project?",
    a: "Only projects in Active stage count toward your limit. Tender-stage projects are free and unlimited.",
  },
  {
    q: "What happens when I hit my seat limit?",
    a: "Add individual seats or packs from the add-ons above, or upgrade tier — whichever is cheaper for you. No lockouts: existing users keep working.",
  },
  {
    q: "Can I change commitment level later?",
    a: "You can move to a longer commitment at any time; the discount applies from the next billing cycle.",
  },
  {
    q: "What happens after the Founding Customer 24 months?",
    a: "Your price moves to the regular rate for your commitment level. Your commitment discount stays.",
  },
  {
    q: "Do Operatives really count as users?",
    a: "Yes, and they're deliberately cheap — bundled in every tier so putting your whole site workforce on Quantix is a yes/no decision, not a spreadsheet exercise.",
  },
];