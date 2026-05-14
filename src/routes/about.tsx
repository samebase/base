import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="page">
      <h1>About</h1>
      <p>This route exists to prove file-based routing works before we add more.</p>
    </main>
  );
}
