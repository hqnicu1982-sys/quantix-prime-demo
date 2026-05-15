import { createContext, useContext, useState, type ReactNode } from "react";
import { projects, type Project, type Persona } from "./mockData";
import { useCustomProjects, useProjectOverrides, useHiddenProjectIds } from "./customProjects";

type Ctx = {
  current: Project;
  setCurrent: (id: string) => void;
  all: Project[];
  persona: Persona;
  setPersona: (p: Persona) => void;
};

const ProjectContext = createContext<Ctx | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  // Lazy initializers read localStorage synchronously on the client so the
  // FIRST client render already matches persisted state. The server render
  // uses the defaults; we suppress hydration mismatches at the layout shell
  // (AppLayout defers rendering until mounted), so this is safe and removes
  // the one-frame "wrong persona highlighted" flash.
  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === "undefined") return projects[0].id;
    return localStorage.getItem("qp-current-project") ?? projects[0].id;
  });
  const [persona, setPersonaState] = useState<Persona>(() => {
    if (typeof window === "undefined") return "site";
    const stored = localStorage.getItem("qp-persona");
    return stored === "site" || stored === "commercial" ? stored : "site";
  });
  const custom = useCustomProjects();
  const overrides = useProjectOverrides();
  const hidden = useHiddenProjectIds();

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    if (typeof window !== "undefined") localStorage.setItem("qp-persona", p);
  };

  const setCurrent = (id: string) => {
    setCurrentId(id);
    if (typeof window !== "undefined") localStorage.setItem("qp-current-project", id);
  };

  const merged = [...custom, ...projects]
    .filter((p) => !hidden.includes(p.id))
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
  const all = merged;
  const current = all.find((p) => p.id === currentId) ?? all[0] ?? projects[0];
  return (
    <ProjectContext.Provider value={{ current, setCurrent, all, persona, setPersona }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectProvider");
  return ctx;
}
