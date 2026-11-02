import type { ConvexQueryClient } from "@convex-dev/react-query";
import { SessionProvider, SignedIn, sessionBeforeLoad } from "@samebase/convex-auth-tanstack-start";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../style.css?url";
import { Button } from "#components/ui/button";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  beforeLoad: sessionBeforeLoad,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Samebase app",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  const { convexQueryClient, token } = Route.useRouteContext();
  return (
    <SessionProvider client={convexQueryClient.convexClient} token={token}>
      <RootDocument>
        <nav className="mx-auto flex w-full max-w-2xl pt-2">
          <Button asChild variant="link">
            <Link to="/" activeOptions={{ exact: true }}>
              Home
            </Link>
          </Button>
          <Button asChild variant="link">
            <Link to="/about">About</Link>
          </Button>
          {/* The server renders as the session of the request's cookies, so the first HTML already
              has the right link. A prerendered page fills it in once the browser knows. */}
          <SignedIn>
            <Button asChild variant="link">
              <Link to="/account">Account</Link>
            </Button>
          </SignedIn>
        </nav>
        <Outlet />
      </RootDocument>
    </SessionProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundPage() {
  return <p>Not Found</p>;
}
