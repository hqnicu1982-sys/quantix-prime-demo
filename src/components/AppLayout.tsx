import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, Package, ClipboardList, FileSpreadsheet, Plug, Users2,
  Menu, X, Search, Settings, HardHat, Check, FolderKanban, Library,
  Calculator, BarChart3, Upload, ShoppingCart, Receipt, TrendingUp, Sun, Moon,
  ChevronDown, GitBranch, BookOpen, HelpCircle, LogIn, UserPlus, Layers, Briefcase, BellRing, CalendarClock,
} from "lucide-react";
import { Logo } from "./Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider, useProject } from "@/lib/ProjectContext";
import { cn } from "@/lib/utils";
import { CompareTray } from "@/components/CompareTray";
import { HeaderUrgentBell } from "@/components/HeaderUrgentBell";
import { HeaderFollowUpBell } from "@/components/HeaderFollowUpBell";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { useCurrentTier, useCurrentUser } from "@/lib/currentUser";
import { can, type Capability } from "@/lib/permissions";
import { useCan } from "@/lib/permissions";
import { useAssignments } from "@/lib/labour";
import { useRecentProjects } from "@/lib/recentProjects";
import { useSession, useSessionReady, isPublicPath } from "@/lib/authSession";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; mobile?: boolean; params?: Record<string, string>; requires?: Capability };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Top", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  ]},
  { label: "Specification", items: [
    { to: "/catalog", label: "System Catalog", icon: Library },
    { to: "/calculator", label: "Calculator", icon: Calculator },
  ]},
  { label: "Projects", items: [
    { to: "/projects", label: "All Projects", icon: FolderKanban, mobile: true },
    { to: "/tender-pipeline", label: "Tender Pipeline", icon: Briefcase, badge: "NEW" },
    { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock, badge: "NEW" },
  ]},
  { label: "Commercial", items: [
    { to: "/costed-boq", label: "Costed BoQ", icon: FileSpreadsheet, mobile: true, requires: "view.boq" },
    { to: "/price-intelligence", label: "Price Intelligence", icon: BarChart3, requires: "view.priceIntel" },
    { to: "/price-lists/upload", label: "Price List Upload", icon: Upload, requires: "upload.prices" },
    { to: "/calloffs", label: "Call-offs", icon: ShoppingCart, requires: "view.calloffs" },
    { to: "/variations", label: "Variations", icon: GitBranch, badge: "NEW", requires: "view.variations" },
    { to: "/invoices", label: "Invoice Recon", icon: Receipt, badge: "BETA", requires: "view.invoices" },
    { to: "/all-invoices", label: "All Invoices", icon: Layers, requires: "view.invoices" },
    { to: "/financial", label: "Financial", icon: TrendingUp, requires: "view.financials" },
  ]},
  { label: "Execution", items: [
    { to: "/planner", label: "Planner", icon: Calendar, mobile: true, requires: "view.planner" },
    { to: "/readiness", label: "Material Readiness", icon: Package, requires: "view.planner" },
    { to: "/daily-report", label: "Daily Site Report", icon: ClipboardList, mobile: true, requires: "view.dailyReport" },
  ]},
  { label: "Admin", items: [
    { to: "/team", label: "Team & Roles", icon: Users2, requires: "view.team" },
    { to: "/settings/labour", label: "Labour Rates", icon: Settings, requires: "view.settings.labour" },
    { to: "/integrations", label: "Integrations", icon: Plug, requires: "view.integrations" },
    { to: "/how-to", label: "How to use", icon: BookOpen, badge: "TOUR" },
  ]},
];


// Build the dynamic list of project links rendered inside the "Projects"
// sidebar group. Pro/Admin users get up to 4 most-recently-visited projects
// (with the current project pinned first). Site Users / Operatives get the
// projects they're explicitly assigned to. Empty list = no extra links.
function useDynamicProjectNavItems(): NavItem[] {
  const { all, current } = useProject();
  const me = useCurrentUser();
  const portfolioWide = useCan("view.financials.lite");
  const allAssignments = useAssignments();
  const recents = useRecentProjects();

  const projectsById = new Map(all.map((p) => [p.id, p]));

  let ids: string[];
  if (portfolioWide) {
    const ordered = [current.id, ...recents.filter((id) => id !== current.id)];
    ids = ordered.filter((id) => projectsById.has(id)).slice(0, 4);
  } else {
    const assignedIds = new Set(
      allAssignments.filter((a) => a.memberId === me.id).map((a) => a.projectId),
    );
    const ordered = [
      ...(assignedIds.has(current.id) ? [current.id] : []),
      ...Array.from(assignedIds).filter((id) => id !== current.id),
    ];
    ids = ordered.filter((id) => projectsById.has(id));
  }

  return ids.map((id) => {
    const p = projectsById.get(id)!;
    return {
      to: "/projects/$projectId",
      label: p.name,
      icon: HardHat,
      params: { projectId: p.id } as Record<string, string>,
    };
  });
}

function NavLinkItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const location = useLocation();
  // resolve dynamic segments for active comparison
  const resolvedTo = item.params
    ? Object.entries(item.params).reduce(
        (acc, [k, v]) => acc.replace(`$${k}`, v),
        item.to,
      )
    : item.to;
  const active = location.pathname === resolvedTo;
  const Icon = item.icon;
  return (
    <Link
      to={item.to as "/"}
      params={item.params as never}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-white/55 hover:bg-white/5 hover:text-white/90",
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[var(--accent-500)]" />}
      <Icon className="h-[15px] w-[15px] shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded bg-[var(--accent-500)]/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-100)]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const tier = useCurrentTier();
  const projectItems = useDynamicProjectNavItems();
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => !i.requires || can(tier, i.requires)),
    }))
    .map((group) =>
      group.label === "Projects"
        ? { ...group, items: [...group.items, ...projectItems] }
        : group,
    )
    .filter((g) => g.items.length > 0);
  return (
    <>
      <div className="flex-1 overflow-y-auto py-1">
        {visibleGroups.map((group) => (
          <div key={group.label} className="px-3 py-2">
            {group.label !== "Top" && (
              <div className="mb-1 flex items-center gap-2 px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  {group.label}
                </p>
              </div>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <NavLinkItem key={item.to} item={item} onClick={onNavigate} />
              ))}
            </nav>
          </div>
        ))}
      </div>
    </>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const { current } = useProject();
  const path = location.pathname;
  const labelMap: Record<string, string> = {
    "/": "Dashboard",
    "/catalog": "System Catalog",
    "/calculator": "Calculator",
    "/projects": "All Projects",
    "/tender-pipeline": "Tender Pipeline",
    "/follow-ups": "Follow-ups",
    "/costed-boq": "Costed BoQ",
    "/price-intelligence": "Price Intelligence",
    "/price-lists/upload": "Price List Upload",
    "/calloffs": "Call-offs",
    "/variations": "Variations",
    "/invoices": "Invoice Reconciliation",
    "/all-invoices": "All Invoices",
    "/financial": "Financial Dashboard",
    "/planner": "Planner",
    "/readiness": "Material Readiness",
    "/daily-report": "Daily Site Report",
    "/team": "Team & Roles",
    "/team/audit": "Team Audit Log",
    "/integrations": "Integrations",
    "/how-to": "How to use",
  };
  return (
    <nav className="hidden items-center gap-1.5 text-[12.5px] text-[var(--ink-500)] md:flex" aria-label="Breadcrumb">
      <span className="font-semibold text-[var(--ink-700)]">Quantix Prime</span>
      <span className="text-[var(--ink-200)]">/</span>
      <ProjectSwitcher />
      {labelMap[path] && labelMap[path] !== current.name && (
        <>
          <span className="text-[var(--ink-200)]">/</span>
          <span className="font-medium text-[var(--ink-700)]">{labelMap[path]}</span>
        </>
      )}
    </nav>
  );
}

