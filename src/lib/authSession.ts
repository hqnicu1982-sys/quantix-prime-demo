import { useEffect, useState } from "react";
import { team, type TeamMember } from "./mockData";
import { setCurrentUserId } from "./currentUser";

// ============================================================================
// Mock auth session — demo only. Persists "signed in" state to localStorage.
// Sign-in: any team member email (e.g. "nick@quantix.dev") matches by initials/name.
// Sign-up: registers a new TeamMember at runtime under "Pro" tier.
// ============================================================================

const SESSION_KEY = "qp-auth-session-v1";
const REGISTRY_KEY = "qp-auth-registry-v1";
const EVT = "qp-auth-change";

type Session = { userId: string; email: string; signedInAt: string };
type Registry = Record<string, { password: string; userId: string }>;

// Seed: every team member can sign in with email `<id>@quantix.dev` / password `demo`.
function seedRegistry(): Registry {
  const existing = readRegistry();
  if (Object.keys(existing).length > 0) return existing;
  const reg: Registry = {};
  for (const m of team) {
    const email = (m.email ?? `${m.id}@quantix.dev`).toLowerCase();
    reg[email] = { password: "demo", userId: m.id };
  }
  writeRegistry(reg);
  return reg;
}

function readRegistry(): Registry {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "{}"); } catch { return {}; }
}
function writeRegistry(r: Registry) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(r));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
}

export function isSignedIn(): boolean {
  return getSession() !== null;
}

export async function signIn(email: string, password: string): Promise<TeamMember> {
  const reg = seedRegistry();
  const key = email.trim().toLowerCase();
  const entry = reg[key];
  if (!entry) throw new Error("No account found for this email");
  if (entry.password !== password) throw new Error("Incorrect password");
  const member = team.find((t) => t.id === entry.userId);
  if (!member) throw new Error("User no longer exists");
  const session: Session = { userId: member.id, email: key, signedInAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setCurrentUserId(member.id);
  window.dispatchEvent(new Event(EVT));
  return member;
}

export async function signUp(name: string, email: string, password: string): Promise<TeamMember> {
  const reg = seedRegistry();
  const key = email.trim().toLowerCase();
  if (reg[key]) throw new Error("An account with this email already exists");
  if (password.length < 4) throw new Error("Password must be at least 4 characters");
  // Mint a new mock team member (lives in-memory for the session).
  const id = `u_${Date.now().toString(36)}`;
  const initials = name.split(/\s+/).map((p) => p[0]?.toUpperCase()).join("").slice(0, 2) || "QP";
  const member: TeamMember = {
    id,
    name: name.trim() || key.split("@")[0],
    role: "Site Manager",
    tier: "Pro",
    initials,
    email: key,
    joined: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    projects: 0,
    capability: "Self-registered demo account",
    lastActive: "now",
    status: "active",
  };
  team.push(member);
  reg[key] = { password, userId: id };
  writeRegistry(reg);
  const session: Session = { userId: id, email: key, signedInAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setCurrentUserId(id);
  window.dispatchEvent(new Event(EVT));
  return member;
}

export function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => {
    const refresh = () => setS(getSession());
    refresh();
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return s;
}

// Returns true once we've read auth state from storage on the client.
// Use this to gate redirects so we don't bounce signed-in users to /login
// during the first render where useState still holds the SSR-safe `null`.
export function useSessionReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready;
}

export const PUBLIC_PATHS = ["/login", "/signup", "/how-to"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
