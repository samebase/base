import { describe, expect, it } from "vite-plus/test";

import { samebaseVerification } from "./samebaseVerification";

describe("samebase-verification", () => {
  it("answers the repository id as JSON", async () => {
    const response = samebaseVerification("123");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ repository: "123" });
  });

  it("answers 404 while the variable is unset or empty", () => {
    expect(samebaseVerification(undefined).status).toBe(404);
    expect(samebaseVerification("").status).toBe(404);
  });
});
