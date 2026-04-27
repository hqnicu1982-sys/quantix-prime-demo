import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHead, Section } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/catalog")({ component: Catalog });

type Family = {
  id: string;
  name: string;
  blurb: string;
  status: "live" | "beta" | "roadmap";
};

const families: Family[] = [
  { id: "walls",    name: "Partitions & Walls", blurb: "Internal partition systems.",      status: "live" },
  { id: "lining",   name: "Wall Linings",       blurb: "Independent & direct linings.",   status: "live" },
  { id: "shaft",    name: "Shaftwalls",         blurb: "Fire rated systems.",              status: "live" },
  { id: "steel",    name: "Steel Protection",   blurb: "Board & coating fire protection.", status: "roadmap" },
  { id: "ceilings", name: "Ceilings",           blurb: "MF ceilings and horizontal shaftwalls.", status: "beta" },
  { id: "floors",   name: "Floors",             blurb: "Floating and acoustic floors.",   status: "roadmap" },
  { id: "external", name: "External Walls",     blurb: "Lightweight external wall systems.", status: "roadmap" },
  { id: "plasters", name: "Plasters",           blurb: "Skim & undercoat plaster systems.", status: "roadmap" },
];

// Pretend matched results when user clicks Recommend
const matches = [
  { code: "GIWL-146-I-80-1L-DL15 (B)", name: "Independent lining · DuraLine 15", height: "7.2 m", fire: "—",     rw: "—",   centres: "600 mm" },
  { code: "GIWL-92-C-50-2L-WB12.5",    name: "Independent lining · 2× WallBoard 12.5", height: "5.4 m", fire: "60 min", rw: "44 dB", centres: "600 mm" },
  { code: "GDWL-DL15-1L",              name: "Direct lining · DuraLine 15 (dabs)", height: "3.6 m", fire: "—",     rw: "—",   centres: "—" },
];

function Catalog() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string>("walls");
  const [showResults, setShowResults] = useState(false);

  const statusBadge = (s: Family["status"]) => {
    const map = {
      live:    { t: "LIVE",    cls: "bg-[var(--green-600)]/15 text-[var(--green-600)]" },
      beta:    { t: "BETA",    cls: "bg-[var(--amber-500)]/15 text-[var(--amber-500)]" },
      roadmap: { t: "ROADMAP", cls: "bg-[var(--ink-200)] text-[var(--ink-700)]" },
    }[s];
    return <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-wider ${map.cls}`}>{map.t}</span>;
  };

  return (
    <Section
      title="Guided Selection"
      subtitle="Select compatible BG systems for your project. Pick a family, set requirements, and we'll match the right systems."
      right={
        <Button size="sm" onClick={() => navigate({ to: "/calculator" })}>
          Open calculator <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      }
    >
      {/* System type grid */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          System type — choose which BG system family you want to work with
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {families.map(f => {
            const isPicked = picked === f.id;
            const disabled = f.status === "roadmap";
            return (
              <button
                key={f.id}
                disabled={disabled}
                onClick={() => !disabled && setPicked(f.id)}
                className={`group relative flex flex-col rounded-[12px] border p-4 text-left transition-all ${
                  disabled
                    ? "cursor-not-allowed border-[var(--ink-200)] bg-[var(--ink-50)] opacity-60"
                    : isPicked
                    ? "border-[var(--accent-500)] bg-[var(--accent-500)]/5 shadow-[0_4px_18px_-8px_rgba(37,99,235,0.4)]"
                    : "border-[var(--ink-200)] bg-card hover:border-[var(--ink-900)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isPicked
                        ? "border-[var(--accent-500)] bg-[var(--accent-500)] text-white"
                        : "border-[var(--ink-200)] bg-card"
                    }`}
                  >
                    {isPicked && <Check className="h-3 w-3" />}
                  </span>
                  {statusBadge(f.status)}
                </div>
                <p className="mt-4 text-[15px] font-semibold leading-tight text-[var(--ink-900)]">{f.name}</p>
                <p className="mt-1 text-[12px] text-[var(--ink-500)]">{f.blurb}</p>
                <p className={`mt-4 text-[12px] font-semibold ${
                  disabled ? "text-[var(--ink-500)]" : isPicked ? "text-[var(--accent-500)]" : "text-[var(--ink-700)] group-hover:text-[var(--accent-500)]"
                }`}>
                  {disabled ? "Coming soon" : `Select ${f.name}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculator inputs (filter the family) */}
      <Card>
        <CardHead title="Calculator inputs" subtitle="Filters are optional. Empty fields won't constrain results." />
        <div className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <ReqField label="Min height (m)" placeholder="e.g. 3.6" />
            <ReqField label="Min Rw (dB)"    placeholder="e.g. 50" />
            <ReqField label="Min Fire (min)" placeholder="e.g. 60" />
            <ReqField label="Max thickness (mm)" placeholder="e.g. 150" />
            <ReqSelect label="Duty rating" options={["Any","SD1","SD2","SD3","SD4"]} />
            <ReqSelect label="Board type"  options={["Any","WallBoard","DuraLine","SoundBloc","FireLine","Glasroc F"]} />
            <ReqSelect label="Stud size"   options={["Any","48","70","92","146"]} />
            <div className="flex items-end">
              <Button className="w-full" onClick={() => { setShowResults(true); toast.success("3 systems matched"); }}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommend systems
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <CardHead
          title={showResults ? `${matches.length} matching systems` : "No matching systems"}
          subtitle={showResults ? "Sorted by best match — load any to the calculator." : "Adjust your filters and try again."}
          right={
            <select className="rounded-md border border-[var(--ink-200)] bg-card px-3 py-1.5 text-[12px] font-medium">
              <option>Best match</option>
              <option>Lowest cost</option>
              <option>Tallest height</option>
            </select>
          }
        />
        {showResults ? (
          <div className="divide-y divide-[var(--ink-200)]">
            {matches.map(m => (
              <div key={m.code} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono-num text-[12px] font-semibold text-[var(--accent-500)]">{m.code}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[var(--ink-900)]">{m.name}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px]">
                  <Stat k="Height" v={m.height} />
                  <Stat k="Fire"   v={m.fire} />
                  <Stat k="Rw"     v={m.rw} />
                  <Stat k="Centres" v={m.centres} />
                </div>
                <Button size="sm" variant="outline" onClick={() => { toast.success("Loaded into calculator", { description: m.code }); navigate({ to: "/calculator" }); }}>
                  Load <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] text-[var(--ink-500)]">No systems match the current filters.</p>
          </div>
        )}
      </Card>
    </Section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[var(--ink-500)]">{k}</span>
      <span className="font-mono-num font-semibold text-[var(--ink-900)]">{v}</span>
    </span>
  );
}

function ReqField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <input placeholder={placeholder} className="w-full rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] placeholder:text-[var(--ink-500)] focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20" />
    </div>
  );
}

function ReqSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <select className="w-full rounded-md border border-[var(--ink-200)] bg-card px-3 py-2 text-[13px] font-medium focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/20">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
