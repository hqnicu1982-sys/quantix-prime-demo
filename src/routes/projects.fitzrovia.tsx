import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/fitzrovia")({ component: ProjectLayout });

type Tab = { to: string; label: string; exact?: boolean; badge?: number };
const tabs: Tab[] = [
  { to: "/projects/fitzrovia", label: "Overview", exact: true },
  { to: "/projects/fitzrovia/specification", label: "Specification" },
  { to: "/projects/fitzrovia/costed-boq", label: "Costed BoQ" },
  { to: "/projects/fitzrovia/planner", label: "Planner" },
  { to: "/projects/fitzrovia/calloffs", label: "Call-offs", badge: 3 },
  { to: "/projects/fitzrovia/invoices", label: "Invoices" },
  { to: "/projects/fitzrovia/variations", label: "Variations" },
  { to: "/projects/fitzrovia/labour", label: "Labour" },
  { to: "/projects/fitzrovia/reports", label: "Reports" },
  { to: "/projects/fitzrovia/team", label: "Team" },
];

function ProjectLayout() {
  const location = useLocation();
  return (
    <Section
      title="Hotel Fitzrovia"
      subtitle="Kier Construction · Fitzrovia W1T 4JQ · 04 Feb 2026 → 19 Dec 2026 · £2,100,000 contract"
      right={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Link copied", { description: "Project URL copied to clipboard" });
            }}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" onClick={() => toast.success("New call-off", { description: "Draft created for Hotel Fitzrovia" })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off
          </Button>
        </>
      }
    >
      <div className="border-b border-[var(--ink-200)]">
        <nav className="flex gap-6 overflow-x-auto text-[13px] font-medium">
          {tabs.map((t) => {
            const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to as "/projects/fitzrovia"}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 py-2.5 transition-colors",
                  active
                    ? "border-[var(--accent-500)] text-[var(--ink-900)]"
                    : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]",
                )}
              >
                {t.label}
                {t.badge && (
                  <span className="ml-1.5 rounded-full bg-[var(--accent-500)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-500)]">
                    {t.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </Section>
  );
}
