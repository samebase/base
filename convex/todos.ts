import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const { array, boolean, id, null: nullValue, number, object, string } = v;

const vTodo = object({
  _id: id("todos"),
  _creationTime: number(),
  userId: id("users"),
  text: string(),
  done: boolean(),
  createdAt: number(),
});

const listResultValidator = array(vTodo);
const createResultValidator = nullValue();
const toggleResultValidator = nullValue();

async function getRequiredUserId(ctx: { auth: Auth }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const list = query({
  args: {},
  returns: listResultValidator,
  handler: async (ctx) => {
    const userId = await getRequiredUserId(ctx);
    return await ctx.db
      .query("todos")
      .withIndex("by_user_created_at", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    text: string(),
  },
  returns: createResultValidator,
  handler: async (ctx, args) => {
    const userId = await getRequiredUserId(ctx);
    const text = args.text.trim();
    if (!text) {
      throw new Error("Todo text cannot be empty");
    }

    await ctx.db.insert("todos", {
      userId,
      text,
      done: false,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const toggle = mutation({
  args: {
    id: id("todos"),
  },
  returns: toggleResultValidator,
  handler: async (ctx, args) => {
    const userId = await getRequiredUserId(ctx);
    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }
    if (todo.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      done: !todo.done,
    });
    return null;
  },
});
