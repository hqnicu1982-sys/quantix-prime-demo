import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  MousePointerClick,
  Move,
  Upload,
  Users,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

const STORAGE_KEY = "qp-planner-howto";

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

type LinkSpec = { label: string; to: string; params?: Record<string, string> };

type Step = { text: string; link?: LinkSpec };

type Section = {
  icon: typeof MousePointerClick;
  title: string;
  subtitle: string;
  steps: Step[];
};

type FooterItem = {
  icon: typeof Users;
  title: string;
  body: string;
  link?: LinkSpec;
};

function buildSections(projectId: string): Section[] {
  return [
    {
      icon: MousePointerClick,
      title: "1. Adaugă taskuri manual",
      subtitle: "Cel mai rapid mod de a începe — perfect pentru proiecte mici sau ajustări rapide.",
      steps: [
        { text: "Apasă „+ New task" din header — completează titlu, dată start/end și ore planificate." },
        {
          text: "Asignează un crew din lista de echipe ca să blochezi costul de manoperă.",
          link: { label: "Setează ratele crew", to: "/settings/labour" },
        },
        {
          text: "(Opțional) Leagă linii din BoQ — task-ul devine „ready" doar când materialele au call-off aprobat.",
          link: { label: "Vezi Costed BoQ", to: "/projects/$projectId/costed-boq", params: { projectId } },
        },
      ],
    },
    {
      icon: Move,
      title: "2. Editează direct pe Gantt",
      subtitle: "Reorganizează programul vizual — drag, resize, click pentru detalii.",
      steps: [
        { text: "Trage corpul barei pentru a muta task-ul în calendar." },
        { text: "Trage marginile pentru a redimensiona durata (orele planificate se ajustează proporțional)." },
        { text: "Click pe bară pentru a deschide detaliile — progres, dependențe, blockers, call-offs." },
        { text: "Comută zoom-ul day / week / month din header-ul Gantt pentru perspectivă diferită." },
      ],
    },
    {
      icon: Upload,
      title: "3. Importă un program existent",
      subtitle: "Sincronizează din MSProject sau încarcă un fișier — populezi tot plannerul într-un click.",
      steps: [
        { text: "Apasă „Import MSP" din header pentru a deschide dialogul de import." },
        { text: "Alege sursa: sync live, upload .xml / .csv / .pdf, sau Sample programme." },
        { text: "Mod „Merge" păstrează crew + call-offs existente; „Replace" șterge și recreează tot." },
        { text: "După apply, taskurile au plannedHours din MSP și un banner de sync apare aici sus." },
        {
          text: "Conectează MSProject live pentru sync bidirecțional permanent.",
          link: { label: "Integrations", to: "/integrations" },
        },
      ],
    },
  ];
}

function buildFooter(projectId: string): FooterItem[] {
  return [
    {
      icon: Users,
      title: "Alocă crew-urile",
      body: "După import, orele apar ca „estimated". Asignează crew → labour planificat se blochează și confidence-ul crește.",
    },
    {
      icon: AlertTriangle,
      title: "Rezolvă blockers",
      body: "Panoul de blockers detectează material lipsă, predecesori întârziați, crew dublu-bookuit și variații neaprobate.",
    },
    {
      icon: TrendingUp,
      title: "Verifică Profit Forecast",
      body: "Orele din planner alimentează automat EAC-ul — vezi impactul în tab-ul Financial al proiectului.",
      link: { label: "Deschide Financial", to: "/projects/$projectId", params: { projectId } },
    },
  ];
}

function StepLink({ link }: { link: LinkSpec }) {
  return (
    <Link
      to={link.to}
      params={link.params as never}
      className="ml-1 inline-flex items-center gap-0.5 text-[11.5px] font-medium text-[var(--ink-900)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
    >
      {link.label}
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}

export function PlannerHowTo({ projectId }: { projectId: string }) {
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
        <BookOpen className="h-3.5 w-3.5" /> Arată ghidul Planner
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

  const sections = buildSections(projectId);
  const footer = buildFooter(projectId);

  return (
    <Card className="overflow-hidden border-[var(--ink-200)] bg-gradient-to-br from-[var(--ink-50)] to-card">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-card text-[var(--ink-900)] shadow-sm">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-semibold text-[var(--ink-900)]">
              Cum funcționează Execution Planner
            </h3>
            <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
              Trei moduri de a popula plannerul, plus pașii după ce taskurile sunt în program.
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
        <>
          <div className="grid gap-3 border-t border-[var(--ink-200)] px-5 py-4 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="rounded-md border border-[var(--ink-200)] bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink-50)] text-[var(--ink-700)]">
                    <section.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[12.5px] font-semibold text-[var(--ink-900)]">{section.title}</p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--ink-500)]">{section.subtitle}</p>
                <ol className="mt-2.5 space-y-1.5">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex gap-1.5 text-[11.5px] leading-relaxed text-[var(--ink-700)]">
                      <span className="mt-[1px] text-[var(--ink-500)]">{i + 1}.</span>
                      <span>
                        {step.text}
                        {step.link && <StepLink link={step.link} />}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="grid gap-3 border-t border-[var(--ink-200)] bg-card/60 px-5 py-4 md:grid-cols-3">
            {footer.map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--ink-50)] text-[var(--ink-700)]">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--ink-900)]">{item.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--ink-500)]">
                    {item.body}
                    {item.link && <StepLink link={item.link} />}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}