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

// Google and GitHub sign-in through the identity broker. The broker's id_token has the claims of the
// provider's, and its `sub`, the account key of this method, is the provider's own id with the
// provider in front, such as `google:<id>`: the same at every broker, so the app keeps its users when
// it moves to another broker. The annotation gives the exports below their types without the call, which reads the type of
// `internal`, which contains this module. The provider id "hub" stays: account rows hold it.
const broker: ReturnType<typeof setupOauth> = setupOauth(
  auth,
  "hub",
  {
    authorizationEndpoint: `${env.IDENTITY_BROKER_ISSUER}/authorize`,
    tokenEndpoint: `${env.IDENTITY_BROKER_ISSUER}/token`,
    issuer: env.IDENTITY_BROKER_ISSUER,
    scopes: ["openid", "email", "profile"],
    profile: normalizeGoogleProfile,
  },
  { createUser: internal.identityBroker.createUser },
  // The sign-in returns to the page that started it: on the site of this deployment, or on a
  // development server, at the port it chose when it started (any port of a loopback host, the
  // Samebase patch of Convex Auth in patches/).
  {
    component: components.authHub,
    allowedRedirectOrigins: [env.CONVEX_SITE_URL, "http://localhost", "http://127.0.0.1"],
  },
);
export const startSignInWithIdentityBroker = broker.startSignIn;
export const completeSignInWithIdentityBroker = broker.completeSignIn;
