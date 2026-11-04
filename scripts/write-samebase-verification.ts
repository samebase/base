/// <reference types="node" />
// Writes samebase-verification.json into the directory of the built site, with the numeric GitHub
// id of this repository. samebase.com reads it at the site's root before it gives the deployment a
// client of the identity hub (alchemy.run.ts): GitHub's token of the run names the repository, and
// this file proves that the site belongs to the same one. GitHub Actions sets GITHUB_REPOSITORY_ID
// in every run, so a fork writes its own id with no change to any file. Without it, such as on a
// laptop, the site has no file and gets no client.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const [directory] = process.argv.slice(2);
if (directory === undefined) {
  throw new Error(
    "Name the directory of the built site: write-samebase-verification.ts dist/client",
  );
}
const repository = process.env["GITHUB_REPOSITORY_ID"];
if (repository) {
  await writeFile(
    join(directory, "samebase-verification.json"),
    `${JSON.stringify({ repository })}\n`,
  );
  console.log(`Wrote samebase-verification.json for repository ${repository}.`);
} else {
  console.log("No GITHUB_REPOSITORY_ID: the site has no samebase-verification.json.");
}
