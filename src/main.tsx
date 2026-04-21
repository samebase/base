import { ConvexProvider, ConvexReactClient } from "convex/react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./style.css";
import { routeTree } from "./routeTree.gen";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Start the app with `vp run dev` to let Convex bootstrap anonymously by default, or set the variable explicitly.",
  );
}

const convex = new ConvexReactClient(convexUrl);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Missing #app root element");
}

ReactDOM.createRoot(rootElement).render(
  <ConvexProvider client={convex}>
    <RouterProvider router={router} />
  </ConvexProvider>,
);
