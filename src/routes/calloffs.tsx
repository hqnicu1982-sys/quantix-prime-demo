import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, ListChecks, Truck, GitBranch, ScrollText, FilePlus2 } from "lucide-react";
import { ProjectBanner } from "@/components/ProjectBanner";
import { Gated } from "@/components/auth/Gated";
import { useCan } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/NoAccess";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calloffs")({ component: GuardedLayout });

function GuardedLayout() {
  const allowed = useCan("view.calloffs");
  if (!allowed) return <NoAccess cap="view.calloffs" title="Call-offs restricted" />;
  return <CallOffsLayout />;
}

const tabs: { to: string; label: string; icon: typeof Inbox; exact?: boolean }[] = [
  { to: "/calloffs",             label: "Inbox",       icon: Inbox,      exact: true },
  { to: "/calloffs/new",         label: "New",         icon: FilePlus2 },
  { to: "/calloffs/approvals",   label: "Approvals",   icon: ListChecks },
  { to: "/calloffs/deliveries",  label: "Deliveries",  icon: Truck },
  { to: "/calloffs/pipeline",    label: "By state",    icon: GitBranch },
  { to: "/calloffs/audit",       label: "Audit log",   icon: ScrollText },
] as const;

function CallOffsLayout() {
  const loc = useLocation();
  return (
    <Section
      title="Call-offs"
      subtitle="7-stage workflow · BoQ → QS approval → PO → GRN → invoice reconciliation."
      right={
        <Gated cap="create.calloffs">
          <Button size="sm" asChild>
            <Link to="/calloffs/new"><Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off</Link>
          </Button>
        </Gated>
      }
    >
      <ProjectBanner scope="Call-offs" />
      <nav className="flex flex-wrap gap-1 border-b border-[var(--ink-200)] pb-1">
        {tabs.map((t) => {
          const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                active
                  ? "bg-[var(--ink-900)] text-white"
                  : "text-[var(--ink-500)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)]",
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
