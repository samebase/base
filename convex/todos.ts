import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("todos").withIndex("by_created_at").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const text = args.text.trim();
    if (!text) {
      throw new Error("Todo text cannot be empty");
    }

    await ctx.db.insert("todos", {
      text,
      done: false,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    await ctx.db.patch(args.id, {
      done: !todo.done,
    });
  },
});
