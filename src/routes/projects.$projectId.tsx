import { createFileRoute, Link, Outlet, useLocation, notFound } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/ProjectContext";
import { useEffect } from "react";
import { fmtMoney } from "@/lib/mockData";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectLayout });

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const { all, current, setCurrent } = useProject();
  const project = all.find((p) => p.id === projectId);

  // keep the global ProjectContext in sync with the URL param
  useEffect(() => {
    if (project && current.id !== project.id) setCurrent(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!project) {
    throw notFound();
  }

  const tabs = [
    { to: `/projects/${projectId}`, label: "Overview", exact: true },
    { to: `/projects/${projectId}/specification`, label: "Specification" },
    { to: `/projects/${projectId}/costed-boq`, label: "Costed BoQ" },
    { to: `/projects/${projectId}/planner`, label: "Planner" },
    { to: `/projects/${projectId}/calloffs`, label: "Call-offs" },
    { to: `/projects/${projectId}/invoices`, label: "Invoices" },
    { to: `/projects/${projectId}/variations`, label: "Variations" },
    { to: `/projects/${projectId}/labour`, label: "Labour" },
    { to: `/projects/${projectId}/reports`, label: "Reports" },
    { to: `/projects/${projectId}/team`, label: "Team" },
  ];

  const subtitle = `${project.mainContractor} · ${project.subtitle} · ${project.startDate} → ${project.endDate} · ${fmtMoney(project.contractValue, { compact: true })} contract`;

  return (
    <Section
      title={project.name}
      subtitle={subtitle}
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
          <Button size="sm" onClick={() => toast.success("New call-off", { description: `Draft created for ${project.name}` })}>
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
                to="/projects/$projectId"
                params={{ projectId }}
                // override 'to' via href trick — we want the actual subpath
                href={t.to}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 py-2.5 transition-colors",
                  active
                    ? "border-[var(--accent-500)] text-[var(--ink-900)]"
                    : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </Section>
  );
}
