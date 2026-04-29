import { useEffect, useState } from "react";
import { Settings, ChevronUp, Check } from "lucide-react";
import { team } from "@/lib/mockData";
import { useCurrentUser, setCurrentUserId, type Tier } from "@/lib/currentUser";
import { cn } from "@/lib/utils";

const TIER_ORDER: Tier[] = ["Admin", "Pro Control", "Pro", "Site User", "Operative"];

const TIER_TONE: Record<Tier, string> = {
  Admin: "bg-[var(--accent-500)]/20 text-[var(--accent-100)] border-[var(--accent-500)]/30",
  "Pro Control": "bg-purple-500/20 text-purple-200 border-purple-500/30",
  Pro: "bg-[var(--green-600)]/20 text-emerald-200 border-[var(--green-600)]/30",
  "Site User": "bg-[var(--amber-500)]/20 text-amber-200 border-[var(--amber-500)]/30",
  Operative: "bg-white/10 text-white/80 border-white/15",
};

export function CurrentUserSwitcher() {
  const me = useCurrentUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [open]);

  const grouped = TIER_ORDER.map((t) => ({
    tier: t,
    members: team.filter((m) => m.tier === t && m.status !== "pending"),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--teal-500)] text-[11px] font-bold text-white">
          {me.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-white">{me.name}</p>
          <p className="truncate text-[10.5px] text-white/50">
            {me.role} · {me.tier}
          </p>
        </div>
        <ChevronUp className={cn("h-3.5 w-3.5 text-white/40 transition-transform", !open && "rotate-180")} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-[420px] overflow-y-auto rounded-md border border-white/10 bg-[var(--navy-950)] p-1.5 shadow-2xl"
        >
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              View as
            </p>
            <p className="mt-0.5 text-[10.5px] text-white/40">
              Switch role to preview the app from another user's perspective.
            </p>
          </div>
          {grouped.map((g) => (
            <div key={g.tier} className="mt-1">
              <p className="px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-white/40">
                {g.tier}
              </p>
              {g.members.map((m) => {
                const active = m.id === me.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setCurrentUserId(m.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-white/5",
                      active && "bg-white/10",
                    )}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                      {m.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{m.name}</p>
                      <p className="truncate text-[10px] text-white/50">{m.role}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        TIER_TONE[m.tier],
                      )}
                    >
                      {m.tier}
                    </span>
                    {active && <Check className="h-3 w-3 text-[var(--accent-500)]" />}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="mt-1 border-t border-white/10 px-2 py-1.5">
            <button
              className="flex w-full items-center gap-1.5 text-[10.5px] text-white/40 hover:text-white/80"
              onClick={() => {
                setCurrentUserId("dp");
                setOpen(false);
              }}
            >
              <Settings className="h-3 w-3" /> Reset to Admin (David)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
