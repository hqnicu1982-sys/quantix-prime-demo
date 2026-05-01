import { useState, useEffect } from "react";
import { Settings, LogOut, Check, ChevronDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { team } from "@/lib/mockData";
import { useCurrentUser, setCurrentUserId, type Tier } from "@/lib/currentUser";
import { signOut, useSession } from "@/lib/authSession";
import { useLabourLogs } from "@/lib/laborLog";
import { useProject } from "@/lib/ProjectContext";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const TIER_ORDER: Tier[] = ["Admin", "Pro Control", "Pro", "Site User", "Operative"];

const TIER_TONE: Record<Tier, string> = {
  Admin: "bg-[var(--accent-500)]/15 text-[var(--accent-500)] border-[var(--accent-500)]/25",
  "Pro Control": "bg-purple-500/15 text-purple-700 border-purple-500/25",
  Pro: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
  "Site User": "bg-amber-500/15 text-amber-700 border-amber-500/25",
  Operative: "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
};

export function HeaderUserMenu() {
  const me = useCurrentUser();
  const session = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Tiny attention dot if there is something to approve
  const { current } = useProject();
  const canApproveLabour = useCan("approve.labour");
  const labourLogs = useLabourLogs(current.id);
  const pendingApprovals = canApproveLabour
    ? labourLogs.filter((l) => (l.status ?? "submitted") === "submitted").length
    : 0;

  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [open]);

  if (!session) return null;

  const grouped = TIER_ORDER.map((t) => ({
    tier: t,
    members: team.filter((m) => m.tier === t && m.status !== "pending"),
  })).filter((g) => g.members.length > 0);

  const handleSignOut = () => {
    signOut();
    setOpen(false);
    toast.success("Signed out");
    navigate({ to: "/login", search: { redirect: undefined } });
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-[var(--ink-50)]"
        aria-label="Open user menu"
      >
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-[11px] font-bold text-white">
            {me.initials}
          </div>
          {pendingApprovals > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--red-500)] ring-2 ring-[var(--card)]" />
          )}
        </div>
        <ChevronDown className="h-3 w-3 text-[var(--ink-500)]" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-lg border border-[var(--ink-200)] bg-[var(--card)] shadow-2xl"
        >
          {/* Identity */}
          <div className="px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{me.name}</p>
            <p className="truncate text-[11.5px] text-[var(--ink-500)]">
              {session.email}
            </p>
          </div>

          <div className="border-t border-[var(--ink-200)]" />

          {/* Account settings */}
          <button
            onClick={() => { setOpen(false); navigate({ to: "/settings/labour" }); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
          >
            <Settings className="h-3.5 w-3.5 text-[var(--ink-500)]" />
            Account settings
          </button>

          <div className="border-t border-[var(--ink-200)]" />

          {/* View as (demo personas) */}
          <div className="max-h-[260px] overflow-y-auto py-1">
            <p className="px-4 pb-1 pt-2 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-500)]">
              View as <span className="font-normal normal-case tracking-normal text-[var(--ink-500)]/70">(demo)</span>
            </p>
            {grouped.map((g) => (
              <div key={g.tier} className="px-1.5">
                {g.members.map((m) => {
                  const active = m.id === me.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setCurrentUserId(m.id); setOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[12px] hover:bg-[var(--ink-50)]",
                        active && "bg-[var(--ink-50)]",
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-100)] text-[9.5px] font-bold text-[var(--ink-700)]">
                        {m.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--ink-900)]">{m.name}</p>
                      </div>
                      <span className={cn("rounded border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider", TIER_TONE[m.tier])}>
                        {m.tier}
                      </span>
                      {active && <Check className="h-3 w-3 text-[var(--accent-500)]" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--ink-200)]" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] font-medium text-[var(--red-500)] hover:bg-[var(--red-500)]/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
