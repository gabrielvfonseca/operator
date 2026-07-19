#!/usr/bin/env node
// Bun-native TypeScript build system

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

console.error("[build] Starting Bun-native TypeScript compilation...");

// Resolve the local TypeScript compiler binary so the build does not depend on
// a shell PATH that includes node_modules/.bin.
const require = createRequire(import.meta.url);
const tscBin = path.join(path.dirname(require.resolve("typescript/package.json")), "bin", "tsc");

// Check if TypeScript is available
try {
  // Try to compile using Bun's built-in TypeScript support
  console.error("[build] Compiling with Bun's TypeScript transpiler...");
  execSync(`"${tscBin}" --project tsconfig.json --outDir dist`, { stdio: "inherit" });
  console.error("[build] TypeScript compilation complete!");
} catch (error) {
  console.error("[build] Error during TypeScript compilation:", error);
  process.exit(1);
}

console.error("[build] Build successful!");
