import { createFileRoute } from "@tanstack/react-router";

/** Keeps Not Found out of the first client render so it matches the empty SPA shell. */
export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return <p>Not Found</p>;
}
