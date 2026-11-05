import { describe, expect, it } from "vite-plus/test";

import { repositoryOfRemote, stackName } from "./stack.ts";

describe("stack", () => {
  it("reads owner/name from https and SSH remotes", () => {
    expect(repositoryOfRemote("https://github.com/samebase/base.git\n")).toBe("samebase/base");
    expect(repositoryOfRemote("https://github.com/samebase/base")).toBe("samebase/base");
    expect(repositoryOfRemote("git@github.com:samebase/base.git")).toBe("samebase/base");
  });

  it("names no repository for a remote without owner/name", () => {
    expect(repositoryOfRemote("base")).toBeUndefined();
  });

  it("takes GITHUB_REPOSITORY first", () => {
    expect(stackName({ GITHUB_REPOSITORY: "owner/name" })).toBe("owner/name");
  });
});
