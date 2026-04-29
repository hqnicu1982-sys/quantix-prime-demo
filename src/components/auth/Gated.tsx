import type { ReactNode } from "react";
import { useCan } from "@/lib/permissions";
import type { Capability } from "@/lib/permissions";

/**
 * Render children only when the current user has the capability.
 * If `fallback` is provided, render that instead.
 * If `disable` is true, render children but disabled (with a tooltip title).
 */
export function Gated({
  cap,
  children,
  fallback = null,
  disable = false,
  tooltip,
}: {
  cap: Capability;
  children: ReactNode;
  fallback?: ReactNode;
  disable?: boolean;
  tooltip?: string;
}) {
  const allowed = useCan(cap);
  if (allowed) return <>{children}</>;
  if (disable) {
    return (
      <span
        title={tooltip ?? "You don't have permission for this action"}
        aria-disabled="true"
        className="pointer-events-none inline-flex opacity-50"
      >
        {children}
      </span>
    );
  }
  return <>{fallback}</>;
}
