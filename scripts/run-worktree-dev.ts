/// <reference types="node" />
// A linked worktree runs the same steps as the main checkout, with a cloud development deployment
// and a stage of its own, named after its directory.
import { runPrimaryDev } from "./run-primary-dev.ts";

await runPrimaryDev("linked");
