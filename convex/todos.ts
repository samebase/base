import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_TODOS = 200;

function getNormalizedSortOrder(todo: { sortOrder?: number }, fallback: number) {
  return todo.sortOrder ?? fallback;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_TODOS);

    return todos
      .map((todo, index) => ({
        ...todo,
        sortOrder: getNormalizedSortOrder(todo, index),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
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

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_TODOS);

    const nextSortOrder = todos.reduce(
      (highestSortOrder, todo, index) =>
        Math.max(highestSortOrder, getNormalizedSortOrder(todo, index)),
      -1,
    );

    await ctx.db.insert("todos", {
      text,
      done: false,
      createdAt: Date.now(),
      sortOrder: nextSortOrder + 1,
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

export const move = mutation({
  args: {
    id: v.id("todos"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_TODOS);

    const normalized = todos
      .map((todo, index) => ({
        _id: todo._id,
        sortOrder: getNormalizedSortOrder(todo, index),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (let index = 0; index < normalized.length; index += 1) {
      const item = normalized[index];
      if (item.sortOrder !== index) {
        await ctx.db.patch(item._id, { sortOrder: index });
      }
    }

    const currentIndex = normalized.findIndex((todo) => todo._id === args.id);
    if (currentIndex === -1) {
      throw new Error("Todo not found");
    }

    const targetIndex = args.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= normalized.length) {
      return;
    }

    const currentTodo = normalized[currentIndex];
    const targetTodo = normalized[targetIndex];

    await ctx.db.patch(currentTodo._id, { sortOrder: targetIndex });
    await ctx.db.patch(targetTodo._id, { sortOrder: currentIndex });
  },
});
