import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, ExternalLink, FileText, LogOut, Trash2 } from "lucide-react";
import { Card, CardHead, Section } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { PlanCard, PlanStateSwitcher, usePlanPreset } from "@/components/account/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/currentUser";
import { useSession, signOut } from "@/lib/authSession";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Quantix Prime" },
      { name: "description", content: "Manage your profile, workspace plan and seats, invoices, organisation details and data requests." },
      { property: "og:title", content: "Account — Quantix Prime" },
      { property: "og:description", content: "Manage your profile, workspace plan and seats, invoices, organisation details and data requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const TIER_TONE = {
  Admin: "warning",
  "Pro Control": "info",
  Pro: "success",
  Operative: "neutral",
} as const;

type ThemePref = "light" | "dark" | "system";

const INVOICES = [
  { date: "12 Mar 2026", desc: "Starter — annual subscription", amount: "£3,828.00", status: "Paid" as const },
  { date: "12 Mar 2025", desc: "Starter — annual subscription", amount: "£3,828.00", status: "Paid" as const },
  { date: "02 Apr 2026", desc: "Additional Operative seat (pro-rata)", amount: "£214.00", status: "Due" as const },
];

const SEATS = [
  { label: "Admin", used: 1, total: 1 },
  { label: "Pro Control", used: 1, total: 2 },
  { label: "Operative", used: 3, total: 5 },
];

