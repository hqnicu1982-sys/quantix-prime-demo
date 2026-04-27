import { useEffect, useState } from "react";
import type { Project, Health } from "./mockData";

const KEY = "qp-custom-projects";
const EVT = "qp-custom-projects-change";

function read(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Project[]) : [];
  } catch {
    return [];
  }
}

function write(list: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function addCustomProject(p: Omit<Project, "id" | "hasFullData"> & { id?: string }): Project {
  const id =
    p.id ??
    p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
  const project: Project = { ...p, id, hasFullData: false };
  const next = [project, ...read()];
  write(next);
  return project;
}

export function useCustomProjects(): Project[] {
  const [list, setList] = useState<Project[]>([]);
  useEffect(() => {
    setList(read());
    const onChange = () => setList(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return list;
}

export function inferHealth(margin: number, progress: number): Health {
  if (progress < 10) return "starting";
  if (margin < 12) return "risk";
  if (margin < 18) return "watch";
  return "healthy";
}