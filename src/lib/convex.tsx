import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = import.meta.env["VITE_CONVEX_URL"];
let convexClient: ConvexReactClient | undefined;

export function ConvexClientProvider({ children }: Readonly<{ children: ReactNode }>) {
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is required. Run a supported Samebase dev or deploy command.");
  }

  convexClient ??= new ConvexReactClient(convexUrl);
  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
