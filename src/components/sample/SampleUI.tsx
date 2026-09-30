import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FlaskConical, Loader2, MoreHorizontal, RotateCcw, ChevronDown, ChevronUp, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/Primitives";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  SAMPLE_PROJECT, SAMPLE_DESCRIPTION, SAMPLE_REFUSED_NOTE, SAMPLE_PROJECT_ID,
  resetSampleProject, setSampleBannerCollapsed, setSampleSlotHidden, useSampleState,
} from "@/lib/sampleProject";
import { useProject } from "@/lib/ProjectContext";

/** Neutral dashed badge — deliberately distinct from Active / Tender / Complete status pills. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border border-dashed border-[var(--ink-300,var(--ink-200))] bg-[var(--card)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]",
        className,
      )}
    >
      <FlaskConical className="h-2.5 w-2.5" /> Sample
    </span>
  );
}

/** Reset / restore dialog with in-progress, success and error states. */
export function ResetSampleDialog({
  open, onOpenChange, mode = "reset",
}: { open: boolean; onOpenChange: (v: boolean) => void; mode?: "reset" | "restore" }) {
  const [busy, setBusy] = useState(false);
  const restore = mode === "restore";
  const run = async () => {
    setBusy(true);
    try {
      await resetSampleProject();
      toast.success(restore ? "Sample project restored" : "Sample project reset");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't reset the sample. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{restore ? "Restore the sample project?" : "Reset the sample project?"}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">
            {restore
              ? "This recreates the sample project with its original fictional data. Your real projects are not affected."
              : "This puts the sample back to its original state. Everything you changed or added inside the sample — edits, call-offs, variations, photos, reports — will be removed. Your real projects are not affected."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={run} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {restore ? "Restore sample" : "Reset sample"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Banner shown on every page scoped to the sample project. Collapsible to a thin strip. */
export function SampleBanner() {
  const { bannerCollapsed } = useSampleState();
  const [resetOpen, setResetOpen] = useState(false);
  const navigate = useNavigate();
  const startOwn = () => navigate({ to: "/projects", search: { stage: "active" } });

  if (bannerCollapsed) {
    return (
      <>
        <button
          onClick={() => setSampleBannerCollapsed(false)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)] px-3 py-1 text-[11.5px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          <span className="inline-flex items-center gap-1.5"><FlaskConical className="h-3 w-3" /> Sample project — fictional data</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <ResetSampleDialog open={resetOpen} onOpenChange={setResetOpen} />
      </>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)] px-3 py-2 text-[12.5px]">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />
        <p className="min-w-0 flex-1 truncate text-[var(--ink-700)] md:whitespace-normal">
          <span className="font-semibold text-[var(--ink-900)]">Sample project</span>
          <span className="hidden md:inline"> — fictional data to explore FixMargin. Changes are yours to keep until you reset it.</span>
          <span className="md:hidden"> — fictional data</span>
        </p>
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          <Button size="sm" variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset sample
          </Button>
          <Button size="sm" onClick={startOwn}>Start your own project</Button>
        </div>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Sample project actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={startOwn}>Start your own project</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setResetOpen(true)}>Reset sample</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSampleBannerCollapsed(true)}>Collapse banner</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          size="icon" variant="ghost" className="hidden h-7 w-7 md:inline-flex"
          aria-label="Collapse banner" onClick={() => setSampleBannerCollapsed(true)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
      <ResetSampleDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}

/** Renders the banner only when the current project is the sample. */
export function SampleBannerIfActive() {
  const { current } = useProject();
  return current.isSample ? <SampleBanner /> : null;
}

/** Pattern for refused actions: button stays visible, disabled, tooltip + inline note. */
export function SampleRefusedAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="pointer-events-auto cursor-not-allowed opacity-50" aria-disabled>
              <div className="pointer-events-none">{children}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px] text-[12px]">{SAMPLE_REFUSED_NOTE}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <p className="flex items-start gap-1.5 text-[12px] text-[var(--ink-500)]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {SAMPLE_REFUSED_NOTE}{" "}
          <Link to="/projects" search={{ stage: "active" }} className="font-medium text-[var(--accent-500)] hover:underline">
            Go to my projects
          </Link>
        </span>
      </p>
    </div>
  );
}

/** Pinned slot on the Projects list — above the status tabs, never counted in them. */
export function PinnedSampleCard({ hasRealProjects, onCreate }: { hasRealProjects: boolean; onCreate?: () => void }) {
  const { slotHidden, missing } = useSampleState();
  const { setCurrent } = useProject();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  if (missing) return null;

  if (slotHidden && hasRealProjects) {
    return (
      <button
        onClick={() => setSampleSlotHidden(false)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
      >
        <FlaskConical className="h-3.5 w-3.5" /> Show sample project
      </button>
    );
  }

  const open = () => {
    setCurrent(SAMPLE_PROJECT_ID);
    navigate({ to: "/projects/$projectId", params: { projectId: SAMPLE_PROJECT_ID } });
  };

  const card = (
    <Card className="border-dashed p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--ink-900)]">Sample project · Harbour Yard Offices</p>
            <SampleBadge />
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--ink-500)]">{SAMPLE_DESCRIPTION}</p>
          <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">{SAMPLE_PROJECT.mainContractor} · Harbour Yard, Bristol · not counted in your portfolio</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasRealProjects && (
            <Button size="sm" variant="ghost" onClick={() => setSampleSlotHidden(true)}>Hide</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={open}>Open sample</Button>
        </div>
      </div>
      <ResetSampleDialog open={resetOpen} onOpenChange={setResetOpen} />
    </Card>
  );

  if (hasRealProjects) return card;

  return (
    <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
      {card}
      <Card className="flex flex-col items-start justify-center gap-2 p-4">
        <p className="text-[14px] font-semibold text-[var(--ink-900)]">Create your first project</p>
        <p className="text-[12.5px] text-[var(--ink-500)]">Set up a real project to start tracking your own BoQ, call-offs and margin.</p>
        <Button size="sm" onClick={onCreate}><Plus className="mr-1.5 h-3.5 w-3.5" /> Create your first project</Button>
      </Card>
    </div>
  );
}

