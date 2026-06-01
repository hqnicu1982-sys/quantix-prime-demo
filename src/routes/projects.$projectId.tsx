import { createFileRoute, Link, Outlet, useLocation, notFound, useNavigate } from "@tanstack/react-router";
import { Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Share2, Plus, FileDown, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/ProjectContext";
import { useEffect, useState } from "react";
import { fmtMoney } from "@/lib/mockData";
import { Gated } from "@/components/auth/Gated";
import { useProjectVariations } from "@/lib/variations";
import { useCan } from "@/lib/permissions";
import type { Capability } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";
import { useAssignments } from "@/lib/labour";
import { NoAccess } from "@/components/auth/NoAccess";
import { exportProjectPack } from "@/lib/exportProjectPack";
import { useProjectData } from "@/lib/projectData";
import { removeProject, isCustomProject } from "@/lib/customProjects";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { pushRecentProject } from "@/lib/recentProjects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectLayout });

type SubTab = "" | "specification" | "costed-boq" | "allocation" | "planner" | "calloffs" | "invoices" | "variations" | "labour" | "payments" | "reports" | "team";

const TABS: { key: SubTab; label: string; requires?: Capability }[] = [
  { key: "", label: "Overview" },
  { key: "specification", label: "Specification" },
  { key: "costed-boq", label: "Costed BoQ", requires: "view.boq" },
  { key: "allocation", label: "Materials", requires: "view.boq" },
  { key: "planner", label: "Planner", requires: "view.planner" },
  { key: "calloffs", label: "Call-offs", requires: "view.calloffs" },
  { key: "invoices", label: "Invoices", requires: "view.invoices" },
  { key: "variations", label: "Variations", requires: "view.variations" },
  { key: "labour", label: "Labour", requires: "view.dailyReport" },
  { key: "payments", label: "Payments", requires: "view.payments" },
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
  const projectData = useProjectData(projectId);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
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
    "edit.specification": useCan("edit.specification"),
    "view.payments": useCan("view.payments"),
    "create.payment.application": useCan("create.payment.application"),
    "issue.payment.notice": useCan("issue.payment.notice"),
    "record.payment": useCan("record.payment"),
  };
  const visibleTabs = TABS.filter((t) => !t.requires || capChecks[t.requires]);
  // Count of fresh draft VOs sourced from the Daily Report — surfaced as a
  // badge on the Variations tab so PMs see new field-raised items at a glance.
  const allVariations = useProjectVariations(projectId);
  const DAY_MS = 24 * 60 * 60 * 1000;
  const freshFieldVoCount = allVariations.filter(
    (v) =>
      v.status === "draft" &&
      v.source === "daily-report" &&
      Date.now() - v.createdAt < DAY_MS,
  ).length;

  useEffect(() => {
    if (project && current.id !== project.id) setCurrent(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (project) pushRecentProject(project.id);
  }, [project]);

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

  const handleExportPack = () => {
    try {
      exportProjectPack(project, projectData);
      toast.success("Project pack exported", {
        description: `${project.name} · PDF downloaded`,
      });
    } catch (e) {
      toast.error("Export failed", {
        description: String((e as Error).message ?? e),
      });
    }
  };

  const handleConfirmDelete = () => {
    const name = project.name;
    const wasCustom = isCustomProject(projectId);
    removeProject(projectId);
    setConfirmDeleteOpen(false);
    setConfirmText("");
    toast.success(wasCustom ? "Project deleted" : "Project hidden", {
      description: `${name} ${wasCustom ? "has been removed" : "is no longer in your list"}.`,
    });
    navigate({ to: "/projects" });
  };

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
          <Button variant="outline" size="sm" onClick={handleExportPack}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export pack
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
            className="text-[var(--red-500)] hover:text-[var(--red-500)]"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
          <Gated cap="create.calloffs">
            <Button asChild size="sm">
              <Link to="/calloffs/new"><Plus className="mr-1.5 h-3.5 w-3.5" /> New call-off</Link>
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
                      "allocation": "/projects/$projectId/allocation",
                      planner: "/projects/$projectId/planner",
                      calloffs: "/projects/$projectId/calloffs",
                      invoices: "/projects/$projectId/invoices",
                      variations: "/projects/$projectId/variations",
                      labour: "/projects/$projectId/labour",
                      payments: "/projects/$projectId/payments",
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
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  {t.key === "variations" && freshFieldVoCount > 0 && (
                    <span
                      title={`${freshFieldVoCount} new draft VO${freshFieldVoCount === 1 ? "" : "s"} raised from Daily Report in the last 24h`}
                      className="rounded-full bg-[var(--accent-500)] px-1.5 py-0.5 text-[9.5px] font-bold text-white"
                    >
                      {freshFieldVoCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      <Outlet />
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCustomProject(projectId) ? "Delete this project?" : "Hide this project?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-[13px] text-[var(--ink-700)]">
                {isCustomProject(projectId) ? (
                  <p>
                    You're about to <strong className="text-[var(--red-500)]">permanently delete</strong>{" "}
                    <strong>"{project.name}"</strong>. This will remove the project and all of its
                    payment cycles, variations, and invoices. This action cannot be undone.
                  </p>
                ) : (
                  <p>
                    <strong>"{project.name}"</strong> is a built-in demo project, so it can't be
                    deleted — but you can <strong>hide it</strong> from your project list. You can
                    restore the demo data later by clearing your browser storage.
                  </p>
                )}
                <div>
                  <label className="block text-[12px] font-medium text-[var(--ink-900)]">
                    Type <code className="rounded bg-[var(--ink-100)] px-1 font-mono text-[11px]">{project.name}</code> to confirm
                  </label>
                  <input
                    autoFocus
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-1.5 w-full rounded border border-[var(--ink-200)] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--accent-500)]"
                    placeholder={project.name}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={confirmText.trim() !== project.name}
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-500)]/90"
            >
              {isCustomProject(projectId) ? "Delete project" : "Hide project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
    </Section>
  );
}
