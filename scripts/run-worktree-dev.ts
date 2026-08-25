// Samebase starter dev launcher sha256:2c909750c45a3206e5d72c5b2559c22fb55a969ad906f93d46ef21e7f1420dad
/// <reference types="node" />
import process from "node:process";

import { runPrimaryDev } from "./run-primary-dev.ts";

process.env["CONVEX_AGENT_MODE"] = "anonymous";
runPrimaryDev();