/** First-login dashboard panel for an organisation with no real projects. */
export function SampleWelcomePanel() {
  const { setCurrent } = useProject();
  const navigate = useNavigate();
  return (
    <Card className="p-8">
      <SampleBadge />
      <h2 className="font-display mt-3 text-[24px] font-semibold tracking-tight text-[var(--ink-900)]">
        Welcome to FixMargin
      </h2>
      <p className="mt-2 max-w-xl text-[14px] text-[var(--ink-700)]">
        We've set up a sample project so you can see FixMargin with real-looking data.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setCurrent(SAMPLE_PROJECT_ID);
            navigate({ to: "/projects/$projectId", params: { projectId: SAMPLE_PROJECT_ID } });
          }}
        >
          Open the sample project
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/projects", search: { stage: "active" } })}>
          Create my first project
        </Button>
      </div>
    </Card>
  );
}

/** Settings → Organisation → Sample project row. */
export function SampleSettingsRow() {
  const { missing } = useSampleState();
  const { setCurrent } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ink-200)] pt-3 text-[13px]">
      <div>
        <p className="flex items-center gap-2 font-medium text-[var(--ink-900)]">Sample project <SampleBadge /></p>
        <p className="text-[12px] text-[var(--ink-500)]">
          {missing ? "Missing — it couldn't be created." : "Active · Harbour Yard Offices · not counted in portfolio numbers"}
        </p>
      </div>
      <div className="flex gap-1.5">
        {missing ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Restore sample project</Button>
        ) : (
          <>
            <Button
              size="sm" variant="outline"
              onClick={() => { setCurrent(SAMPLE_PROJECT_ID); navigate({ to: "/projects/$projectId", params: { projectId: SAMPLE_PROJECT_ID } }); }}
            >
              Open
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Reset</Button>
          </>
        )}
      </div>
      <ResetSampleDialog open={open} onOpenChange={setOpen} mode={missing ? "restore" : "reset"} />
    </div>
  );
}

/** Wraps an upload surface; when refused, applies the sample refused-action pattern. */
export function MaybeRefused({ refused, children }: { refused?: boolean; children: React.ReactNode }) {
  return refused ? <SampleRefusedAction className="m-5">{children}</SampleRefusedAction> : <>{children}</>;
}
