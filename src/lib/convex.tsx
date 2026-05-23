import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: Readonly<{ children: ReactNode }>) {
  if (!convexClient) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="text-xl">Convex setup</h1>
        <p>Set VITE_CONVEX_URL in .env.local to connect the app.</p>
      </main>
    );
  }

  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
