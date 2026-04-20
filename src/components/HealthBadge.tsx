import { StatusBadge } from "./StatusBadge";

export function getHealthBadge(h: "healthy" | "watch" | "risk" | "starting") {
  const map = {
    healthy: { tone: "success" as const, label: "Healthy" },
    watch: { tone: "warning" as const, label: "Watch" },
    risk: { tone: "danger" as const, label: "Margin risk" },
    starting: { tone: "info" as const, label: "Starting" },
  };
  const v = map[h];
  return <StatusBadge tone={v.tone} dot>{v.label}</StatusBadge>;
}
