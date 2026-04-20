import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, Users, Package, BarChart3, Receipt, TrendingUp, Settings,
  Menu, X, Bell, ClipboardList, FileSpreadsheet, Plug, Users2, HardHat, LineChart, Check,
} from "lucide-react";
import { Logo } from "./Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider, useProject } from "@/lib/ProjectContext";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; primary?: boolean };

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, primary: true },
  ]},
  { label: "Site Manager", items: [
    { to: "/weekly-plan", label: "Weekly Work Plan", icon: Calendar, primary: true },
    { to: "/labour", label: "Labour Tracking", icon: Users, primary: true },
    { to: "/materials", label: "Material Readiness", icon: Package, primary: true },
    { to: "/daily-report", label: "Daily Site Report", icon: ClipboardList },
  ]},
  { label: "Commercial", items: [
    { to: "/prices", label: "Price Comparison", icon: BarChart3 },
    { to: "/costed-boq", label: "Costed BoQ", icon: FileSpreadsheet },
    { to: "/invoices", label: "Invoice Reconciliation", icon: Receipt },
    { to: "/financial", label: "Financial Dashboard", icon: TrendingUp },
  ]},
  { label: "Settings", items: [
    { to: "/integrations", label: "Integrations", icon: Plug },
  ]},
];

const allItems = navGroups.flatMap((g) => g.items);
const primaryItems = allItems.filter((i) => i.primary);

function ProjectSwitcher() {
  const { current, setCurrent, all } = useProject();
  return (
    <Select value={current.id} onValueChange={setCurrent}>
      <SelectTrigger className="h-9 w-[280px] border-border bg-card text-sm font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {all.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.contractValue} · {p.mainContractor}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className="px-3 pb-2 pt-3">
          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
            {group.label}
          </p>
          <nav className="space-y-0.5">
            {group.items.map((item) => (
              <NavLinkItem key={item.to} item={item} onClick={onNavigate} />
            ))}
          </nav>
        </div>
      ))}
      <div className="mt-auto border-t border-sidebar-border p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-white/5">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-white/5">
          <Users2 className="h-4 w-4" />
          Team
        </button>
      </div>
    </>
  );
}

function WelcomeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const dismiss = (to?: string) => {
    if (typeof window !== "undefined") localStorage.setItem("qp-welcome-seen-v2", "1");
    onOpenChange(false);
    if (to) navigate({ to });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Quantix Prime</DialogTitle>
          <DialogDescription className="pt-1 text-sm">
            A live demo of UK specialty contractor commercial control
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            This interactive prototype shows how a drylining contractor manages <strong className="text-foreground">Hotel Fitzrovia</strong> — a £2.1M fit-out for Kier Construction — from site to profit.
          </p>
          <p>
            You'll see two perspectives: <strong className="text-foreground">Site Manager</strong> (field operations, materials, labour) and <strong className="text-foreground">Commercial Manager</strong> (margins, invoices, price intelligence). Use the sidebar to explore either.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button variant="outline" className="w-full" onClick={() => dismiss("/weekly-plan")}>
              <HardHat className="mr-2 h-4 w-4" /> Start as Site Manager
            </Button>
            <Button variant="outline" className="w-full" onClick={() => dismiss("/financial")}>
              <LineChart className="mr-2 h-4 w-4" /> Start as Commercial Manager
            </Button>
          </div>
          <Button className="w-full" onClick={() => dismiss("/")}>
            Continue to Dashboard <Check className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LayoutInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("qp-welcome-seen-v2")) setWelcomeOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--brand-light)] text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo light />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-2">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
              <Logo light />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-2">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden lg:block">
              <ProjectSwitcher />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="rounded-md bg-warning/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
                Demo
              </span>
              <button className="relative rounded-md p-2 hover:bg-secondary" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                NP
              </div>
            </div>
          </div>
          {/* Project switcher mobile row */}
          <div className="border-t px-4 py-2 lg:hidden">
            <ProjectSwitcher />
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background lg:hidden">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-accent" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
            >
              <Icon className="h-5 w-5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
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
