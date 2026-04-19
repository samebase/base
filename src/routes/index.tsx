import { useQuery } from "convex/react";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const welcome = useQuery(api.messages.getWelcomeMessage, {});

  return (
    <main>
      <h1>{welcome?.title ?? "Connecting to Convex..."}</h1>
      <p>{welcome?.detail ?? "Run the local Convex bootstrap to finish wiring the app."}</p>
    </main>
  );
}
