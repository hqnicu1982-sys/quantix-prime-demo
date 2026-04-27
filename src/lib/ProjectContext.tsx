import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { projects, type Project, type Persona } from "./mockData";
import { useCustomProjects } from "./customProjects";

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
  const custom = useCustomProjects();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("qp-persona");
    if (stored === "site" || stored === "commercial") setPersonaState(stored);
    const storedProject = localStorage.getItem("qp-current-project");
    if (storedProject) setCurrentId(storedProject);
  }, []);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    if (typeof window !== "undefined") localStorage.setItem("qp-persona", p);
  };

  const setCurrent = (id: string) => {
    setCurrentId(id);
    if (typeof window !== "undefined") localStorage.setItem("qp-current-project", id);
  };

  const all = [...custom, ...projects];
  const current = all.find((p) => p.id === currentId) ?? projects[0];
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
