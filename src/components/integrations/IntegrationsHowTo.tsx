import { useEffect, useState } from "react";
import { Card } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plug,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

const STORAGE_KEY = "qp-integrations-howto";

type State = { dismissed: boolean; open: boolean };

function load(): State {
  if (typeof window === "undefined") return { dismissed: false, open: true };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, open: true };
    return { dismissed: false, open: true, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    return { dismissed: false, open: true };
  }
}

function save(state: State) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const STEPS = [
  {
    icon: Plug,
    title: "1. Choose the app",
    body:
      "Find the tool you use (Xero, Asta, Procore, Slack, …) in the list below and click Connect on its card.",
  },
  {
    icon: KeyRound,
    title: "2. Add your credentials",
    body:
      "Enter the account name (e.g. company@xero.com) and paste the API key or token from the app's settings. We store only a masked preview.",
  },
  {
    icon: RefreshCw,
    title: "3. Pick a sync frequency",
    body:
      "Manual, every 15 min, hourly or daily. You can change it any time from the ⚙ Settings button on the card.",
  },
  {
    icon: ShieldCheck,
    title: "4. Verify & use",
    body:
      "Once connected the card shows a green Connected badge and last sync time. Press Sync to pull data on demand, or Disconnect from Settings to remove access.",
  },
];

export function IntegrationsHowTo() {
  const [state, setState] = useState<State>({ dismissed: false, open: true });

  useEffect(() => {
    setState(load());
  }, []);

  if (state.dismissed) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        onClick={() => {
          const next = { dismissed: false, open: true };
          setState(next);
          save(next);
        }}
      >
        <BookOpen className="h-3.5 w-3.5" /> Show how-to guide
      </button>
    );
  }

  const toggle = () => {
    const next = { ...state, open: !state.open };
    setState(next);
    save(next);
  };

  const dismiss = () => {
    const next = { dismissed: true, open: false };
    setState(next);
    save(next);
  };

  return (
    <Card className="overflow-hidden border-[var(--ink-200)] bg-gradient-to-br from-[var(--ink-50)] to-card">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-card text-[var(--ink-900)] shadow-sm">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-semibold text-[var(--ink-900)]">
              How to connect an app to Quantix
            </h3>
            <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
              A 4-step walkthrough — takes about a minute per integration.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={toggle} aria-label={state.open ? "Collapse" : "Expand"}>
            {state.open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} aria-label="Hide guide">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {state.open && (
        <div className="grid gap-3 border-t border-[var(--ink-200)] px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-md border border-[var(--ink-200)] bg-card p-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink-50)] text-[var(--ink-700)]">
                <step.icon className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-[12.5px] font-semibold text-[var(--ink-900)]">{step.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--ink-500)]">{step.body}</p>
            </div>
          ))}
        </div>
      )}

      {state.open && (
        <div className="border-t border-[var(--ink-200)] bg-card/60 px-5 py-3 text-[11.5px] text-[var(--ink-500)]">
          <span className="font-semibold text-[var(--ink-700)]">Tip:</span>{" "}
          Don't have an API key yet? Open your tool's settings → Developers / API access → Generate token, then come back here and paste it.
        </div>
      )}
    </Card>
  );
}