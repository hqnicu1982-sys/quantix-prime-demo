import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { projects, type Project, type Persona } from "./mockData";

type Ctx = {
  current: Project;
  setCurrent: (id: string) => void;
  all: Project[];
  persona: Persona;
  setPersona: (p: Persona) => void;
};

const ProjectContext = createContext<Ctx | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState<string>(projects[0].id);
  const [persona, setPersonaState] = useState<Persona>("site");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("qp-persona");
    if (stored === "site" || stored === "commercial") setPersonaState(stored);
  }, []);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    if (typeof window !== "undefined") localStorage.setItem("qp-persona", p);
  };

  const current = projects.find((p) => p.id === currentId) ?? projects[0];
  return (
    <ProjectContext.Provider value={{ current, setCurrent: setCurrentId, all: projects, persona, setPersona }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectProvider");
  return ctx;
}
