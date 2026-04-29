import { useEffect, useState } from "react";
import { team, type TeamMember } from "./mockData";

// ============================================================================
// Current user — mock auth. Drives role-based UI throughout the app.
// localStorage-backed. Default: Nick Andrei (Pro / Site Manager).
// ============================================================================

const KEY = "qp-current-user";
const DEFAULT_ID = "na";
const EVT = "qp-current-user-change";

export type Tier = TeamMember["tier"];

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return DEFAULT_ID;
  return localStorage.getItem(KEY) ?? DEFAULT_ID;
}

export function setCurrentUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new Event(EVT));
}

export function getCurrentUser(): TeamMember {
  const id = getCurrentUserId();
  return team.find((t) => t.id === id) ?? team.find((t) => t.id === DEFAULT_ID)!;
}

export function useCurrentUser(): TeamMember {
  // Always start with the SSR-safe default so the first client render matches
  // server output. After hydration, sync with localStorage. This avoids
  // hydration mismatches when a different user is persisted in localStorage.
  const [user, setUser] = useState<TeamMember>(
    () => team.find((t) => t.id === DEFAULT_ID)!,
  );
  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return user;
}

export function useCurrentTier(): Tier {
  return useCurrentUser().tier;
}
