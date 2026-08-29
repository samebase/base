// Samebase starter dev launcher sha256:9a19ac6550a3a4deb0617663c683f9ef45e76462f5069f1a24e43faccba4f71c
// Samebase source build: v1989
/// <reference types="node" />
import process from "node:process";

import { runPrimaryDev } from "./run-primary-dev.ts";

process.env["CONVEX_AGENT_MODE"] = "anonymous";
runPrimaryDev();
