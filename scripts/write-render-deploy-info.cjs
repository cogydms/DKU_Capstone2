const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const commit = process.env.RENDER_GIT_COMMIT;
if (!/^[0-9a-f]{40}$/.test(commit ?? "")) {
  throw new Error("Render did not provide a valid RENDER_GIT_COMMIT.");
}

const outputDirectory = process.argv[2] ?? "dist";
writeFileSync(join(outputDirectory, "deploy-info.json"), JSON.stringify({ commit }) + "\n");
