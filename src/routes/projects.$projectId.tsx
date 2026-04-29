import { createFileRoute, Link, Outlet, useLocation, notFound, useNavigate } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/ProjectContext";
import { useEffect } from "react";
import { fmtMoney } from "@/lib/mockData";
import { Gated } from "@/components/auth/Gated";
import { useCan } from "@/lib/permissions";
import type { Capability } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";
import { useAssignments } from "@/lib/labour";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectLayout });

type SubTab = "" | "specification" | "costed-boq" | "planner" | "calloffs" | "invoices" | "variations" | "labour" | "reports" | "team";

const TABS: { key: SubTab; label: string; requires?: Capability }[] = [
  { key: "", label: "Overview" },
  { key: "specification", label: "Specification" },
  { key: "costed-boq", label: "Costed BoQ", requires: "view.boq" },
  { key: "planner", label: "Planner", requires: "view.planner" },
  { key: "calloffs", label: "Call-offs", requires: "view.calloffs" },
  { key: "invoices", label: "Invoices", requires: "view.invoices" },
  { key: "variations", label: "Variations", requires: "view.variations" },
  { key: "labour", label: "Labour", requires: "view.dailyReport" },
  { key: "reports", label: "Reports", requires: "view.financials.lite" },
  { key: "team", label: "Team", requires: "view.team" },
];

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const { all, current, setCurrent } = useProject();
  const navigate = useNavigate();
  const project = all.find((p) => p.id === projectId);
  const canSeeMoney = useCan("view.financials.lite");
  // Site User / Operative may only access projects they're assigned to.
  const me = useCurrentUser();
  const portfolioWide = useCan("view.financials.lite"); // Pro+ see all projects
  const myAssignments = useAssignments(projectId);
  const isAssigned = myAssignments.some((a) => a.memberId === me.id);
  // Tab gating — call hooks at top level (one per possible cap), then assemble list.
  const capChecks: Record<Capability, boolean> = {
    "view.financials": useCan("view.financials"),
    "view.financials.lite": useCan("view.financials.lite"),
    "view.boq": useCan("view.boq"),
    "edit.boq": useCan("edit.boq"),
    "upload.prices": useCan("upload.prices"),
    "view.priceIntel": useCan("view.priceIntel"),
    "view.calloffs": useCan("view.calloffs"),
    "create.calloffs": useCan("create.calloffs"),
    "approve.calloffs": useCan("approve.calloffs"),
    "view.invoices": useCan("view.invoices"),
    "sign.invoices": useCan("sign.invoices"),
    "view.planner": useCan("view.planner"),
    "edit.planner": useCan("edit.planner"),
    "view.dailyReport": useCan("view.dailyReport"),
    "log.labour": useCan("log.labour"),
    "log.labour.others": useCan("log.labour.others"),
    "approve.labour": useCan("approve.labour"),
    "view.team": useCan("view.team"),
    "edit.team": useCan("edit.team"),
    "view.pwRates": useCan("view.pwRates"),
    "edit.pwRates": useCan("edit.pwRates"),
    "manage.users": useCan("manage.users"),
    "view.variations": useCan("view.variations"),
    "edit.variations": useCan("edit.variations"),
    "view.integrations": useCan("view.integrations"),
    "view.settings.labour": useCan("view.settings.labour"),
  };
  const visibleTabs = TABS.filter((t) => !t.requires || capChecks[t.requires]);

  useEffect(() => {
    if (project && current.id !== project.id) setCurrent(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!project) {
    throw notFound();
  }

  if (!portfolioWide && !isAssigned) {
    return (
      <NoAccess
        cap="view.financials.lite"
        title="Project not assigned"
      />
    );
  }

  const subtitleBase = `${project.mainContractor} · ${project.subtitle} · ${project.startDate} → ${project.endDate}`;
  const subtitle = canSeeMoney
    ? `${subtitleBase} · ${fmtMoney(project.contractValue, { compact: true })} contract`
    : subtitleBase;

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
          <Gated cap="create.calloffs">
            <Button size="sm" onClick={() => toast.success("New call-off", { description: `Draft created for ${project.name}` })}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off
            </Button>
          </Gated>
        </>
      }
    >
      <div className="border-b border-[var(--ink-200)]">
        <nav className="flex gap-6 overflow-x-auto text-[13px] font-medium">
          {visibleTabs.map((t) => {
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
