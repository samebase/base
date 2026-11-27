import { defineApp } from "convex/server";
import { v } from "convex/values";
import auth from "@convex-dev/auth/convex.config";
import anonymous from "@convex-dev/auth/components/anonymous/convex.config";
import oauth from "@convex-dev/auth/components/oauth/convex.config";
import hosting from "@samebase/convex-hosting/convex.config";

// A push fails while a variable is missing. scripts/ensure-convex-auth.ts sets them before each push.
const app = defineApp({
  env: {
    AUTH_PRIVATE_KEY: v.string(),
    AUTH_JWKS: v.string(),
    // <site>/oauth-client.json, the address of the document that convex/http.ts serves.
    OAUTH_CLIENT_ID: v.string(),
  },
});
app.use(auth, {
  httpPrefix: "/auth",
  env: { AUTH_PRIVATE_KEY: app.env.AUTH_PRIVATE_KEY, AUTH_JWKS: app.env.AUTH_JWKS },
});
app.use(anonymous);
// Sign-in at login.samebase.com as a public client: the empty secret counts as none at its token
// endpoint. The name "authHub" and the prefix "/auth/hub" stay: account rows hold the provider "hub".
app.use(oauth, {
  name: "authHub",
  httpPrefix: "/auth/hub",
  env: { CLIENT_ID: app.env.OAUTH_CLIENT_ID, CLIENT_SECRET: "" },
});
app.use(hosting);

export default app;