function AccountPage() {
  const me = useCurrentUser();
  const session = useSession();
  const navigate = useNavigate();
  const canEditOrg = useCan("manage.users");
  const planPreset = usePlanPreset();

  const [name, setName] = useState(me.name);
  const [jobTitle, setJobTitle] = useState(me.role);
  const [theme, setTheme] = useState<ThemePref>("system");

  useEffect(() => {
    setName(me.name);
    setJobTitle(me.role);
  }, [me.id, me.name, me.role]);

  useEffect(() => {
    const stored = localStorage.getItem("qp-theme") as ThemePref | null;
    if (stored === "light" || stored === "dark" || stored === "system") setTheme(stored);
  }, []);

  const applyTheme = (next: ThemePref) => {
    setTheme(next);
    localStorage.setItem("qp-theme", next);
    const dark =
      next === "dark" ||
      (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  const saveProfile = () => {
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    toast.success("Profile updated");
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out");
    navigate({ to: "/login", search: { redirect: undefined } });
  };

  return (
    <Section title="Account" subtitle="Your profile, your plan, and your workspace.">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4 lg:col-span-2">
          {/* Profile */}
          <Card>
            <CardHead title="Profile" subtitle="How you appear across the workspace" />
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-100)] text-[14px] font-bold text-[var(--ink-700)]">
                  {me.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-[var(--ink-900)]">{me.name}</p>
                    <StatusBadge tone={TIER_TONE[me.tier]}>{me.tier}</StatusBadge>
                  </div>
                  <p className="text-[12.5px] text-[var(--ink-500)]">
                    {me.role} · {session?.email ?? me.email ?? "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Job title">
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input value={session?.email ?? me.email ?? ""} readOnly disabled />
                  <p className="mt-1.5 text-[11.5px] text-[var(--ink-500)]">
                    Contact support to change your email.
                  </p>
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
                  Theme preference
                </p>
                <div className="inline-flex rounded-md border border-[var(--ink-200)] p-0.5">
                  {(["light", "dark", "system"] as ThemePref[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => applyTheme(t)}
                      className={cn(
                        "rounded px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                        theme === t
                          ? "bg-[var(--accent-500)]/10 text-[var(--accent-500)]"
                          : "text-[var(--ink-500)] hover:bg-[var(--ink-50)]",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Button size="sm" onClick={saveProfile}>Save changes</Button>
              </div>
            </div>
          </Card>

          {/* Plan */}
          <PlanStateSwitcher activeKey={planPreset.key} onSelect={planPreset.setKey} />
          <PlanCard workspacePlan={planPreset.value} />

          {/* Seats */}
          <Card>
            <CardHead title="Seats" subtitle="What your workspace includes today" />
            <div className="space-y-5 p-5">
              <div className="space-y-3">
                {SEATS.map((s) => (
                  <SeatRow key={s.label} label={s.label} used={s.used} total={s.total} />
                ))}
                <SeatRow label="Active projects" used={2} total={3} />
              </div>

              <p className="text-[11.5px] text-[var(--ink-500)]">
                Plan changes are handled by the FixMargin team and invoiced manually.
              </p>
            </div>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHead title="Invoices" subtitle="Your billing history" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--ink-200)] text-left text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Description</th>
                    <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICES.map((inv) => (
                    <tr key={inv.date + inv.desc} className="border-b border-[var(--ink-200)] last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--ink-700)]">{inv.date}</td>
                      <td className="px-5 py-3 text-[var(--ink-900)]">{inv.desc}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-[var(--ink-900)]">{inv.amount}</td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={inv.status === "Paid" ? "success" : "warning"}>{inv.status}</StatusBadge>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toast.success("Invoice download started")}
                          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--accent-500)] hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--ink-200)] px-5 py-4">
              <Button size="sm" variant="outline" onClick={() => toast.info("Opening billing portal")}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open billing portal
              </Button>
              <p className="text-[11.5px] text-[var(--ink-500)]">
                Update payment details and download invoices.
              </p>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Organisation */}
          <Card>
            <CardHead
              title="Organisation"
              right={
                canEditOrg ? (
                  <Button size="sm" variant="outline" onClick={() => toast.info("Organisation editing coming soon")}>
                    Edit
                  </Button>
                ) : undefined
              }
            />
            <dl className="divide-y divide-[var(--ink-200)] text-[13px]">
              <OrgRow label="Company name" value="Quantix Drylining Ltd" />
              <OrgRow label="Company number" value="09482731" />
              <OrgRow label="Registered address" value="Unit 4, Bermondsey Works, London SE16 4DG" />
              <OrgRow label="VAT number" value="GB 384 9210 55" />
              <OrgRow label="Primary contact" value="David Andrei · david@quantix.dev" />
            </dl>
          </Card>

          {/* Your data */}
          <Card>
            <CardHead title="Your data" />
            <div className="space-y-4 p-5">
              <DataRow
                title="Export your data"
                desc="We prepare a full export within 30 days."
                cta="Export your data"
                icon={Download}
                href="mailto:support@fixmargin.com?subject=Data%20export%20request"
              />
              <DataRow
                title="Request account deletion"
                desc="Deleted 60 days after your subscription ends."
                cta="Request account deletion"
                icon={Trash2}
                href="mailto:support@fixmargin.com?subject=Account%20deletion%20request"
              />
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ink-200)] pt-4 text-[12px] text-[var(--ink-500)]">
                <a className="hover:text-[var(--accent-500)] hover:underline" href="mailto:support@fixmargin.com?subject=Privacy%20policy">Privacy</a>
                <span className="text-[var(--ink-200)]">·</span>
                <a className="hover:text-[var(--accent-500)] hover:underline" href="mailto:support@fixmargin.com?subject=DPA">DPA</a>
                <span className="text-[var(--ink-200)]">·</span>
                <a className="hover:text-[var(--accent-500)] hover:underline" href="mailto:support@fixmargin.com?subject=Terms">Terms</a>
              </div>
            </div>
          </Card>

          {/* Session */}
          <Card>
            <CardHead title="Session" />
            <div className="space-y-2 p-5">
              <Button size="sm" variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={handleSignOut}>
                Sign out of all devices
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      {children}
    </div>
  );
}

function SeatRow({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--ink-700)]">{label}</span>
        <span className="font-medium text-[var(--ink-900)]">{used} of {total}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--ink-100)]">
        <div
          className={cn("h-full rounded-full", pct >= 100 ? "bg-[var(--amber-500)]" : "bg-[var(--accent-500)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OrgRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3">
      <dt className="shrink-0 text-[var(--ink-500)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--ink-900)]">{value}</dd>
    </div>
  );
}

function DataRow({
  title, desc, cta, href, icon: Icon,
}: {
  title: string; desc: string; cta: string; href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-[var(--ink-900)]">{title}</p>
      <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">{desc}</p>
      <Button size="sm" variant="outline" className="mt-2" asChild>
        <a href={href}><Icon className="mr-1.5 h-3.5 w-3.5" /> {cta}</a>
      </Button>
    </div>
  );
}
