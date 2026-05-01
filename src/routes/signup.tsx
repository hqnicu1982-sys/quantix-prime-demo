import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { UserPlus, Mail, KeyRound, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { signUp } from "@/lib/authSession";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Quantix Prime" },
      { name: "description", content: "Create your Quantix Prime account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const me = await signUp(name, email, password);
      toast.success(`Account created — welcome, ${me.name}`);
      navigate({ to: "/how-to" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--navy-950)] sidebar-dot-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo light /></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-[13px] text-white/60">Start exploring Quantix Prime in seconds.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name" className="text-white/80">Full name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Builder"
                  className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30" />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30" />
              </div>
            </div>
            <div>
              <Label htmlFor="pw" className="text-white/80">Password</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input id="pw" type="password" required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30" />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating…" : <><UserPlus className="mr-2 h-4 w-4" /> Create account</>}
            </Button>
          </form>

          <p className="mt-5 text-center text-[12.5px] text-white/60">
            Already have an account?{" "}
            <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-white hover:text-[var(--accent-500)]">Sign in</Link>
          </p>
        </div>
        <p className="mt-4 text-center text-[11.5px] text-white/40">
          Demo only — accounts live in your browser's localStorage.
        </p>
      </div>
    </div>
  );
}
