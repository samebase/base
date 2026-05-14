import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl">About</h1>
      <p>This route exists to prove file-based routing works before we add more.</p>
    </main>
  );
}
