import { defineApp } from "convex/server";
import { v } from "convex/values";
import auth from "@convex-dev/auth/convex.config";
import anonymous from "@convex-dev/auth/components/anonymous/convex.config";
import oauth from "@convex-dev/auth/components/oauth/convex.config";
import hosting from "@samebase/convex-hosting/convex.config";

// A push fails while a variable is missing on the deployment. scripts/ensure-convex-auth.ts creates
// the keys and the off values of the three IDENTITY_HUB_ variables before each push when they are
// missing, and keeps any value that exists. alchemy.run.ts writes the hub's values after the push.
const app = defineApp({
  env: {
    AUTH_PRIVATE_KEY: v.string(),
    AUTH_JWKS: v.string(),
    IDENTITY_HUB_ISSUER: v.string(),
    IDENTITY_HUB_CLIENT_ID: v.string(),
    IDENTITY_HUB_CLIENT_SECRET: v.string(),
    // The repository id that convex/http.ts serves at /samebase-verification.json.
    SAMEBASE_REPOSITORY_ID: v.optional(v.string()),
  },
});
app.use(auth, {
  httpPrefix: "/auth",
  env: { AUTH_PRIVATE_KEY: app.env.AUTH_PRIVATE_KEY, AUTH_JWKS: app.env.AUTH_JWKS },
});
app.use(anonymous);
// Google sign-in through the identity hub of Samebase, an OpenID Provider at IDENTITY_HUB_ISSUER. The
// hub sends the browser back to <site>/auth/hub/callback, the callback URL of this deployment's client.
// Convex refuses to bind the component's required variables to optional ones, so every deployment
// holds them, and a deployment without a client holds the off values.
app.use(oauth, {
  name: "authHub",
  httpPrefix: "/auth/hub",
  env: {
    CLIENT_ID: app.env.IDENTITY_HUB_CLIENT_ID,
    CLIENT_SECRET: app.env.IDENTITY_HUB_CLIENT_SECRET,
  },
});
app.use(hosting);

export default app;
