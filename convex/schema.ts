import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One document for each guest and each Google account. The auth components keep the accounts and
  // sessions. `name` is public. `fullName` and `email` are private profile data, never an identity:
  // accounts are keyed by the hub's `sub`.
  users: defineTable({
    name: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_name", ["name"]),
  todos: defineTable({
    userId: v.id("users"),
    text: v.string(),
    done: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_user_created_at", ["userId", "createdAt"]),
});
