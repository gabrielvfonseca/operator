#!/usr/bin/env node
// Runtime post-build steps

import fs from "node:fs";
import path from "node:path";

console.error("[runtime-postbuild] Running runtime post-build steps...");

// Create essential dist files
try {
  const packageJson = {
    name: "@gabrielvfonseca/operator",
    version: "2026.7.2",
    main: "dist/entry.js",
  };
  fs.writeFileSync("./dist/package.json", JSON.stringify(packageJson, null, 2));
  console.error("[runtime-postbuild] Created dist/package.json");
} catch (error) {
  console.error("[runtime-postbuild] Warning: Could not create dist/package.json:", error);
}

console.error("[runtime-postbuild] Runtime post-build steps complete!");
