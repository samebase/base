import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="page">
      <h1>noter.md app</h1>
      <p>TanStack Start owns the route shell while the app stays client-first.</p>
    </main>
  );
}
