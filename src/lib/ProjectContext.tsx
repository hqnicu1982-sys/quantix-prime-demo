import { createContext, useContext, useState, type ReactNode } from "react";
import { projects, type Project } from "./mockData";

type Ctx = {
  current: Project;
  setCurrent: (id: string) => void;
  all: Project[];
};

const ProjectContext = createContext<Ctx | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState<string>(projects[0].id);
  const current = projects.find((p) => p.id === currentId) ?? projects[0];
  return (
    <ProjectContext.Provider value={{ current, setCurrent: setCurrentId, all: projects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectProvider");
  return ctx;
}
