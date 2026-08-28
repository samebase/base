import { describe, expect, it } from "vite-plus/test";

import { getRouter } from "./router";

describe("router", () => {
  it("matches unknown paths with the catch-all route", () => {
    const { matchedRoutes } = getRouter().getMatchedRoutes("/definitely-not-a-route");

    expect(matchedRoutes.at(-1)?.id).toBe("/$");
  });
});
