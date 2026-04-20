import { Section, Card } from "./Primitives";
import { Sparkles } from "lucide-react";

export function StubPage({ title, subtitle, description }: { title: string; subtitle?: string; description?: string }) {
  return (
    <Section title={title} subtitle={subtitle}>
      <Card className="p-12 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-[var(--accent-500)]" />
        <h3 className="font-display mt-4 text-[18px] font-semibold">Coming in next iteration</h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-[var(--ink-500)]">
          {description ?? "This screen is part of the v2 build and will be implemented in a follow-up turn."}
        </p>
      </Card>
    </Section>
  );
}
