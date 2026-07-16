import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { addInvite, useRoles } from "@/lib/labour";
import { useProject } from "@/lib/ProjectContext";
import { toast } from "sonner";

type Tier = "Admin" | "Pro Control" | "Pro" | "Operative";

export function InviteMemberDialog({
  defaultProjectId,
  trigger,
}: {
  defaultProjectId?: string;
  trigger?: React.ReactNode;
}) {
  const roles = useRoles();
  const { all: projects } = useProject();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const [rate, setRate] = useState<number>(roles[0]?.defaultRate ?? 0);
  const [tier, setTier] = useState<Tier>("Operative");
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);

  const onRoleChange = (id: string) => {
    setRoleId(id);
    const r = roles.find((x) => x.id === id);
    if (r) setRate(r.defaultRate);
  };

  const reset = () => {
    setEmail(""); setName("");
    setRoleId(roles[0]?.id ?? "");
    setRate(roles[0]?.defaultRate ?? 0);
    setTier("Operative");
    setProjectId(defaultProjectId);
  };

  const submit = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email"); return;
    }
    addInvite({
      email: email.trim(),
      name: name.trim() || undefined,
      roleId,
      rate: Number(rate) || 0,
      tier,
      projectId,
    });
    toast.success("Invite sent", { description: `${email} · £${rate}/h` });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invite. Rate is prefilled from the role default and can be edited per person.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.co.uk" />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label className="text-[11px]">Role</Label>
            <Select value={roleId} onValueChange={onRoleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · £{r.defaultRate.toFixed(2)}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Rate £/h</Label>
            <Input type="number" step="0.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-[11px]">Permission tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Operative", "Pro", "Pro Control", "Admin"] as Tier[]).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Assign to project</Label>
            <Select value={projectId ?? "none"} onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
