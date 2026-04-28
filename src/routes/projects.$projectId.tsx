import { createFileRoute, Link, Outlet, useLocation, notFound, useNavigate } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/ProjectContext";
import { useEffect } from "react";
import { fmtMoney } from "@/lib/mockData";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectLayout });

type SubTab = "" | "specification" | "costed-boq" | "planner" | "calloffs" | "invoices" | "variations" | "labour" | "reports" | "team";

const TABS: { key: SubTab; label: string }[] = [
  { key: "", label: "Overview" },
  { key: "specification", label: "Specification" },
  { key: "costed-boq", label: "Costed BoQ" },
  { key: "planner", label: "Planner" },
  { key: "calloffs", label: "Call-offs" },
  { key: "invoices", label: "Invoices" },
  { key: "variations", label: "Variations" },
  { key: "labour", label: "Labour" },
  { key: "reports", label: "Reports" },
  { key: "team", label: "Team" },
];

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const { all, current, setCurrent } = useProject();
  const navigate = useNavigate();
  const project = all.find((p) => p.id === projectId);

  useEffect(() => {
    if (project && current.id !== project.id) setCurrent(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!project) {
    throw notFound();
  }

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
          {TABS.map((t) => {
            const path = t.key ? `/projects/${projectId}/${t.key}` : `/projects/${projectId}`;
            const active = t.key === ""
              ? location.pathname === path
              : location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key === "") {
                    navigate({ to: "/projects/$projectId", params: { projectId } });
                  } else {
                    // typed nav per sub-route
                    const map: Record<string, string> = {
                      specification: "/projects/$projectId/specification",
                      "costed-boq": "/projects/$projectId/costed-boq",
                      planner: "/projects/$projectId/planner",
                      calloffs: "/projects/$projectId/calloffs",
                      invoices: "/projects/$projectId/invoices",
                      variations: "/projects/$projectId/variations",
                      labour: "/projects/$projectId/labour",
                      reports: "/projects/$projectId/reports",
                      team: "/projects/$projectId/team",
                    };
                    navigate({ to: map[t.key] as "/projects/$projectId/specification", params: { projectId } });
                  }
                }}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 py-2.5 transition-colors",
                  active
                    ? "border-[var(--accent-500)] text-[var(--ink-900)]"
                    : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </Section>
  );
}
