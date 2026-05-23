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
const FALLBACK_GUEST_NAME_SPACE = 36 ** 6;

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

function fallbackGuestName(userId: string) {
  let hash = 0;
  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) % FALLBACK_GUEST_NAME_SPACE;
  }
  return `Guest ${hash.toString(36).padStart(6, "0")}`;
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

    // Anonymous sessions can outnumber the friendly pool in public previews.
    const name = fallbackGuestName(userId);
    await ctx.db.insert("guestNames", {
      name,
      userId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(userId, {
      name,
    });
    return { name };
  },
});
