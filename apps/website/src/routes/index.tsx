import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <h1>TanStack Router is wired.</h1>
      <p>Next step: add Convex.</p>
    </main>
  );
}
