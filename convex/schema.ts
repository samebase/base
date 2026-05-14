import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    done: v.boolean(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
