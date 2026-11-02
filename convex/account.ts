import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";

/**
 * Deletes the signed-in user: their to-dos, their profile, and every login and session. An app with
 * more tables that hold a user's data deletes those rows here too.
 */
export const deleteAccount = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_created_at", (q) => q.eq("userId", userId))
      .collect();
    for (const todo of todos) {
      await ctx.db.delete(todo._id);
    }
    // A second call from another tab finds the profile gone.
    if (await ctx.db.get(userId)) {
      await ctx.db.delete(userId);
    }
    await ctx.runMutation(components.auth.public.deleteUser, { userId });
    return null;
  },
});
