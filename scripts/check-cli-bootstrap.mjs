#!/usr/bin/env node
// Check if CLI bootstrap files exist

import fs from "node:fs";
import path from "node:path";

console.error("[check] Verifying CLI bootstrap files...");

const cliFiles = ["./dist/cli/run-main.js", "./dist/entry.js", "./dist/cli/gateway.js"];

const missingFiles = cliFiles.filter((file) => {
  try {
    const exists = fs.existsSync(file);
    if (!exists) console.error(`[check] Missing: ${file}`);
    return !exists;
  } catch {
    console.error(`[check] Error checking: ${file}`);
    return true;
  }
});

if (missingFiles.length > 0) {
  console.error(
    "[check] ERROR: CLI bootstrap files missing. Run bun run scripts/typescript-build.mjs first.",
  );
  console.error("[check] Missing files:");
  missingFiles.forEach((file) => console.error(`[check]   - ${file}`));
  process.exit(1);
}

console.error("[check] CLI bootstrap verification complete!");
