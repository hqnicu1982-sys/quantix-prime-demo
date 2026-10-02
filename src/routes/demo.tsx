import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { getSession, signInToPublicDemo } from "@/lib/authSession";

const TITLE = "FixMargin demo — explore the sample project";
const DESCRIPTION = "Open the FixMargin sample project and explore the complete drylining commercial workflow.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DemoEntryPage,
});

function DemoEntryPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Opening the FixMargin demo…");

  useEffect(() => {
    let active = true;

    const openDemo = async () => {
      try {
        if (!getSession()) await signInToPublicDemo();
        if (active) navigate({ to: "/", replace: true });
      } catch {
        if (active) setMessage("The demo could not be opened. Please try again.");
      }
    };

    void openDemo();
    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="text-center" role="status" aria-live="polite">
        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[var(--accent-500)]" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold">{message}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sample data is ready to explore.</p>
      </div>
    </main>
  );
}