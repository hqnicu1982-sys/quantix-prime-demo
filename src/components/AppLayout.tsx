import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, Package, ClipboardList, FileSpreadsheet, Plug, Users2,
  Menu, X, Bell, Search, Settings, HardHat, LineChart, Check, FolderKanban, Library,
  Calculator, BarChart3, Upload, ShoppingCart, Receipt, TrendingUp, Hammer, Sun, Moon,
  ChevronDown,
} from "lucide-react";
import { Logo } from "./Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider, useProject } from "@/lib/ProjectContext";
import { cn } from "@/lib/utils";
import { CompareTray } from "@/components/CompareTray";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; mobile?: boolean };
type NavGroup = { label: string; persona?: "site" | "commercial"; items: NavItem[] };

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
    { to: "/projects/fitzrovia", label: "Hotel Fitzrovia", icon: HardHat },
  ]},
  { label: "Commercial", persona: "commercial", items: [
    { to: "/costed-boq", label: "Costed BoQ", icon: FileSpreadsheet, mobile: true },
    { to: "/price-intelligence", label: "Price Intelligence", icon: BarChart3 },
    { to: "/price-lists/upload", label: "Price List Upload", icon: Upload },
    { to: "/calloffs", label: "Call-offs", icon: ShoppingCart },
    { to: "/invoices", label: "Invoice Recon", icon: Receipt, badge: "BETA" },
    { to: "/financial", label: "Financial", icon: TrendingUp },
  ]},
  { label: "Execution", persona: "site", items: [
    { to: "/planner", label: "Planner", icon: Calendar, mobile: true },
    { to: "/readiness", label: "Material Readiness", icon: Package },
    { to: "/daily-report", label: "Daily Site Report", icon: ClipboardList, mobile: true },
  ]},
  { label: "Admin", items: [
    { to: "/team", label: "Team & Roles", icon: Users2 },
    { to: "/integrations", label: "Integrations", icon: Plug },
  ]},
];

const mobileItems = navGroups.flatMap((g) => g.items).filter((i) => i.mobile).slice(0, 5);

function PersonaToggle() {
  const { persona, setPersona } = useProject();
  return (
    <div className="mx-3 mb-2 mt-1 grid grid-cols-2 rounded-md border border-white/10 bg-white/5 p-0.5 text-[11px] font-medium">
      <button
        onClick={() => setPersona("site")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors",
          persona === "site" ? "bg-white text-[var(--navy-950)]" : "text-white/60 hover:text-white/90",
        )}
      >
        <Hammer className="h-3 w-3" /> Site
      </button>
      <button
        onClick={() => setPersona("commercial")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors",
          persona === "commercial" ? "bg-white text-[var(--navy-950)]" : "text-white/60 hover:text-white/90",
        )}
      >
        <LineChart className="h-3 w-3" /> Commercial
      </button>
    </div>
  );
}

function NavLinkItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname === item.to;
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
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
  const { persona } = useProject();
  return (
    <>
      <PersonaToggle />
      <div className="flex-1 overflow-y-auto py-1">
        {navGroups.map((group) => {
          const emphasised = group.persona === persona;
          const dimmed = group.persona && group.persona !== persona;
          return (
            <div
              key={group.label}
              className={cn(
                "px-3 py-2 transition-opacity",
                dimmed && "opacity-55",
              )}
            >
              {group.label !== "Top" && (
                <div className="mb-1 flex items-center gap-2 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    {group.label}
                  </p>
                  {emphasised && <span className="h-1 w-1 rounded-full bg-[var(--accent-500)]" />}
                </div>
              )}
              <nav className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLinkItem key={item.to} item={item} onClick={onNavigate} />
                ))}
              </nav>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-[11px] font-bold text-white">
            NA
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white">Nick Andrei</p>
            <p className="truncate text-[10.5px] text-white/50">Site Manager · Pro</p>
          </div>
          <button className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/80" aria-label="Settings">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
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
    "/projects/fitzrovia": "Hotel Fitzrovia",
    "/costed-boq": "Costed BoQ",
    "/price-intelligence": "Price Intelligence",
    "/price-lists/upload": "Price List Upload",
    "/calloffs": "Call-offs",
    "/invoices": "Invoice Reconciliation",
    "/financial": "Financial Dashboard",
    "/planner": "Planner",
    "/readiness": "Material Readiness",
    "/daily-report": "Daily Site Report",
    "/team": "Team & Roles",
    "/integrations": "Integrations",
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
  const { setPersona } = useProject();
  const dismiss = (to?: string, p?: "site" | "commercial") => {
    if (typeof window !== "undefined") localStorage.setItem("qp-welcome-seen-v3", "1");
    if (p) setPersona(p);
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
            Toggle between <strong className="text-[var(--ink-900)]">Site Manager</strong> and <strong className="text-[var(--ink-900)]">Commercial Manager</strong> in the sidebar to see different personas.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button variant="outline" className="w-full" onClick={() => dismiss("/daily-report", "site")}>
              <HardHat className="mr-2 h-4 w-4" /> Start as Site Manager
            </Button>
            <Button variant="outline" className="w-full" onClick={() => dismiss("/financial", "commercial")}>
              <LineChart className="mr-2 h-4 w-4" /> Start as Commercial Manager
            </Button>
          </div>
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("qp-welcome-seen-v3")) setWelcomeOpen(true);
    const stored = localStorage.getItem("qp-theme") as "light" | "dark" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    if (typeof window !== "undefined") localStorage.setItem("qp-theme", next);
  };

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
              <button className="rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button className="relative rounded-md p-2 text-[var(--ink-500)] hover:bg-[var(--ink-50)]" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--red-500)]" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-7 sm:px-7 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--ink-200)] bg-[var(--card)] lg:hidden">
        {mobileItems.map((item) => {
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

      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
      <CompareTray />
      <Toaster position="top-right" />
    </div>
  );
}

export function AppLayout() {
  return (
    <ProjectProvider>
      <LayoutInner />
    </ProjectProvider>
  );
}
