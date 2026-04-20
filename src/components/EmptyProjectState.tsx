import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { projects } from "@/lib/mockData";

export function EmptyProjectState({ screen }: { screen: string }) {
  const { current, setCurrent } = useProject();
  return (
    <Card className="mx-auto mt-12 max-w-xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
        <Database className="h-6 w-6 text-accent" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">Demo data coming soon</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{current.name}</span> is in this demo as a project switcher example. Full <span className="font-medium">{screen}</span> data is only populated for Hotel Fitzrovia.
      </p>
      <Button className="mt-5" onClick={() => setCurrent(projects[0].id)}>
        Switch to Hotel Fitzrovia <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </Card>
  );
}
