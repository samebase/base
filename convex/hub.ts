import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { v } from "convex/values";
import { env, internalMutation, query } from "./_generated/server";
import { unusedGuestName } from "./guests";

const { boolean, id, literal, object, string } = v;

/**
 * Convex Auth calls this once for each new hub `sub`. It never looks at the email, so a person with
 * two accounts, such as a guest who then signs in with Google, has two users. `name` is public, as
 * the to-do list shows it to every visitor, so it is a guest name. `fullName` and `email` stay private.
 */
export const createUser = internalMutation({
  args: {
    provider: object({
      name: literal("hub"),
      accountId: string(),
      profile: vGoogleProfile,
    }),
  },
  returns: id("users"),
  handler: async (ctx, { provider: { profile } }) => {
    return await ctx.db.insert("users", {
      name: await unusedGuestName(ctx),
      ...(profile.name ? { fullName: profile.name } : {}),
      ...(profile.emailVerified && profile.email ? { email: profile.email } : {}),
    });
  },
});

/** True when the hub gave this deployment a client. `no-hub` is the client ID of the off values. */
export const googleSignInEnabled = query({
  args: {},
  returns: boolean(),
  handler: async () => {
    return Boolean(env.HUB_CLIENT_ID) && env.HUB_CLIENT_ID !== "no-hub";
  },
});
