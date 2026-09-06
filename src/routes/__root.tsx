import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../style.css?url";
import { SamebaseAttribution } from "#components/SamebaseAttribution";
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
});

function RootComponent() {
  return (
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
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="mx-auto w-full max-w-2xl px-4 py-3 text-right text-muted-foreground">
        <SamebaseAttribution />
      </footer>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
