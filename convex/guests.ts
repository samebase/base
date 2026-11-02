import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const { id, literal, object, string, union } = v;

const GUEST_NAME_POOL = [
  "Ash",
  "Birch",
  "Cedar",
  "Dune",
  "Elm",
  "Fern",
  "Grove",
  "Harbor",
  "Ivy",
  "Juniper",
] as const;
const FALLBACK_GUEST_NAME_SPACE = 36 ** 6;

// Null after the account is deleted: the session's access token stays valid until it expires.
const viewerResultValidator = union(object({ name: string() }), v.null());

function shuffledGuestNames() {
  const candidates = [...GUEST_NAME_POOL];
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = candidates[index];
    candidates[index] = candidates[swapIndex];
    candidates[swapIndex] = current;
  }
  return candidates;
}

export async function unusedGuestName(ctx: MutationCtx) {
  for (const name of shuffledGuestNames()) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (!existingUser) {
      return name;
    }
  }

  // Anonymous sessions can outnumber the friendly pool in public previews.
  const suffix = Math.floor(Math.random() * FALLBACK_GUEST_NAME_SPACE).toString(36);
  return `Guest ${suffix.padStart(6, "0")}`;
}

/** Convex Auth calls this once for each anonymous sign-in, which is always a new account. */
export const createUser = internalMutation({
  args: {
    provider: object({
      name: literal("anonymous"),
      accountId: string(),
      profile: object({}),
    }),
  },
  returns: id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", { name: await unusedGuestName(ctx) });
  },
});

export const viewer = query({
  args: {},
  returns: viewerResultValidator,
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db.get(userId);
    return user ? { name: user.fullName ?? user.name } : null;
  },
});
