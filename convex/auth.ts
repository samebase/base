import { setupAnonymous } from "@convex-dev/auth/methods/anonymous/server";
import { normalizeGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { setupOauth } from "@convex-dev/auth/methods/oauth/server";
import { setupConvexAuth } from "@convex-dev/auth/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession } = auth;

export const { signInAnonymously } = setupAnonymous(auth, {
  component: components.authAnonymous,
}).attachUserCallbacks({ createUser: internal.guests.createUser });

// Google sign-in through the identity hub. The hub's id_token has the claims of Google's, and its
// `sub` is the account key of this method: the hub's id of the user in this app, not Google's. The
// annotation gives the exports below their types without the call, which reads the type of
// `internal`, which contains this module.
const hub: ReturnType<typeof setupOauth> = setupOauth(
  auth,
  "hub",
  {
    authorizationEndpoint: `${env.HUB_ISSUER}/authorize`,
    tokenEndpoint: `${env.HUB_ISSUER}/token`,
    issuer: env.HUB_ISSUER,
    scopes: ["openid", "email", "profile"],
    profile: normalizeGoogleProfile,
  },
  { createUser: internal.hub.createUser },
  // The sign-in returns to the page that started it, on the site of this deployment.
  { component: components.authHub, allowedRedirectOrigins: [env.CONVEX_SITE_URL] },
);
export const startSignInWithHub = hub.startSignIn;
export const completeSignInWithHub = hub.completeSignIn;
