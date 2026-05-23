import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const { null: nullValue, object, string, union } = v;

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

const viewerResultValidator = object({
  name: union(string(), nullValue()),
});
const ensureNameResultValidator = object({
  name: string(),
});

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

async function getRequiredUserId(ctx: { auth: Auth }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const viewer = query({
  args: {},
  returns: viewerResultValidator,
  handler: async (ctx) => {
    const userId = await getRequiredUserId(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      name: user.name ?? null,
    };
  },
});

export const ensureName = mutation({
  args: {},
  returns: ensureNameResultValidator,
  handler: async (ctx) => {
    const userId = await getRequiredUserId(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.name) {
      return { name: user.name };
    }

    const existingReservation = await ctx.db
      .query("guestNames")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existingReservation) {
      await ctx.db.patch(userId, {
        name: existingReservation.name,
      });
      return { name: existingReservation.name };
    }

    // guestNames is the exact-use ledger; users.name is only the display value.
    for (const name of shuffledGuestNames()) {
      const existingName = await ctx.db
        .query("guestNames")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();
      if (!existingName) {
        await ctx.db.insert("guestNames", {
          name,
          userId,
          createdAt: Date.now(),
        });
        await ctx.db.patch(userId, {
          name,
        });
        return { name };
      }
    }

    throw new Error("All guest names are taken. Add more names in convex/guests.ts.");
  },
});
