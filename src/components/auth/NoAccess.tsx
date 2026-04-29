import { Lock } from "lucide-react";
import { Card } from "@/components/Primitives";
import { tiersWithCap } from "@/lib/permissions";
import type { Capability } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/currentUser";

export function NoAccess({ cap, title }: { cap: Capability; title?: string }) {
  const me = useCurrentUser();
  const allowed = tiersWithCap(cap);
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-50)] text-[var(--ink-500)]">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="font-display text-[20px] font-semibold text-[var(--ink-900)]">
        {title ?? "Restricted"}
      </h2>
      <p className="mt-2 text-[13px] text-[var(--ink-500)]">
        You're signed in as <strong className="text-[var(--ink-900)]">{me.name}</strong>{" "}
        ({me.tier}). This page is available to:
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {allowed.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[var(--ink-200)] bg-[var(--ink-50)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--ink-700)]"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-5 text-[11.5px] text-[var(--ink-500)]">
        Switch user via the avatar menu in the sidebar.
      </p>
    </Card>
  );
}
