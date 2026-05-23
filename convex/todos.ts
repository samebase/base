import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const { array, boolean, id, null: nullValue, object, string } = v;

const MAX_TODOS_PER_USER = 50;
const MAX_TODO_TEXT_LENGTH = 280;

const vTodo = object({
  _id: id("todos"),
  creatorName: string(),
  text: string(),
  done: boolean(),
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
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_created_at", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_TODOS_PER_USER);
    const creatorName = user.name ?? "Guest";

    return todos.map((todo) => ({
      _id: todo._id,
      creatorName,
      text: todo.text,
      done: todo.done,
    }));
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
    if (text.length > MAX_TODO_TEXT_LENGTH) {
      throw new Error(`Todo text must be ${MAX_TODO_TEXT_LENGTH} characters or fewer`);
    }

    const existingTodos = await ctx.db
      .query("todos")
      .withIndex("by_user_created_at", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_TODOS_PER_USER);
    if (existingTodos.length >= MAX_TODOS_PER_USER) {
      throw new Error(`Todo limit reached: keep at most ${MAX_TODOS_PER_USER} todos`);
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
