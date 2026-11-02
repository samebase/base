import {
  RedirectWithoutSession,
  redirectWithoutSession,
} from "@samebase/convex-auth-tanstack-start";
import { createFileRoute, Outlet } from "@tanstack/react-router";

/** The pages under `_authed/` need a session: without one, they redirect to the home page. */
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ serverContext }) => redirectWithoutSession(serverContext, { to: "/" }),
  component: () => (
    <RedirectWithoutSession to="/">
      <Outlet />
    </RedirectWithoutSession>
  ),
});
