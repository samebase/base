import { query } from "./_generated/server";

export const getWelcomeMessage = query({
  args: {},
  handler: async () => {
    return {
      title: "Convex is wired",
      detail: "Next commit adds the first real data model and CRUD flow.",
      generatedAt: Date.now(),
    };
  },
});