function ProjectSwitcher() {
  const { current, all, setCurrent } = useProject();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [open]);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
      >
        {current.name}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-50 mt-1 max-h-[360px] w-[280px] overflow-y-auto rounded-md border border-[var(--ink-200)] bg-[var(--card)] p-1 shadow-lg"
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
            Switch project
          </p>
          {all.map((p) => (
            <button
              key={p.id}
              onClick={() => { setCurrent(p.id); setOpen(false); }}
              className={cn(
                "flex w-full items-start justify-between gap-2 rounded px-2 py-1.5 text-left text-[12.5px] hover:bg-[var(--ink-50)]",
                p.id === current.id && "bg-[var(--accent-500)]/10",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--ink-900)]">{p.name}</p>
                <p className="truncate text-[10.5px] text-[var(--ink-500)]">{p.mainContractor}</p>
              </div>
              {p.id === current.id && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WelcomeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const dismiss = (to?: string) => {
    if (typeof window !== "undefined") localStorage.setItem("qp-welcome-seen-v3", "1");
    onOpenChange(false);
    if (to) navigate({ to });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] font-semibold tracking-tight">
            Welcome to <span className="italic font-normal text-[var(--accent-500)]">Quantix Prime</span>
          </DialogTitle>
          <DialogDescription className="pt-1 text-[13px]">
            A business preview of UK construction intelligence
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-[13px] leading-relaxed text-[var(--ink-500)]">
          <p>
            This is a real project — <strong className="text-[var(--ink-900)]">Hotel Fitzrovia</strong>, a £2.1m drylining package for Kier Construction — populated with realistic UK construction data.
          </p>
          <p>
            Your role determines what you see. Use the top-right user menu to switch views and preview the experience from another perspective.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={() => dismiss("/how-to")}>
            <BookOpen className="mr-2 h-4 w-4" /> Take the 8-step tour
          </Button>
          <button onClick={() => dismiss("/")} className="w-full text-[12.5px] text-[var(--ink-500)] hover:text-[var(--ink-900)]">
            Continue to Dashboard <Check className="ml-1 inline h-3.5 w-3.5" />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LayoutInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const session = useSession();
  const authReady = useSessionReady();
  const location = useLocation();
  const navigate = useNavigate();

  // Route guard: any non-public route requires a session.
  useEffect(() => {
    if (!authReady) return;
    if (!session && !isPublicPath(location.pathname)) {
      navigate({ to: "/login", search: { redirect: location.pathname } });
    }
  }, [authReady, session, location.pathname, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session && !localStorage.getItem("qp-welcome-seen-v3")) setWelcomeOpen(true);
    const stored = localStorage.getItem("qp-theme") as "light" | "dark" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, [session]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    if (typeof window !== "undefined") localStorage.setItem("qp-theme", next);
  };

  // Public pages (/login, /signup) render without the app chrome.
  if (!session && isPublicPath(location.pathname) &&
      (location.pathname === "/login" || location.pathname === "/signup")) {
    return <Outlet />;
  }

  // While redirecting an unauthenticated user away from a protected route,
  // render nothing to avoid flashing the dashboard.
  if (!authReady || (!session && !isPublicPath(location.pathname))) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ink-200)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-[var(--navy-950)] text-white sidebar-dot-pattern lg:flex">
        <div className="flex h-[60px] items-center border-b border-white/10 px-5">
          <Logo light />
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-[var(--navy-950)] text-white">
            <div className="flex h-[60px] items-center justify-between border-b border-white/10 px-5">
              <Logo light />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 border-b border-[var(--ink-200)] bg-[var(--card)]/92 backdrop-blur">
          <div className="flex h-[60px] items-center gap-3 px-5 sm:px-7">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <Breadcrumb />
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--accent-500)] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" />
                Business Preview
              </span>
              {!session ? (
                <>
                  <Link
                    to="/login"
                    search={{ redirect: undefined }}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[var(--navy-950)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Sign up
                  </Link>
                </>
              ) : (
                <HeaderUserMenu />
              )}
              <button className="rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
              <Link
                to="/how-to"
                className="rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
                aria-label="How to use"
                title="How to use Quantix Prime"
              >
                <HelpCircle className="h-4 w-4" />
              </Link>
              <button
                onClick={toggleTheme}
                className="rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <HeaderUrgentBell />
              <HeaderFollowUpBell />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-7 sm:px-7 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />

      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
      <CompareTray />
      <Toaster position="top-right" />
    </div>
  );
}

function MobileTabBar() {
  const tier = useCurrentTier();
  const items = navGroups
    .flatMap((g) => g.items)
    .filter((i) => i.mobile && (!i.requires || can(tier, i.requires)))
    .slice(0, 5);
  if (items.length === 0) return null;
  const cols =
    items.length === 1 ? "grid-cols-1"
    : items.length === 2 ? "grid-cols-2"
    : items.length === 3 ? "grid-cols-3"
    : items.length === 4 ? "grid-cols-4"
    : "grid-cols-5";
  return (
    <nav className={cn("fixed inset-x-0 bottom-0 z-30 grid border-t border-[var(--ink-200)] bg-[var(--card)] lg:hidden", cols)}>
      {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-[var(--accent-500)]" }}
              inactiveProps={{ className: "text-[var(--ink-500)]" }}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
      })}
    </nav>
  );
}

export function AppLayout() {
  // Defer rendering to after mount to avoid SSR/CSR hydration mismatches.
  // Several pieces of state (current user, theme, custom projects)
  // depend on localStorage, which only exists on the client. Rendering a
  // matching shell on the server and switching to the real UI after mount
  // keeps React's hydration check happy without sacrificing SSR for routing.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-foreground" suppressHydrationWarning>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ink-200)]" aria-hidden />
        </div>
      </div>
    );
  }
  return (
    <ProjectProvider>
      <LayoutInner />
    </ProjectProvider>
  );
}
