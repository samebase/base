import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "../lib/convex";
import appCss from "../style.css?url";
import { Button } from "#components/ui/button";

export const Route = createRootRoute({
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
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <ConvexClientProvider>
        <nav className="mx-auto flex w-full max-w-2xl pt-2">
          <Button asChild variant="link">
            <Link to="/" activeOptions={{ exact: true }}>
              Home
            </Link>
          </Button>
          <Button asChild variant="link">
            <Link to="/about">About</Link>
          </Button>
        </nav>
        <Outlet />
      </ConvexClientProvider>
    </RootDocument>
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
