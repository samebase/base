import { httpRouter } from "convex/server";
import { routeAll } from "@samebase/convex-hosting";
import { components } from "./_generated/api";
import { env, httpAction } from "./_generated/server";
import { samebaseVerification } from "./samebaseVerification";
import { assets } from "../.convex-hosting/version.js";
// Type only, nothing is bundled: the server build imported below.
import type {} from "@samebase/convex-hosting-tanstack-start/server-build";
import server from "../dist/server/server.js";

const http = httpRouter();

// Every method, every path, as a Cloudflare Worker with static assets: a file of the build, else the
// page that src/server.ts renders. `pnpm run deploy` writes the build and .convex-hosting/version.js.
const handler = routeAll({ http, component: components.hosting, assets, worker: server });
// Exact routes for the three auth paths of src/server.ts: the Convex Auth component holds the /auth
// prefix, where it serves the key set, and the longest prefix wins, so the catch-all above never
// sees them.
for (const path of ["/auth/signin", "/auth/refresh", "/auth/signout"]) {
  http.route({ path, method: "POST", handler });
}
// The identity hub reads this file at registration (RFC 129 and 133). An exact route wins over the
// catch-all and over an uploaded file, so the variable alone decides the answer.
http.route({
  path: "/samebase-verification.json",
  method: "GET",
  handler: httpAction(async () => samebaseVerification(env.SAMEBASE_REPOSITORY_ID)),
});

export default http;
