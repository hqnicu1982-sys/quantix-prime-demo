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
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Quantix Prime" },
      { name: "description", content: "Sign in to your Quantix Prime account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("na@quantix.dev");
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
    <div className="min-h-screen bg-[var(--navy-950)] sidebar-dot-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo light /></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-1 text-[13px] text-white/60">Welcome back to Quantix Prime.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30" />
              </div>
            </div>
            <div>
              <Label htmlFor="pw" className="text-white/80">Password</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30" />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : <><LogIn className="mr-2 h-4 w-4" /> Sign in</>}
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-3 text-[11.5px] text-white/55">
            <strong className="text-white/80">Demo credentials:</strong> any team member email
            (e.g. <code className="text-[var(--accent-100)]">na@quantix.dev</code>,{" "}
            <code className="text-[var(--accent-100)]">sm@quantix.dev</code>,{" "}
            <code className="text-[var(--accent-100)]">dp@quantix.dev</code>) with password{" "}
            <code className="text-[var(--accent-100)]">demo</code>.
          </div>

          <p className="mt-5 text-center text-[12.5px] text-white/60">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-white hover:text-[var(--accent-500)]">
              Create an account <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-[11.5px] text-white/40">
          <Link to="/how-to" className="hover:text-white">Take the workflow tour</Link>
          {" · "}
          <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="hover:text-white">Back</a>
        </p>
      </div>
    </div>
  );
}
