import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Inbox, Upload, ListChecks, AlertOctagon, CalendarClock, ScrollText } from "lucide-react";
import { ProjectBanner } from "@/components/ProjectBanner";
import { Gated } from "@/components/auth/Gated";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoice Reconciliation — Quantix Prime" }] }),
  component: GuardedLayout,
});

function GuardedLayout() {
  const allowed = useCan("view.invoices");
  if (!allowed) return <NoAccess cap="view.invoices" title="Invoices restricted" />;
  return <InvoicesLayout />;
}

const tabs: { to: string; label: string; icon: typeof Inbox; exact?: boolean }[] = [
  { to: "/invoices",          label: "Inbox",            icon: Inbox,         exact: true },
  { to: "/invoices/new",      label: "Upload",           icon: Upload },
  { to: "/invoices/review",   label: "QS review",        icon: ListChecks },
  { to: "/invoices/disputes", label: "Disputes",         icon: AlertOctagon },
  { to: "/invoices/schedule", label: "Payment schedule", icon: CalendarClock },
  { to: "/invoices/audit",    label: "Audit log",        icon: ScrollText },
];

function InvoicesLayout() {
  const loc = useLocation();
  return (
    <Section
      title="Invoice Reconciliation"
      subtitle="7-stage workflow · Received → Parsed → 3-way match → QS review → Approved → Scheduled → Paid."
      right={
        <Gated cap="sign.invoices">
          <Button size="sm" asChild>
            <Link to="/invoices/new"><Upload className="mr-1.5 h-3.5 w-3.5" /> Upload invoice</Link>
          </Button>
        </Gated>
      }
    >
      <ProjectBanner scope="Invoice Reconciliation" />
      <nav className="flex flex-wrap gap-1 border-b border-[var(--ink-200)] pb-1">
        {tabs.map((t) => {
          const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to as "/"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                active ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-500)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </Section>
  );
}