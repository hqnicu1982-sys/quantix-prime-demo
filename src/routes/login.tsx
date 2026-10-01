import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LogIn, Mail, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { signIn } from "@/lib/authSession";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — FixMargin" },
      { name: "description", content: "Sign in to your FixMargin account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("na@fixmargin.dev");
  const [password, setPassword] = useState("demo");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const me = await signIn(email, password);
      toast.success(`Welcome back, ${me.name}`);
      navigate({ to: search.redirect || "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[var(--navy-950)] dark:sidebar-dot-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <span className="dark:hidden"><Logo /></span>
          <span className="hidden dark:block"><Logo light /></span>
        </div>
        <div className="rounded-xl border border-border bg-card p-7 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-foreground dark:text-white">Sign in</h1>
          <p className="mt-1 text-[13px] text-muted-foreground dark:text-white/60">Welcome back to FixMargin.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="dark:text-white/80">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-white/40" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-white/30" />
              </div>
            </div>
            <div>
              <Label htmlFor="pw" className="dark:text-white/80">Password</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-white/40" />
                <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-white/30" />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : <><LogIn className="mr-2 h-4 w-4" /> Sign in</>}
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-border bg-muted/50 p-3 text-[11.5px] text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/55">
            <strong className="text-foreground dark:text-white/80">Demo credentials:</strong> any team member email
            (e.g. <code className="text-[var(--accent-500)] dark:text-[var(--accent-100)]">na@fixmargin.dev</code>,{" "}
            <code className="text-[var(--accent-500)] dark:text-[var(--accent-100)]">sm@fixmargin.dev</code>,{" "}
            <code className="text-[var(--accent-500)] dark:text-[var(--accent-100)]">dp@fixmargin.dev</code>) with password{" "}
            <code className="text-[var(--accent-500)] dark:text-[var(--accent-100)]">demo</code>.
          </div>

          <p className="mt-5 text-center text-[12.5px] text-muted-foreground dark:text-white/60">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-foreground hover:text-[var(--accent-500)] dark:text-white">
              Create an account <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-[11.5px] text-muted-foreground dark:text-white/40">
          <Link to="/how-to" className="hover:text-foreground dark:hover:text-white">Take the workflow tour</Link>
          {" · "}
          <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="hover:text-foreground dark:hover:text-white">Back</a>
        </p>
      </div>
    </div>
  );
}
