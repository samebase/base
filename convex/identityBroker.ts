import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { unusedGuestName } from "./guests";

const { id, literal, object, string } = v;

/**
 * Convex Auth calls this once for each new broker `sub`. It never looks at the email, so a person with
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
