import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const welcome = useQuery(anyApi.messages.getWelcomeMessage, {});

  return (
    <main>
      <h1>{welcome?.title ?? "Connecting to Convex..."}</h1>
      <p>{welcome?.detail ?? "Run the local Convex bootstrap to finish wiring the app."}</p>
    </main>
  );
}
