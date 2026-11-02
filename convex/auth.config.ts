import type { AuthConfig } from "convex/server";
import { env } from "./_generated/server";

// The auth component signs tokens for the issuer CONVEX_SITE_URL and the audience "convex", and
// serves the key set under its /auth mount.
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "convex",
      issuer: env.CONVEX_SITE_URL,
      jwks: `${env.CONVEX_SITE_URL}/auth/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
